// Centralized input validation using express-validator.
//
// Each export is an array of validation chains plus a `validate` handler.
// Wire them into a route like:
//   router.route('/order/new')
//     .post(isAuthenticatedUser, ...orderRules(), validate, newOrder);
//
// The `validate` handler returns the first error as a 400 in the app's
// standard `{ success: false, message }` shape so the existing error UI and
// error middleware keep working unchanged.

const { body, param, query, validationResult } = require('express-validator');

const VALID_CATEGORIES = [
    'Electronics', 'Mobile Phones', 'Smartphones', 'Laptops', 'Tablets',
    'Headphones', 'Audio', 'Cameras', 'Monitors', 'Televisions', 'Gaming',
    'Drones', 'Wearables', 'Components', 'Accessories', 'Clothes/Shoes',
    'Home', 'Food', 'Sports', 'Outdoor', 'Books', 'Beauty/Health'
];

const VALID_ORDER_STATUSES = [
    'Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery',
    'Delivered', 'Cancelled', 'Cancelled by Customer'
];

function validate(req, res, next) {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    const first = errors.array()[0];
    return res.status(400).json({
        success: false,
        message: first.msg
    });
}

const objectIdParam = (name) =>
    param(name).isMongoId().withMessage('Invalid resource id');

// ---------- Auth / profile ----------
const otpRequestRules = () => [
    body('mobile')
        .optional({ values: 'falsy' })
        .isString().withMessage('Mobile number must be a string')
        .trim()
        .custom((v) => /^[6-9]\d{9}$/.test(String(v).replace(/\D/g, '')))
        .withMessage('Please enter a valid 10-digit mobile number'),
    body('email')
        .optional({ values: 'falsy' })
        .isEmail().withMessage('Please enter a valid email address'),
    body('purpose')
        .optional({ values: 'falsy' })
        .isIn(['customer', 'delivery']).withMessage('Invalid purpose')
];

const otpVerifyRules = () => [
    body('userId').isMongoId().withMessage('Invalid user session'),
    body('otp').isString().matches(/^\d{6}$/).withMessage('OTP must be a 6-digit number'),
    body('purpose')
        .optional({ values: 'falsy' })
        .isIn(['customer', 'delivery']).withMessage('Invalid purpose')
];

const profileUpdateRules = () => [
    body('name')
        .optional({ values: 'falsy' })
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .optional({ values: 'falsy' })
        .isEmail().withMessage('Please enter a valid email address')
        .isLength({ max: 120 }).withMessage('Email is too long'),
    body('mobile')
        .optional({ values: 'falsy' })
        .custom((v) => /^[6-9]\d{9}$/.test(String(v).replace(/\D/g, '')))
        .withMessage('Please enter a valid 10-digit mobile number')
];

// ---------- Products ----------
const productRules = () => [
    body('name')
        .if((_v, { req }) => req.method === 'POST')
        .isLength({ min: 2, max: 100 }).withMessage('Product name must be between 2 and 100 characters'),
    body('name')
        .optional({ values: 'falsy' })
        .isLength({ max: 100 }).withMessage('Product name cannot exceed 100 characters'),
    body('price')
        .optional({ values: 'falsy' })
        .isFloat({ min: 0, max: 100000000 }).withMessage('Price must be a number between 0 and 100000000'),
    body('mrp')
        .optional({ values: 'falsy' })
        .isFloat({ min: 0, max: 100000000 }).withMessage('MRP must be a number between 0 and 100000000'),
    body('stock')
        .optional({ values: 'falsy' })
        .isInt({ min: 0, max: 100000 }).withMessage('Stock must be a number between 0 and 100000'),
    body('discount')
        .optional({ values: 'falsy' })
        .isFloat({ min: 0, max: 95 }).withMessage('Discount must be between 0 and 95'),
    body('category')
        .if((_v, { req }) => req.method === 'POST')
        .isIn(VALID_CATEGORIES).withMessage('Please select a correct category'),
    body('category')
        .optional({ values: 'falsy' })
        .isIn(VALID_CATEGORIES).withMessage('Please select a correct category'),
    body('seller')
        .optional({ values: 'falsy' })
        .isLength({ max: 80 }).withMessage('Seller name cannot exceed 80 characters'),
    body('description')
        .if((_v, { req }) => req.method === 'POST')
        .isLength({ min: 5 }).withMessage('Please enter a product description'),
    body('brand')
        .optional({ values: 'falsy' })
        .isLength({ max: 80 }).withMessage('Brand cannot exceed 80 characters')
];

