const express = require('express');
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');

router.route('/categories').get(getCategories);

//Admin Routes
router.route('/admin/category/new').post(isAuthenticatedUser, authorizeRoles('admin'), createCategory);
router.route('/admin/category/:id').put(isAuthenticatedUser, authorizeRoles('admin'), updateCategory)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteCategory);

module.exports = router;
