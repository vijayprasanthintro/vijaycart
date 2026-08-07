const catchAsyncError = require('../middlewares/catchAsyncError');
const User = require('../models/userModel');
const DeliveryPerson = require('../models/deliveryPersonModel');
const Otp = require('../models/otpModel');
const ErrorHandler = require('../utils/errorHandler');
const sendEmail = require('../utils/email');
const sendToken = require('../utils/jwt');
const crypto = require('crypto');

const OTP_EXPIRES_MS = (Number(process.env.OTP_EXPIRES_MINUTES) || 5) * 60 * 1000;
const RESEND_SECONDS = Number(process.env.OTP_RESEND_SECONDS) || 30;
const MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) || 5;

const normalizeMobile = (m) => {
    let digits = String(m || '').replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    return digits;
};

const isValidMobile = (m) => /^[6-9]\d{9}$/.test(normalizeMobile(m));

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());

const maskEmail = (e) => {
    const [name, domain] = String(e).split('@');
    return `${name.slice(0, 2)}***@${domain}`;
};

const maskMobile = (m) => `${m.slice(0, 2)}*****${m.slice(-3)}`;

const generateOtp = () => String(crypto.randomInt(100000, 1000000));

// Hash the OTP with the user id as a per-user salt so a leaked hash cannot be
// replayed against another account.
const hashOtp = (otp, user) => crypto.createHash('sha256').update(`${otp}:${user._id}`).digest('hex');

const displayTarget = (user) => (user.email ? maskEmail(user.email) : maskMobile(user.mobile));

//Step 1 & 3: Request a new OTP - /api/v1/otp/request
exports.requestOtp = catchAsyncError(async (req, res, next) => {
    const { mobile, email } = req.body || {};

    if (!mobile && !email) {
        return next(new ErrorHandler('Please enter your mobile number or email', 400));
    }

    const purpose = String(req.body.purpose || 'customer');
    const isDeliveryLogin = purpose === 'delivery';

    let identifier = null;
    let isNewUser = false;
    let user = null;

    // Primary identity: mobile number (OTP-first signup).
    if (mobile && isValidMobile(mobile)) {
        identifier = normalizeMobile(mobile);
        user = await User.findOne({ mobile: identifier });
    }

    // Legacy accounts that never set a mobile can sign in with their email.
    if (!user && email && isValidEmail(email)) {
        identifier = String(email).trim().toLowerCase();
        user = await User.findOne({ email: identifier });
    }

    // Legacy delivery boys may only have a phone on their DeliveryPerson
    // profile — resolve by that so existing partners keep their number.
    if (!user && isDeliveryLogin && mobile && isValidMobile(mobile)) {
        const person = await DeliveryPerson.findOne({ phone: normalizeMobile(mobile) });
        if (person) {
            user = await User.findById(person.user);
        }
    }

    // Delivery partners cannot self-register — an admin must create them.
    if (!user && isDeliveryLogin) {
        return next(new ErrorHandler('No delivery account found with this mobile number. Please contact the store.', 404));
    }

    // Unknown number + a valid email supplied -> self-register the account.
    if (!user && email && isValidEmail(email)) {
        const rawName = String(email).split('@')[0].replace(/[._-]+/g, ' ').trim();
        const name = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'VijayCart User';
        try {
            user = await User.create({
                name,
                email: String(email).trim().toLowerCase(),
                mobile: mobile && isValidMobile(mobile) ? normalizeMobile(mobile) : undefined
            });
            isNewUser = true;
        } catch (error) {
            if (error.code === 11000) {
                return next(new ErrorHandler('An account already exists with this email or mobile. Please login.', 409));
            }
            throw error;
        }
    }

    if (!user) {
        return next(new ErrorHandler('No account found with this mobile number. Enter your email to create a new account.', 404));
    }

    if (isDeliveryLogin && user.role !== 'deliveryboy') {
        return next(new ErrorHandler('You are not registered as a delivery partner.', 403));
    }

    const now = Date.now();

    // Enforce the resend cooldown (30s by default) per user.
    const latest = await Otp.findOne({ user: user._id, consumedAt: null }).sort({ createdAt: -1 });
    if (latest && now - latest.lastRequestedAt.getTime() < RESEND_SECONDS * 1000) {
        const wait = Math.max(1, Math.ceil((RESEND_SECONDS * 1000 - (now - latest.lastRequestedAt.getTime())) / 1000));
        return next(new ErrorHandler(`Please wait ${wait}s before requesting a new OTP.`, 429));
    }

    const otp = generateOtp();
    await Otp.create({
        user: user._id,
        otpHash: hashOtp(otp, user),
        attempts: 0,
        lastRequestedAt: new Date(now),
        expiresAt: new Date(now + OTP_EXPIRES_MS)
    });

    // Deliver the OTP through the existing SMTP transport.
    try {
        await sendEmail({
            email: user.email,
            subject: 'VijayCart Login OTP',
            message: `Your VijayCart OTP is ${otp}.\n\n` +
                `This OTP is valid for ${Math.round(OTP_EXPIRES_MS / 60000)} minutes. ` +
                `Do not share this OTP with anyone.\n\n` +
                `If you did not request this OTP, you can safely ignore this email.`
        });
    } catch (error) {
        return next(new ErrorHandler('Could not send the OTP. Please try again in a moment.', 500));
    }

    res.status(200).json({
        success: true,
        userId: user._id,
        to: displayTarget(user),
        resendIn: RESEND_SECONDS,
        expiresIn: Math.round(OTP_EXPIRES_MS / 60000),
        isNewUser
    });
});

