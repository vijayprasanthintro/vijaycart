const catchAsyncError = require('../middlewares/catchAsyncError');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');
const sendToken = require('../utils/jwt');
const { OAuth2Client } = require('google-auth-library');

//Google Sign-In (token verification) - /api/v1/google
//The frontend obtains a Google ID token via Google Identity Services and posts
//it here. The backend verifies the token with google-auth-library using the
//GOOGLE_CLIENT_ID, then creates or links the account and issues the normal
//VijayCart JWT cookie — the rest of the app (auth cache, protected routes,
//cart/checkout) is untouched.
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

    const normalizedEmail = String(payload.email).trim().toLowerCase();
    const googleId = payload.sub;

    // Match by Google id first, then by verified email — a user who already
    // has an OTP account gets their googleId linked to the same profile.
    let user = await User.findOne({
        $or: [{ googleId }, { email: normalizedEmail }]
    });

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
    res.status(200).json({
        success: true,
        config: {
            googleClientId: clientId || null,
            googleAvailable: Boolean(clientId)
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
    'city', 'state', 'district', 'locality', 'postalCode', 'country', 'type'
];

const pickAddressFields = (body = {}) => {
    const out = {};
    for (const field of ADDRESS_FIELDS) {
        if (body[field] !== undefined) out[field] = body[field];
    }
    if (typeof out.name === 'string') out.name = out.name.trim();
    if (typeof out.phoneNo === 'string') out.phoneNo = String(out.phoneNo).replace(/\s/g, '');
    if (typeof out.postalCode === 'string') out.postalCode = out.postalCode.trim();
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
   const users = await User.find();
   res.status(200).json({
        success: true,
        users
   })
})

//Admin: Get Specific User - api/v1/admin/user/:id
exports.getUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if(!user) {
        return next(new ErrorHandler(`User not found with this id ${req.params.id}`))
    }
    res.status(200).json({
        success: true,
        user
   })
});

//Admin: Update User - api/v1/admin/user/:id
exports.updateUser = catchAsyncError(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile ? String(req.body.mobile).replace(/\D/g, '') : undefined,
        role: req.body.role
    }

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
    })

    res.status(200).json({
        success: true,
        user
    })
})

//Admin: Delete User - api/v1/admin/user/:id
exports.deleteUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if(!user) {
        return next(new ErrorHandler(`User not found with this id ${req.params.id}`))
    }
    await user.deleteOne();
    res.status(200).json({
        success: true,
    })
})
