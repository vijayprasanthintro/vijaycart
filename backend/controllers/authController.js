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
