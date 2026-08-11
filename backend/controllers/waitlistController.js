const catchAsyncError = require('../middlewares/catchAsyncError');
const Waitlist = require('../models/waitlistModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');

//Join the waitlist for an out-of-stock product - /api/v1/waitlist (POST)
exports.joinWaitlist = catchAsyncError(async (req, res, next) => {
    const { productId } = req.body;

    const product = await Product.findById(productId).select('_id stock name');
    if (!product) {
        return next(new ErrorHandler('Product not found', 404));
    }

    // Only meaningful for products that are actually out of stock.
    if (product.stock > 0) {
        return next(new ErrorHandler('This product is in stock. Add it to your cart directly.', 400));
    }

    // Idempotent subscribe: the unique (user, product) index makes a repeated
    // request a no-op instead of an error.
    const existing = await Waitlist.findOne({ user: req.user.id, product: productId });
    if (existing) {
        return res.status(200).json({
            success: true,
            joined: false,
            message: 'You are already on the waitlist. We will notify you when it is back in stock.'
        });
    }

    await Waitlist.create({ user: req.user.id, product: productId });

    res.status(201).json({
        success: true,
        joined: true,
        message: 'You are on the waitlist. We will notify you when this product is back in stock.'
    });
});

//Leave the waitlist - /api/v1/waitlist/:productId (DELETE)
exports.leaveWaitlist = catchAsyncError(async (req, res, next) => {
    await Waitlist.findOneAndDelete({ user: req.user.id, product: req.params.productId });
    res.status(200).json({
        success: true,
        message: 'Removed from waitlist'
    });
});

//Check the current user's waitlist status for a product - /api/v1/waitlist/status/:productId
exports.waitlistStatus = catchAsyncError(async (req, res, next) => {
    const joined = await Waitlist.exists({ user: req.user.id, product: req.params.productId });
    res.status(200).json({
        success: true,
        joined: !!joined
    });
});

//List the products the current user is waiting on - /api/v1/waitlist/mine
exports.myWaitlist = catchAsyncError(async (req, res, next) => {
    const entries = await Waitlist.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .populate('product', 'name price mrp discount brand images ratings stock seller');
    const products = entries.map(e => e.product).filter(Boolean);
    res.status(200).json({
        success: true,
        waitlist: products
    });
});
