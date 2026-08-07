const express = require('express');
const { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon } = require('../controllers/couponController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const { validate, objectIdParam, couponValidateRules, couponRules } = require('../middlewares/validate');

router.route('/coupon/validate').post(isAuthenticatedUser, couponValidateRules(), validate, validateCoupon);

//Admin Routes
router.route('/admin/coupons').get(isAuthenticatedUser, authorizeRoles('admin'), getCoupons);
router.route('/admin/coupon/new').post(isAuthenticatedUser, authorizeRoles('admin'), couponRules(), validate, createCoupon);
router.route('/admin/coupon/:id').put(isAuthenticatedUser, authorizeRoles('admin'), objectIdParam('id'), couponRules(), validate, updateCoupon)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), objectIdParam('id'), validate, deleteCoupon);

module.exports = router;
