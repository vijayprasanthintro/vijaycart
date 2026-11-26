const catchAsyncError = require('../middlewares/catchAsyncError');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const DeliveryPerson = require('../models/deliveryPersonModel');
const SellerApplication = require('../models/sellerApplicationModel');
const ErrorHandler = require('../utils/errorHandler');
const sendToken = require('../utils/jwt');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const countOtherActiveAdmins = (userId) => User.countDocuments({
    role: 'admin',
    isDeleted: { $ne: true },
    _id: { $ne: userId }
});

// Google Sign-In: verify the ID token, then use the normal VijayCart JWT cookie.
exports.googleLogin = catchAsyncError(async (req, res, next) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
        return next(new ErrorHandler('Google login is not configured yet. Please sign in with OTP.', 503));
    }

    const { credential } = req.body || {};
    if (!credential || typeof credential !== 'string') {
        return next(new ErrorHandler('Google sign-in failed: no credential received.', 400));
    }

    let payload;
    try {
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
        payload = ticket.getPayload();
    } catch (error) {
        return next(new ErrorHandler('Google sign-in could not be verified. Please try again.', 401));
    }

    if (!payload || !payload.email) {
        return next(new ErrorHandler('Google account has no email address. Please sign in with OTP.', 400));
    }

    if (payload.email_verified === false) {
        return next(new ErrorHandler('Your Google email is not verified. Please verify it with Google or sign in with OTP.', 401));
    }

    const normalizedEmail = String(payload.email).trim().toLowerCase();
    const googleId = payload.sub;

    // Match by Google id first, then by verified email — a user who already
    // has an OTP account gets their googleId linked to the same profile.
    let user = await User.findOne({
        $or: [{ googleId }, { email: normalizedEmail }]
    });

    if (user && user.isDeleted) {
        return next(new ErrorHandler('This account has been deactivated. Please contact support.', 403));
    }

    if (!user) {
        try {
            user = await User.create({
                name: payload.name ? String(payload.name).slice(0, 50) : 'VijayCart User',
                email: normalizedEmail,
                googleId,
                avatar: payload.picture
            });
        } catch (error) {
            if (error.code === 11000) {
                return next(new ErrorHandler('An account already exists with this email. Please sign in with OTP.', 409));
            }
            throw error;
        }
    } else if (!user.googleId) {
        // Link an existing OTP account to Google and adopt the profile photo
        // if the account never uploaded one.
        user.googleId = googleId;
        if (payload.picture && !user.avatar) user.avatar = payload.picture;
        await user.save({ validateBeforeSave: false });
    }

    sendToken(user, 200, res);
});

const getFrontendUrl = (req) => {
    const configured = (process.env.FRONTEND_URL || '').split(',')[0].trim().replace(/\/$/, '');
    if (process.env.NODE_ENV !== 'production') {
        const host = String(req.get('host') || '');
        if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
            return 'http://localhost:3000';
        }
    }
    if (configured) return configured;
    if (process.env.NODE_ENV !== 'production') return 'http://localhost:3000';
    return `${req.protocol}://${req.get('host')}`;
};

const getGoogleRedirectUri = (req) => {
    const callbackPath = '/api/v1/google/callback';
    const trimUrl = (value) => String(value || '').trim().replace(/\/$/, '');
    const host = String(req.get('host') || '');

    // Local development must use the local API so the cookie is stored for
    // localhost and the CRA proxy can forward it to the backend.
    if (process.env.NODE_ENV !== 'production' && /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)) {
        return `${req.protocol}://${host}${callbackPath}`;
    }

    // Production must return to the frontend origin. Vercel rewrites /api/*
    // to this backend, so the same handler runs while the OAuth state and JWT
    // cookies stay on the VijayCart domain the browser actually uses.
    const frontend = trimUrl(String(process.env.FRONTEND_URL || '').split(',')[0]);
    if (process.env.NODE_ENV === 'production' && frontend) {
        try {
            return `${new URL(frontend).origin}${callbackPath}`;
        } catch (e) { /* fall through to the configured value */ }
    }

    const configured = trimUrl(process.env.GOOGLE_CALLBACK_URL || process.env.GOOGLE_REDIRECT_URI);
    if (configured.endsWith(callbackPath)) return configured;

    const backend = trimUrl(process.env.BACKEND_URL || `${req.protocol}://${host}`);
    return `${backend}${callbackPath}`;
};