const reviewRules = () => [
    body('productId').isMongoId().withMessage('Invalid product id'),
    body('rating')
        .isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment')
        .isLength({ min: 2, max: 1000 }).withMessage('Review comment must be between 2 and 1000 characters')
];

const reviewsQueryRules = () => [
    query('id').isMongoId().withMessage('Invalid product id')
];

const deleteReviewRules = () => [
    query('productId').isMongoId().withMessage('Invalid product id'),
    query('id').isMongoId().withMessage('Invalid review id')
];

// ---------- Orders ----------
const orderRules = () => [
    body('orderItems')
        .isArray({ min: 1 }).withMessage('Your cart is empty. Add items before placing an order.'),
    body('orderItems.*.product').isMongoId().withMessage('Invalid product id in cart'),
    body('orderItems.*.name')
        .isLength({ min: 1, max: 120 }).withMessage('Invalid item name in cart'),
    body('orderItems.*.quantity')
        .isInt({ min: 1, max: 999 }).withMessage('Invalid item quantity'),
    body('orderItems.*.price')
        .isFloat({ min: 0 }).withMessage('Invalid item price'),
    body('shippingInfo.address')
        .isLength({ min: 3, max: 300 }).withMessage('Please provide a valid shipping address'),
    body('shippingInfo.city')
        .isLength({ min: 1, max: 80 }).withMessage('Please provide a valid city'),
    body('shippingInfo.state')
        .optional({ values: 'falsy' })
        .isLength({ max: 80 }).withMessage('Invalid state'),
    body('shippingInfo.postalCode')
        .custom((v) => /^\d{6}$/.test(String(v || '').replace(/\D/g, '')))
        .withMessage('Please provide a valid 6-digit PIN code'),
    body('shippingInfo.phoneNo')
        .custom((v) => /^[6-9]\d{9}$/.test(String(v || '').replace(/\D/g, '')))
        .withMessage('Please provide a valid 10-digit phone number'),
    body('itemsPrice')
        .optional({ values: 'falsy' })
        .isFloat({ min: 0 }).withMessage('Invalid items total'),
    body('taxPrice')
        .optional({ values: 'falsy' })
        .isFloat({ min: 0 }).withMessage('Invalid tax total'),
    body('shippingPrice')
        .optional({ values: 'falsy' })
        .isFloat({ min: 0 }).withMessage('Invalid shipping total'),
    body('discountPrice')
        .optional({ values: 'falsy' })
        .isFloat({ min: 0 }).withMessage('Invalid discount total'),
    body('totalPrice')
        .optional({ values: 'falsy' })
        .isFloat({ min: 0 }).withMessage('Invalid order total'),
    body('paymentMethod')
        .optional({ values: 'falsy' })
        .isIn(['upi', 'card', 'netbanking', 'wallet', 'cod']).withMessage('Invalid payment method'),
    body('couponCode')
        .optional({ values: 'falsy' })
        .isLength({ max: 32 }).withMessage('Invalid coupon code'),
    body('orderKey')
        .optional({ values: 'falsy' })
        .isLength({ max: 64 }).withMessage('Invalid order reference')
];

const updateOrderStatusRules = () => [
    body('orderStatus')
        .isIn(VALID_ORDER_STATUSES).withMessage('Invalid order status')
];

const returnOrderRules = () => [
    body('type')
        .isIn(['return', 'replace']).withMessage('Please choose either return or replacement'),
    body('reason')
        .isLength({ min: 3, max: 500 }).withMessage('Please provide a reason for your request')
];