//Step 2: Verify the OTP and log the user in - /api/v1/otp/verify
exports.verifyOtp = catchAsyncError(async (req, res, next) => {
    const { userId, otp } = req.body || {};

    if (!userId) {
        return next(new ErrorHandler('Session expired. Please request a new OTP.', 400));
    }
    if (!otp) {
        return next(new ErrorHandler('Please enter the OTP', 400));
    }
    if (!/^\d{6}$/.test(String(otp))) {
        return next(new ErrorHandler('OTP must be a 6-digit number', 400));
    }

    const user = await User.findById(userId);
    if (!user) {
        return next(new ErrorHandler('Invalid request. Please request a new OTP.', 404));
    }

    if (String(req.body.purpose || 'customer') === 'delivery' && user.role !== 'deliveryboy') {
        return next(new ErrorHandler('You are not registered as a delivery partner.', 403));
    }

    const otpDoc = await Otp.findOne({ user: user._id, consumedAt: null }).sort({ createdAt: -1 });
    if (!otpDoc) {
        return next(new ErrorHandler('No active OTP found. Please request a new one.', 400));
    }
    if (otpDoc.expiresAt.getTime() < Date.now()) {
        return next(new ErrorHandler('OTP has expired. Please request a new one.', 400));
    }
    if (otpDoc.attempts >= MAX_ATTEMPTS) {
        return next(new ErrorHandler('Too many incorrect attempts. Please request a new OTP.', 429));
    }

    if (otpDoc.otpHash !== hashOtp(String(otp), user)) {
        otpDoc.attempts += 1;
        await otpDoc.save();
        const left = MAX_ATTEMPTS - otpDoc.attempts;
        const message = left > 0
            ? `Incorrect OTP. ${left} attempt${left === 1 ? '' : 's'} left.`
            : 'Incorrect OTP. Please request a new one.';
        return next(new ErrorHandler(message, 400));
    }

    otpDoc.consumedAt = new Date();
    await otpDoc.save();

    if (!user.mobileVerifiedAt) {
        user.mobileVerifiedAt = new Date();
        await user.save({ validateBeforeSave: false });
    }

    sendToken(user, 200, res);
});
