const express = require('express');
const {
    getBanners,
    getAdminBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    reorderBanners
} = require('../controllers/bannerController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

//Public
router.route('/banners').get(getBanners);

//Admin Routes
router.route('/admin/banners').get(isAuthenticatedUser, authorizeRoles('admin'), getAdminBanners);
router.route('/admin/banners/reorder').put(isAuthenticatedUser, authorizeRoles('admin'), reorderBanners);
router.route('/admin/banner/new').post(isAuthenticatedUser, authorizeRoles('admin'), createBanner);
router.route('/admin/banner/:id').put(isAuthenticatedUser, authorizeRoles('admin'), updateBanner)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteBanner);

module.exports = router;
