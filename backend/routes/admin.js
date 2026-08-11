const express = require('express');
const { loginAdmin, getAnalytics } = require('../controllers/adminController');
const { getSellerApplications, updateSellerApplication } = require('../controllers/sellerController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const { validate, objectIdParam, sellerStatusRules } = require('../middlewares/validate');

// Public: password login for admins only (no OTP dependency).
router.route('/admin/login').post(loginAdmin);

router.route('/admin/analytics').get(isAuthenticatedUser, authorizeRoles('admin'), getAnalytics);

//Admin: review "Become a Seller" applications. Approving promotes the
//applicant to the seller role.
router.route('/admin/seller-applications')
    .get(isAuthenticatedUser, authorizeRoles('admin'), getSellerApplications);
router.route('/admin/seller-applications/:id')
    .put(isAuthenticatedUser, authorizeRoles('admin'), objectIdParam('id'), sellerStatusRules(), validate, updateSellerApplication);

module.exports = router;
