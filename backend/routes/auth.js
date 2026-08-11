const express = require('express');
const multer = require('multer');
const path = require('path')

const upload = multer({storage: multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join( __dirname,'..' , 'uploads/user' ) )
    },
    filename: function(req, file, cb ) {
        cb(null, file.originalname)
    }
}) })


const { 
    logoutUser,
    getUserProfile,
    updateProfile,
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
    googleLogin,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    getPublicConfig
 } = require('../controllers/authController');
const { requestOtp, verifyOtp } = require('../controllers/otpController');
const { applySeller, getMySellerApplication } = require('../controllers/sellerController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate')
const {
    validate,
    objectIdParam,
    otpRequestRules,
    otpVerifyRules,
    profileUpdateRules,
    googleLoginRules,
    productIdParam,
    adminUserUpdateRules,
    sellerApplyRules
} = require('../middlewares/validate');

router.route('/auth/config').get(getPublicConfig);
router.route('/google').post(googleLoginRules(), validate, googleLogin);
router.route('/otp/request').post(otpRequestRules(), validate, requestOtp);
router.route('/otp/verify').post(otpVerifyRules(), validate, verifyOtp);
router.route('/logout').get(logoutUser);
router.route('/myprofile').get(isAuthenticatedUser, getUserProfile);
router.route('/update').put(isAuthenticatedUser, upload.single('avatar'), profileUpdateRules(), validate, updateProfile);

//Wishlist (MongoDB-backed, keyed to the logged-in user)
router.route('/wishlist').get(isAuthenticatedUser, getWishlist)
    .delete(isAuthenticatedUser, clearWishlist);
router.route('/wishlist/:productId')
    .put(isAuthenticatedUser, productIdParam(), validate, addToWishlist)
    .delete(isAuthenticatedUser, productIdParam(), validate, removeFromWishlist);

//Become a Seller (customer-facing)
router.route('/seller/apply').post(isAuthenticatedUser, sellerApplyRules(), validate, applySeller);
router.route('/seller/application').get(isAuthenticatedUser, getMySellerApplication);

//Admin routes
router.route('/admin/users').get(isAuthenticatedUser,authorizeRoles('admin'), getAllUsers);
router.route('/admin/user/:id').get(isAuthenticatedUser,authorizeRoles('admin'), objectIdParam('id'), validate, getUser)
                                .put(isAuthenticatedUser,authorizeRoles('admin'), objectIdParam('id'), adminUserUpdateRules(), validate, updateUser)
                                .delete(isAuthenticatedUser,authorizeRoles('admin'), objectIdParam('id'), validate, deleteUser);


module.exports = router;