const safeRedirectPath = (value) => {
    if (typeof value !== 'string') return '/';
    const trimmed = value.trim();
    if (!trimmed) return '/';
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('//')) return '/';
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

const oauthCookieOptions = () => {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
        path: '/',
        maxAge: 10 * 60 * 1000
    };
};

// Full-page Google OAuth redirect (start) - GET /api/v1/google
exports.googleAuthStart = catchAsyncError(async (req, res, next) => {
    const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
    if (!clientId || !clientSecret) {
        return next(new ErrorHandler('Google login is not configured yet. Please sign in with OTP.', 503));
    }

    const redirectUri = getGoogleRedirectUri(req);
    const redirectPath = safeRedirectPath(req.query.redirect);
    const frontend = getFrontendUrl(req);
    const state = crypto.randomBytes(24).toString('hex');

    res.cookie('google_oauth_state', JSON.stringify({ state, redirect: redirectPath, frontend }), oauthCookieOptions());

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        prompt: 'select_account',
        access_type: 'online',
        include_granted_scopes: 'true',
        state
    });

    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// Full-page Google OAuth redirect (callback) - GET /api/v1/google/callback
exports.googleCallback = catchAsyncError(async (req, res, next) => {
    let frontend = getFrontendUrl(req);
    const redirectWithError = (message, redirect = '/') => {
        const url = new URL('/login', frontend);
        url.searchParams.set('error', message);
        if (redirect && redirect !== '/') url.searchParams.set('redirect', safeRedirectPath(redirect));
        return res.redirect(url.toString());
    };

    const { code, state, error } = req.query || {};

    let savedState = null;
    try {
        savedState = req.cookies && req.cookies.google_oauth_state
            ? JSON.parse(req.cookies.google_oauth_state)
            : null;
    } catch (e) {
        savedState = null;
    }
    res.clearCookie('google_oauth_state', { ...oauthCookieOptions(), maxAge: undefined });

    if (savedState && typeof savedState.frontend === 'string') {
        try {
            const candidate = new URL(savedState.frontend).origin;
            const allowed = String(process.env.FRONTEND_URL || '')
                .split(',')
                .map(s => s.trim().replace(/\/$/, ''))
                .filter(Boolean);
            const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(candidate);
            if (isLocal || allowed.includes(candidate)) frontend = candidate;
        } catch (e) { /* ignore invalid frontend */ }
    }

    if (error) {
        const message = error === 'access_denied'
            ? 'Google sign-in was cancelled.'
            : 'Google sign-in failed. Please try again.';
        return redirectWithError(message, savedState?.redirect || '/');
    }

    if (!code || !state || !savedState || savedState.state !== state) {
        return redirectWithError('Google sign-in could not be verified. Please try again.');
    }

    const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
    if (!clientId || !clientSecret) {
        return redirectWithError('Google login is not configured yet. Please sign in with OTP.', savedState.redirect);
    }

    const redirectUri = getGoogleRedirectUri(req);
    const client = new OAuth2Client(clientId, clientSecret, redirectUri);

    let payload;
    try {
        const { tokens } = await client.getToken(String(code));
        if (!tokens || !tokens.id_token) {
            return redirectWithError('Google sign-in failed: no identity token received.', savedState.redirect);
        }
        const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
        payload = ticket.getPayload();
    } catch (err) {
        return redirectWithError('Google sign-in could not be verified. Please try again.', savedState.redirect);
    }

    if (!payload || !payload.email) {
        return redirectWithError('Google account has no email address. Please sign in with OTP.', savedState.redirect);
    }
    if (payload.email_verified === false) {
        return redirectWithError('Your Google email is not verified. Please sign in with OTP.', savedState.redirect);
    }

    const normalizedEmail = String(payload.email).trim().toLowerCase();
    const googleId = payload.sub;
    let user = await User.findOne({ $or: [{ googleId }, { email: normalizedEmail }] });

    if (user && user.isDeleted) {
        return redirectWithError('This account has been deactivated. Please contact support.', savedState.redirect);
    }

    if (!user) {
        try {
            user = await User.create({
                name: payload.name ? String(payload.name).slice(0, 50) : 'VijayCart User',
                email: normalizedEmail,
                googleId,
                avatar: payload.picture
            });
        } catch (createError) {
            if (createError.code === 11000) {
                return redirectWithError('An account already exists with this email. Please sign in with OTP.', savedState.redirect);
            }
            throw createError;
        }
    } else if (!user.googleId) {
        user.googleId = googleId;
        if (payload.picture && !user.avatar) user.avatar = payload.picture;
        await user.save({ validateBeforeSave: false });
    }

    const token = user.getJwtToken();
    const isProd = process.env.NODE_ENV === 'production';
    const cookieDays = parseInt(process.env.COOKIE_EXPIRES_TIME, 10);
    const cookieMaxAge = (Number.isFinite(cookieDays) && cookieDays > 0 ? cookieDays : 7) * 24 * 60 * 60 * 1000;
    res.cookie('token', token, {
        maxAge: cookieMaxAge,
        httpOnly: true,
        sameSite: isProd ? 'none' : 'lax',
        secure: isProd,
        path: '/'
    });

    const target = safeRedirectPath(savedState.redirect || '/');
    const destination = new URL(target, frontend);
    destination.searchParams.set('auth', 'google_success');
    return res.redirect(destination.toString());
});

