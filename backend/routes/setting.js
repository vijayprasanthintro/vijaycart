const express = require('express');
const {
    getSettings,
    updateSettings,
    getDesigns,
    applyDesign,
    saveDesign,
    resetDesign
} = require('../controllers/settingController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

router.route('/settings').get(getSettings);

// Website Design Studio
router.route('/designs').get(getDesigns);
router.route('/admin/designs/apply').put(isAuthenticatedUser, authorizeRoles('admin'), applyDesign);
router.route('/admin/designs/save').put(isAuthenticatedUser, authorizeRoles('admin'), saveDesign);
router.route('/admin/designs/reset').post(isAuthenticatedUser, authorizeRoles('admin'), resetDesign);

//Admin Routes
router.route('/admin/settings').put(isAuthenticatedUser, authorizeRoles('admin'), updateSettings);

module.exports = router;
