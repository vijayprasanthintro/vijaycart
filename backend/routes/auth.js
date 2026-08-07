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
    deleteUser
 } = require('../controllers/authController');
const { requestOtp, verifyOtp } = require('../controllers/otpController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate')
const {
    validate,
    objectIdParam,
    otpRequestRules,
    otpVerifyRules,
    profileUpdateRules,
    adminUserUpdateRules
} = require('../middlewares/validate');

router.route('/otp/request').post(otpRequestRules(), validate, requestOtp);
router.route('/otp/verify').post(otpVerifyRules(), validate, verifyOtp);
router.route('/logout').get(logoutUser);
router.route('/myprofile').get(isAuthenticatedUser, getUserProfile);
router.route('/update').put(isAuthenticatedUser, upload.single('avatar'), profileUpdateRules(), validate, updateProfile);

//Admin routes
router.route('/admin/users').get(isAuthenticatedUser,authorizeRoles('admin'), getAllUsers);
router.route('/admin/user/:id').get(isAuthenticatedUser,authorizeRoles('admin'), objectIdParam('id'), validate, getUser)
                                .put(isAuthenticatedUser,authorizeRoles('admin'), objectIdParam('id'), adminUserUpdateRules(), validate, updateUser)
                                .delete(isAuthenticatedUser,authorizeRoles('admin'), objectIdParam('id'), validate, deleteUser);


module.exports = router;