//Get Wishlist - /api/v1/wishlist
exports.getWishlist = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id).populate({
        path: 'wishlist',
        select: 'name price mrp discount brand images ratings stock seller numOfReviews category warranty'
    });
    const wishlist = (user && user.wishlist ? user.wishlist : []).filter(Boolean);
    res.status(200).json({
        success: true,
        wishlist
    });
});

//Add to Wishlist - /api/v1/wishlist/:productId
exports.addToWishlist = catchAsyncError(async (req, res, next) => {
    const { productId } = req.params;
    const product = await Product.findById(productId).select('_id');
    if (!product) {
        return next(new ErrorHandler('Product not found', 404));
    }
    const user = await User.findById(req.user.id);
    const alreadyAdded = (user.wishlist || []).some(id => id && id.toString() === productId);
    if (!alreadyAdded) {
        user.wishlist.push(product._id);
        await user.save({ validateBeforeSave: false });
    }
    res.status(200).json({
        success: true,
        message: 'Added to wishlist'
    });
});

//Remove from Wishlist - /api/v1/wishlist/:productId
exports.removeFromWishlist = catchAsyncError(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { $pull: { wishlist: req.params.productId } });
    res.status(200).json({
        success: true,
        message: 'Removed from wishlist'
    });
});

//Clear Wishlist - /api/v1/wishlist (DELETE)
exports.clearWishlist = catchAsyncError(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { $set: { wishlist: [] } });
    res.status(200).json({
        success: true,
        message: 'Wishlist cleared'
    });
});

//Logout - /api/v1/logout
exports.logoutUser = (req, res, next) => {
    const isProd = process.env.NODE_ENV === 'production';
    // Clear the token cookie with flags matching how it was set, otherwise the
    // browser keeps it and the next refresh logs the user straight back in.
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite: isProd ? 'none' : 'lax',
        secure: isProd,
        path: '/'
    })
    .status(200)
    .json({
        success: true,
        message: "Loggedout"
    })

}

