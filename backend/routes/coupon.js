const express = require('express');
const { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon } = require('../controllers/couponController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

router.route('/coupon/validate').post(isAuthenticatedUser, validateCoupon);

//Admin Routes
router.route('/admin/coupons').get(isAuthenticatedUser, authorizeRoles('admin'), getCoupons);
router.route('/admin/coupon/new').post(isAuthenticatedUser, authorizeRoles('admin'), createCoupon);
router.route('/admin/coupon/:id').put(isAuthenticatedUser, authorizeRoles('admin'), updateCoupon)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteCoupon);

module.exports = router;