// ---------- Coupons ----------
const couponValidateRules = () => [
    body('code').isLength({ min: 3, max: 32 }).withMessage('Please enter a coupon code'),
    body('amount')
        .optional({ values: 'falsy' })
        .isFloat({ min: 0 }).withMessage('Invalid order amount')
];

const couponRules = () => [
    body('code')
        .if((_v, { req }) => req.method === 'POST')
        .isLength({ min: 3, max: 32 }).withMessage('Please enter a coupon code'),
    body('code')
        .optional({ values: 'falsy' })
        .isLength({ min: 3, max: 32 }).withMessage('Coupon code must be between 3 and 32 characters'),
    body('discountType')
        .if((_v, { req }) => req.method === 'POST')
        .isIn(['percent', 'flat']).withMessage('Please choose either percent or flat discount'),
    body('discountValue')
        .if((_v, { req }) => req.method === 'POST')
        .isFloat({ min: 0.01, max: 100 }).withMessage('Please enter a valid discount value'),
    body('discountValue')
        .optional({ values: 'falsy' })
        .isFloat({ min: 0, max: 100 }).withMessage('Discount value must be between 0 and 100'),
    body('minAmount')
        .optional({ values: 'falsy' })
        .isFloat({ min: 0 }).withMessage('Invalid minimum amount'),
    body('maxDiscount')
        .optional({ values: 'falsy' })
        .isFloat({ min: 0 }).withMessage('Invalid maximum discount'),
    body('usageLimit')
        .optional({ values: 'falsy' })
        .isInt({ min: 0 }).withMessage('Invalid usage limit')
];

// ---------- Delivery ----------
const deliveryBoyRules = () => [
    body('name').isLength({ min: 2, max: 50 }).withMessage('Please enter the delivery partner name'),
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('mobile')
        .custom((v) => /^[6-9]\d{9}$/.test(String(v).replace(/\D/g, '')))
        .withMessage('Please enter a valid 10-digit mobile number'),
    body('vehicleNumber')
        .optional({ values: 'falsy' })
        .isLength({ max: 30 }).withMessage('Vehicle number is too long')
];

const assignOrderRules = () => [
    body('deliveryBoy').isMongoId().withMessage('Please select a delivery boy to assign')
];

const deliveryStatusRules = () => [
    body('orderStatus')
        .optional({ values: 'falsy' })
        .isIn(['Out for Delivery', 'Delivered']).withMessage('Invalid delivery status'),
    body('codStatus')
        .optional({ values: 'falsy' })
        .isIn(['Collected']).withMessage('Invalid cash collection status'),
    body('otp')
        .optional({ values: 'falsy' })
        .isString().isLength({ min: 4, max: 4 }).withMessage('Invalid delivery OTP')
];

// ---------- Admin user updates ----------
const adminUserUpdateRules = () => [
    body('name')
        .optional({ values: 'falsy' })
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .optional({ values: 'falsy' })
        .isEmail().withMessage('Please enter a valid email address'),
    body('mobile')
        .optional({ values: 'falsy' })
        .custom((v) => /^[6-9]\d{9}$/.test(String(v).replace(/\D/g, '')))
        .withMessage('Please enter a valid 10-digit mobile number'),
    body('role')
        .optional({ values: 'falsy' })
        .isIn(['user', 'admin', 'deliveryboy']).withMessage('Invalid role')
];

// Sanitize string fields (trim + strip control chars). Applied separately so
// it can run after file uploads without interfering with multer.
const sanitizeBody = (fields) => (req, _res, next) => {
    if (!req.body || typeof req.body !== 'object') return next();
    for (const field of fields) {
        const value = req.body[field];
        if (typeof value === 'string') {
            req.body[field] = value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
        }
    }
    return next();
};

module.exports = {
    validate,
    objectIdParam,
    otpRequestRules,
    otpVerifyRules,
    profileUpdateRules,
    productRules,
    reviewRules,
    reviewsQueryRules,
    deleteReviewRules,
    orderRules,
    updateOrderStatusRules,
    returnOrderRules,
    couponValidateRules,
    couponRules,
    deliveryBoyRules,
    assignOrderRules,
    deliveryStatusRules,
    adminUserUpdateRules,
    sanitizeBody
};