//Public (non-sensitive) auth config for the frontend - /api/v1/auth/config
//Lets the login page know whether "Continue with Google" is wired up. The
//client id itself is public by design (it ships in the browser anyway); only
//the presence/absence and the id are exposed, never the secret.
exports.getPublicConfig = (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID ? String(process.env.GOOGLE_CLIENT_ID).trim() : '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ? String(process.env.GOOGLE_CLIENT_SECRET).trim() : '';
    res.status(200).json({
        success: true,
        config: {
            googleClientId: clientId || null,
            googleAvailable: Boolean(clientId && clientSecret)
        }
    });
};

//Get User Profile - /api/v1/myprofile
exports.getUserProfile = catchAsyncError(async (req, res, next) => {
   const user = await User.findById(req.user.id)
   res.status(200).json({
        success:true,
        user
   })
})

//Update Profile - /api/v1/update
exports.updateProfile = catchAsyncError(async (req, res, next) => {
    const mobile = req.body.mobile ? String(req.body.mobile).replace(/\D/g, '') : undefined;
    let newUserData = {
        name: req.body.name,
        email: req.body.email,
        mobile
    }

    let avatar;
    let BASE_URL = process.env.BACKEND_URL;
    if(process.env.NODE_ENV === "production"){
        BASE_URL = `${req.protocol}://${req.get('host')}`
    }

    if(req.file){
        avatar = `${BASE_URL}/uploads/user/${req.file.originalname}`
        newUserData = {...newUserData,avatar }
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
    })

    res.status(200).json({
        success: true,
        user
    })

})

// ---------- Saved delivery addresses (per authenticated user) ----------
//
// Every lookup starts from req.user.id, which the authenticate middleware
// resolves from the JWT cookie — never from a body/param supplied by the
// client. That makes cross-user access structurally impossible: there is no
// endpoint that accepts a user id for addresses at all.

const ADDRESS_FIELDS = [
    'name', 'phoneNo', 'address', 'landmark', 'instructions',
    'city', 'state', 'district', 'locality', 'postalCode', 'country', 'countryCode', 'type'
];

const pickAddressFields = (body = {}) => {
    const out = {};
    for (const field of ADDRESS_FIELDS) {
        if (body[field] !== undefined) out[field] = body[field];
    }
    if (typeof out.name === 'string') out.name = out.name.trim();
    if (typeof out.phoneNo === 'string') out.phoneNo = String(out.phoneNo).replace(/\s/g, '');
    if (typeof out.postalCode === 'string') out.postalCode = out.postalCode.trim();
    if (typeof out.countryCode === 'string') out.countryCode = out.countryCode.trim().toUpperCase();
    return out;
};

const ensureSingleDefault = (user, preferredId) => {
    const list = user.addresses || [];
    const hasDefault = list.some(a => a.isDefault);
    if (!hasDefault && list.length) {
        const target = (preferredId && list.find(a => String(a._id) === String(preferredId))) || list[0];
        target.isDefault = true;
    }
};

//Get saved addresses - GET /api/v1/myaddresses
exports.getAddresses = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('addresses');
    let addresses = user?.addresses || [];
    // Safety net: exactly one default must exist once any address is saved.
    if (addresses.length && !addresses.some(a => a.isDefault)) {
        await User.updateOne(
            { _id: req.user.id },
            { $set: { 'addresses.0.isDefault': true } }
        );
        addresses = addresses.map((a, i) => (i === 0 ? { ...a.toObject?.() || a, isDefault: true } : a));
    }
    res.status(200).json({
        success: true,
        addresses
    });
});

