const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

router.route('/settings').get(getSettings);

//Admin Routes
router.route('/admin/settings').put(isAuthenticatedUser, authorizeRoles('admin'), updateSettings);

module.exports = router;
