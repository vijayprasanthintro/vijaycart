const express = require('express');
const { getAnalytics } = require('../controllers/adminController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

router.route('/admin/analytics').get(isAuthenticatedUser, authorizeRoles('admin'), getAnalytics);

module.exports = router;