//Add address - POST /api/v1/myaddresses
exports.addAddress = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('addresses');
    if (!user) return next(new ErrorHandler('Please login to continue', 401));

    const data = pickAddressFields(req.body);
    // Completeness guard for new addresses (PUT may legitimately patch one
    // field, so this check only applies when creating).
    const REQUIRED_ADDRESS_FIELDS = ['name', 'phoneNo', 'address', 'city', 'state', 'postalCode', 'country'];
    const missing = REQUIRED_ADDRESS_FIELDS.filter(f => !String(data[f] || '').trim());
    if (missing.length) {
        return next(new ErrorHandler('Please fill all the required address fields', 400));
    }

    const countryName = String(data.country || '').trim();
    if (countryName.toLowerCase() === 'india') {
        data.country = 'India';
        data.countryCode = 'IN';
        if (data.postalCode && !/^[1-9][0-9]{5}$/.test(String(data.postalCode).trim())) {
            return next(new ErrorHandler('Please enter a valid 6-digit Indian PIN code', 400));
        }
        const phoneDigits = String(data.phoneNo || '').replace(/\D/g, '');
        const normalizedPhone = phoneDigits.length === 12 && phoneDigits.startsWith('91') ? phoneDigits.slice(2) : phoneDigits;
        if (data.phoneNo && !/^[6-9]\d{9}$/.test(normalizedPhone)) {
            return next(new ErrorHandler('Please enter a valid 10-digit Indian mobile number', 400));
        }
        if (data.phoneNo) data.phoneNo = normalizedPhone;
    } else if (countryName && !data.countryCode) {
        data.countryCode = '';
    }

    const makeDefault = Boolean(req.body.isDefault) || (user.addresses || []).length === 0;

    if (makeDefault) {
        (user.addresses || []).forEach(a => { a.isDefault = false; });
    }
    user.addresses.push({ ...data, isDefault: makeDefault });
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
        success: true,
        addresses: user.addresses
    });
});

//Update address - PUT /api/v1/myaddresses/:id
exports.updateAddress = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('addresses');
    if (!user) return next(new ErrorHandler('Please login to continue', 401));

    const addr = (user.addresses || []).id(req.params.id);
    if (!addr) return next(new ErrorHandler('Address not found', 404));

    const data = pickAddressFields(req.body);
    const effectiveCountry = String((data.country !== undefined ? data.country : addr.country) || '').trim();
    if (effectiveCountry.toLowerCase() === 'india') {
        if (data.country !== undefined) data.country = 'India';
        data.countryCode = 'IN';
        const effectivePostal = String((data.postalCode !== undefined ? data.postalCode : addr.postalCode) || '').trim();
        if (effectivePostal && !/^[1-9][0-9]{5}$/.test(effectivePostal)) {
            return next(new ErrorHandler('Please enter a valid 6-digit Indian PIN code', 400));
        }
        const rawPhone = String((data.phoneNo !== undefined ? data.phoneNo : addr.phoneNo) || '');
        const phoneDigits = rawPhone.replace(/\D/g, '');
        const normalizedPhone = phoneDigits.length === 12 && phoneDigits.startsWith('91') ? phoneDigits.slice(2) : phoneDigits;
        if (rawPhone && !/^[6-9]\d{9}$/.test(normalizedPhone)) {
            return next(new ErrorHandler('Please enter a valid 10-digit Indian mobile number', 400));
        }
        if (data.phoneNo !== undefined || rawPhone) data.phoneNo = normalizedPhone;
    }
    Object.assign(addr, data);

    if (req.body.isDefault === true) {
        user.addresses.forEach(a => { a.isDefault = false; });
        addr.isDefault = true;
    }
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        addresses: user.addresses
    });
});

//Delete address - DELETE /api/v1/myaddresses/:id
exports.deleteAddress = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('addresses');
    if (!user) return next(new ErrorHandler('Please login to continue', 401));

    const addr = (user.addresses || []).id(req.params.id);
    if (!addr) return next(new ErrorHandler('Address not found', 404));

    addr.deleteOne();

    // If the removed one was the default, promote the first remaining address.
    if (!(user.addresses || []).some(a => a.isDefault)) {
        ensureSingleDefault(user);
    }
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        addresses: user.addresses
    });
});

//Set default address - PATCH /api/v1/myaddresses/:id/default
exports.setDefaultAddress = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('addresses');
    if (!user) return next(new ErrorHandler('Please login to continue', 401));

    const addr = (user.addresses || []).id(req.params.id);
    if (!addr) return next(new ErrorHandler('Address not found', 404));

    user.addresses.forEach(a => { a.isDefault = false; });
    addr.isDefault = true;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        addresses: user.addresses
    });
});

