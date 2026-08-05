const catchAsyncError = require('../middlewares/catchAsyncError');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Coupon = require('../models/couponModel');
const Setting = require('../models/settingModel');
const ErrorHandler = require('../utils/errorHandler');
//Create New Order - api/v1/order/new
exports.newOrder =  catchAsyncError( async (req, res, next) => {
    const {
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        discountPrice = 0,
        couponCode,
        totalPrice,
        paymentInfo,
        paymentMethod = 'card'
    } = req.body;

    //Cash on Delivery is gated server-side too so a bypassed UI cannot place
    //one when the store has COD disabled, the pincode is excluded, or the
    //order is above the COD amount limit.
    if (paymentMethod === 'cod') {
        const settings = await Setting.findOne({ key: 'global' });
        const codEnabled = settings ? settings.codEnabled !== false : true;
        if (!codEnabled) {
            return next(new ErrorHandler('Cash on Delivery is currently disabled. Please choose another payment method.', 400))
        }
        const codMaxAmount = Number(settings && settings.codMaxAmount !== undefined ? settings.codMaxAmount : 5000) || 5000;
        if (Number(totalPrice) > codMaxAmount) {
            return next(new ErrorHandler(`Cash on Delivery is available only for orders up to ₹${codMaxAmount.toLocaleString('en-IN')}`, 400))
        }
        const codPincodes = Array.isArray(settings && settings.codPincodes)
            ? settings.codPincodes.map(p => String(p).trim()).filter(Boolean)
            : [];
        const postal = String(shippingInfo && shippingInfo.postalCode || '').replace(/[^0-9]/g, '');
        if (codPincodes.length > 0 && !codPincodes.includes(postal)) {
            return next(new ErrorHandler('Cash on Delivery is not available at your pincode. Please choose another payment method.', 400))
        }
    }

    const isPaid = paymentInfo && paymentInfo.status === 'succeeded';

    const order = await Order.create({
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        discountPrice,
        couponCode,
        totalPrice,
        paymentInfo,
        paymentMethod,
        paidAt: isPaid ? Date.now() : undefined,
        user: req.user.id
    })

    //Track coupon usage so admin-created limits stay accurate.
    if (couponCode) {
        await Coupon.findOneAndUpdate(
            { code: String(couponCode).toUpperCase().trim() },
            { $inc: { usedCount: 1 } }
        );
    }

    res.status(200).json({
        success: true,
        order
    })
})

//Get Single Order - api/v1/order/:id
exports.getSingleOrder = catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if(!order) {
        return next(new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404))
    }

    res.status(200).json({
        success: true,
        order
    })
})

//Get Loggedin User Orders - /api/v1/myorders
exports.myOrders = catchAsyncError(async (req, res, next) => {
    const orders = await Order.find({user: req.user.id});

    res.status(200).json({
        success: true,
        orders
    })
})

//Admin: Get All Orders - api/v1/orders
exports.orders = catchAsyncError(async (req, res, next) => {
    const orders = await Order.find();

    let totalAmount = 0;

    orders.forEach(order => {
        totalAmount += order.totalPrice
    })

    res.status(200).json({
        success: true,
        totalAmount,
        orders
    })
})

//Cancel Order (Loggedin User) - /api/v1/order/cancel/:id
exports.cancelOrder = catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404))
    }
    if (String(order.user) !== String(req.user.id)) {
        return next(new ErrorHandler('You are not authorized to cancel this order', 401))
    }
    if (order.orderStatus === 'Cancelled') {
        return next(new ErrorHandler('Order has already been cancelled', 400))
    }
    if (order.orderStatus !== 'Processing' && order.orderStatus !== 'Packed') {
        return next(new ErrorHandler('Order can no longer be cancelled after it has been shipped', 400))
    }
    order.orderStatus = 'Cancelled';
    await order.save();

    res.status(200).json({
        success: true,
        order
    })
});

//Request Return or Replacement (Loggedin User) - /api/v1/order/return/:id
exports.returnOrder = catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404))
    }
    if (String(order.user) !== String(req.user.id)) {
        return next(new ErrorHandler('You are not authorized to request a return on this order', 401))
    }
    if (order.orderStatus === 'Cancelled') {
        return next(new ErrorHandler('Cancelled orders cannot be returned', 400))
    }
    if (order.orderStatus !== 'Delivered') {
        return next(new ErrorHandler('Return or replacement can only be requested after delivery', 400))
    }
    if (order.returnStatus && order.returnStatus !== 'None' && !String(order.returnStatus).toLowerCase().includes('rejected') && !String(order.returnStatus).toLowerCase().includes('completed')) {
        return next(new ErrorHandler(`A request (${order.returnStatus}) is already pending for this order`, 400))
    }

    const type = String(req.body.type || '').toLowerCase();
    const reason = String(req.body.reason || '').trim();
    if (!['return', 'replace'].includes(type)) {
        return next(new ErrorHandler('Please choose either return or replacement', 400))
    }
    if (!reason) {
        return next(new ErrorHandler('Please provide a reason for your request', 400))
    }

    order.returnStatus = type === 'return' ? 'Return Requested' : 'Replacement Requested';
    order.returnReason = reason;
    order.returnRequestedAt = Date.now();
    await order.save();

    res.status(200).json({
        success: true,
        order
    })
});

//Admin: Update Order / Order Status - api/v1/order/:id
exports.updateOrder =  catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if(order.orderStatus == 'Delivered') {
        return next(new ErrorHandler('Order has been already delivered!', 400))
    }
    //Reserve stock only once — when the order first leaves 'Processing'.
    if (order.orderStatus === 'Processing') {
        order.orderItems.forEach(async orderItem => {
            await updateStock(orderItem.product, orderItem.quantity)
        })
    }

    order.orderStatus = req.body.orderStatus;
    if (req.body.orderStatus === 'Delivered') {
        order.deliveredAt = Date.now();
    }
    await order.save();

    res.status(200).json({
        success: true
    })
    
});

async function updateStock (productId, quantity){
    const product = await Product.findById(productId);
    product.stock = product.stock - quantity;
    product.save({validateBeforeSave: false})
}

//Admin: Delete Order - api/v1/order/:id
exports.deleteOrder = catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if(!order) {
        return next(new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404))
    }

    await order.remove();
    res.status(200).json({
        success: true
    })
})

