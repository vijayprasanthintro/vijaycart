const catchAsyncError = require('../middlewares/catchAsyncError');
const Category = require('../models/categoryModel');
const ErrorHandler = require('../utils/errorHandler');

const DEFAULT_CATEGORIES = [
    'Electronics', 'Mobile Phones', 'Smartphones', 'Laptops', 'Tablets',
    'Headphones', 'Audio', 'Cameras', 'Monitors', 'Televisions', 'Gaming',
    'Drones', 'Wearables', 'Components', 'Accessories', 'Clothes/Shoes',
    'Home', 'Food', 'Sports', 'Outdoor', 'Books', 'Beauty/Health'
];

//Public: Get all categories - /api/v1/categories
exports.getCategories = catchAsyncError(async (req, res, next) => {
    const count = await Category.countDocuments();
    if (count === 0) {
        await Category.insertMany(DEFAULT_CATEGORIES.map((name, i) => ({ name, sortOrder: i + 1 })));
    }
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    res.status(200).json({
        success: true,
        categories
    })
});

//Admin: Create category - /api/v1/admin/category/new
exports.createCategory = catchAsyncError(async (req, res, next) => {
    const { name, icon, sortOrder } = req.body;
    if (!name || !String(name).trim()) {
        return next(new ErrorHandler('Please enter a category name', 400))
    }
    const existing = await Category.findOne({ name: String(name).trim() });
    if (existing) {
        return next(new ErrorHandler('Category with this name already exists', 400))
    }
    const category = await Category.create({
        name: String(name).trim(),
        icon: icon || 'fa-tag',
        sortOrder: sortOrder || 0
    });
    res.status(200).json({
        success: true,
        category
    })
});

//Admin: Update category - /api/v1/admin/category/:id
exports.updateCategory = catchAsyncError(async (req, res, next) => {
    let category = await Category.findById(req.params.id);
    if (!category) {
        return next(new ErrorHandler(`Category not found with this id: ${req.params.id}`, 404))
    }

    const { name, icon, sortOrder, active } = req.body;
    if (name !== undefined) category.name = String(name).trim();
    if (icon !== undefined) category.icon = icon;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;
    if (active !== undefined) category.active = active;

    await category.save();
    res.status(200).json({
        success: true,
        category
    })
});

//Admin: Delete category - /api/v1/admin/category/:id
exports.deleteCategory = catchAsyncError(async (req, res, next) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
        return next(new ErrorHandler(`Category not found with this id: ${req.params.id}`, 404))
    }
    await category.remove();
    res.status(200).json({
        success: true
    })
});