//Admin: Get All Users - /api/v1/admin/users
exports.getAllUsers = catchAsyncError(async (req, res, next) => {
   const users = await User.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
   res.status(200).json({
        success: true,
        users
   })
})

//Admin: Get Specific User - api/v1/admin/user/:id
exports.getUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if(!user || user.isDeleted) {
        return next(new ErrorHandler(`User not found with this id ${req.params.id}`, 404))
    }
    res.status(200).json({
        success: true,
        user
   })
});

//Admin: Update User - api/v1/admin/user/:id
exports.updateUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
        return next(new ErrorHandler(`User not found with this id ${req.params.id}`, 404))
    }

    // Prevent changing own role (UI also blocks, enforce on backend)
    if (String(user._id) === String(req.user.id) && req.body.role && req.body.role !== user.role) {
        return next(new ErrorHandler('You cannot change your own role', 400))
    }

    // Prevent demoting/removing the last active admin
    if (user.role === 'admin' && req.body.role && req.body.role !== 'admin') {
        const otherActiveAdmins = await countOtherActiveAdmins(user._id);
        if (otherActiveAdmins < 1) {
            return next(new ErrorHandler('Cannot change role of the last active admin account', 400))
        }
    }

    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile ? String(req.body.mobile).replace(/\D/g, '') : undefined,
        role: req.body.role
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
    })

    res.status(200).json({
        success: true,
        user: updatedUser
    })
})

//Admin: Delete User - api/v1/admin/user/:id
exports.deleteUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if(!user || user.isDeleted) {
        return next(new ErrorHandler(`User not found with this id ${req.params.id}`, 404))
    }

    // Prevent self-delete
    if (String(user._id) === String(req.user.id)) {
        return next(new ErrorHandler('You cannot delete your own account', 400))
    }

    // Prevent deleting the last active admin
    if (user.role === 'admin') {
        const otherActiveAdmins = await countOtherActiveAdmins(user._id);
        if (otherActiveAdmins < 1) {
            return next(new ErrorHandler('Cannot delete the last active admin account', 400))
        }
    }

    const [customerOrderCount, deliveryOrderCount, sellerApplicationCount] = await Promise.all([
        Order.countDocuments({ user: user._id }),
        Order.countDocuments({ deliveryBoy: user._id }),
        SellerApplication.countDocuments({ user: user._id })
    ]);
    const hasAssociatedRecords = customerOrderCount > 0 || deliveryOrderCount > 0 || sellerApplicationCount > 0;

    if (hasAssociatedRecords) {
        // Safe strategy: soft-delete/deactivate to preserve order/business records.
        if (user.role === 'deliveryboy') {
            await Order.updateMany(
                { deliveryBoy: user._id, orderStatus: { $nin: ['Delivered', 'Cancelled', 'Cancelled by Customer'] } },
                { $unset: { deliveryBoy: 1 } }
            );
            await DeliveryPerson.deleteOne({ user: user._id });
        }

        const tombstone = `deleted_${String(user._id)}_${Date.now()}`;
        user.isDeleted = true;
        user.deletedAt = new Date();
        user.deletedBy = req.user.id;
        user.name = user.name || 'Deleted User';
        user.email = `${tombstone}@deleted.vijaycart.local`;
        user.username = undefined;
        user.mobile = undefined;
        user.googleId = undefined;
        user.password = undefined;
        user.avatar = undefined;
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpire = undefined;
        user.wishlist = [];
        user.addresses = [];
        await user.save({ validateBeforeSave: false });

        return res.status(200).json({
            success: true,
            message: 'Account has associated records and was safely deactivated. It can no longer log in.',
            mode: 'soft-delete'
        })
    }

    // No associated business records: hard delete from MongoDB.
    if (user.role === 'deliveryboy') {
        await DeliveryPerson.deleteOne({ user: user._id });
    }
    await SellerApplication.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id });

    res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        mode: 'hard-delete'
    })
})
