const catchAsyncError = require('../middlewares/catchAsyncError');
const Coupon = require('../models/couponModel');
const ErrorHandler = require('../utils/errorHandler');

//Validate a coupon for the given order amount - /api/v1/coupon/validate
exports.validateCoupon = catchAsyncError(async (req, res, next) => {
    const { code, amount } = req.body;
    if (!code) {
        return next(new ErrorHandler('Please enter a coupon code', 400))
    }

    const coupon = await Coupon.findOne({ code: String(code).toUpperCase().trim() });
    if (!coupon) {
        return next(new ErrorHandler('Invalid coupon code', 404))
    }
    if (!coupon.active) {
        return next(new ErrorHandler('This coupon has been deactivated', 400))
    }

    const now = Date.now();
    if (coupon.validFrom && now < new Date(coupon.validFrom).getTime()) {
        return next(new ErrorHandler('This coupon is not active yet', 400))
    }
    if (coupon.validUntil && now > new Date(coupon.validUntil).getTime()) {
        return next(new ErrorHandler('This coupon has expired', 400))
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
        return next(new ErrorHandler('This coupon has reached its usage limit', 400))
    }

    const orderAmount = Number(amount || 0);
    if (orderAmount < coupon.minAmount) {
        return next(new ErrorHandler(`This coupon requires a minimum order of ₹${coupon.minAmount.toLocaleString('en-IN')}`, 400))
    }

    let discount;
    if (coupon.discountType === 'percent') {
        discount = (orderAmount * coupon.discountValue) / 100;
        if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
        }
    } else {
        discount = coupon.discountValue;
    }
    discount = Math.min(discount, orderAmount);

    res.status(200).json({
        success: true,
        coupon,
        discount
    })
});

//Admin: Get all coupons - /api/v1/admin/coupons
exports.getCoupons = catchAsyncError(async (req, res, next) => {
    const coupons = await Coupon.find().sort('-createdAt');
    res.status(200).json({
        success: true,
        coupons
    })
});

//Admin: Create coupon - /api/v1/admin/coupon/new
exports.createCoupon = catchAsyncError(async (req, res, next) => {
    const { code, description, discountType, discountValue, minAmount, maxDiscount, validFrom, validUntil, usageLimit, active } = req.body;

    if (!code || !String(code).trim()) {
        return next(new ErrorHandler('Please enter a coupon code', 400))
    }
    if (!discountType || !['percent', 'flat'].includes(discountType)) {
        return next(new ErrorHandler('Please choose either percent or flat discount', 400))
    }
    if (discountValue === undefined || Number(discountValue) <= 0) {
        return next(new ErrorHandler('Please enter a valid discount value', 400))
    }
    if (discountType === 'percent' && Number(discountValue) > 100) {
        return next(new ErrorHandler('Percent discount cannot exceed 100', 400))
    }

    const codeClean = String(code).trim().toUpperCase();
    const existing = await Coupon.findOne({ code: codeClean });
    if (existing) {
        return next(new ErrorHandler('A coupon with this code already exists', 400))
    }

    const coupon = await Coupon.create({
        code: codeClean,
        description,
        discountType,
        discountValue: Number(discountValue),
        minAmount: Number(minAmount || 0),
        maxDiscount: Number(maxDiscount || 0),
        validFrom: validFrom || undefined,
        validUntil: validUntil || undefined,
        usageLimit: Number(usageLimit || 0),
        active: active !== undefined ? active : true
    });

    res.status(200).json({
        success: true,
        coupon
    })
});

//Admin: Update coupon - /api/v1/admin/coupon/:id
exports.updateCoupon = catchAsyncError(async (req, res, next) => {
    let coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
        return next(new ErrorHandler(`Coupon not found with this id: ${req.params.id}`, 404))
    }

    const { code, description, discountType, discountValue, minAmount, maxDiscount, validFrom, validUntil, usageLimit, active } = req.body;

    if (code !== undefined) coupon.code = String(code).trim().toUpperCase();
    if (description !== undefined) coupon.description = description;
    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
    if (minAmount !== undefined) coupon.minAmount = Number(minAmount);
    if (maxDiscount !== undefined) coupon.maxDiscount = Number(maxDiscount);
    if (validFrom !== undefined) coupon.validFrom = validFrom || undefined;
    if (validUntil !== undefined) coupon.validUntil = validUntil || undefined;
    if (usageLimit !== undefined) coupon.usageLimit = Number(usageLimit);
    if (active !== undefined) coupon.active = active;

    await coupon.save();
    res.status(200).json({
        success: true,
        coupon
    })
});

//Admin: Delete coupon - /api/v1/admin/coupon/:id
exports.deleteCoupon = catchAsyncError(async (req, res, next) => {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
        return next(new ErrorHandler(`Coupon not found with this id: ${req.params.id}`, 404))
    }
    await coupon.remove();
    res.status(200).json({
        success: true
    })
});
