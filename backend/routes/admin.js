const express = require('express');
const { loginAdmin, getAnalytics } = require('../controllers/adminController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

// Public: password login for admins only (no OTP dependency).
router.route('/admin/login').post(loginAdmin);

router.route('/admin/analytics').get(isAuthenticatedUser, authorizeRoles('admin'), getAnalytics);

module.exports = router;
