const catchAsyncError = require('../middlewares/catchAsyncError');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Coupon = require('../models/couponModel');
const Setting = require('../models/settingModel');
const DeliveryPerson = require('../models/deliveryPersonModel');
const ErrorHandler = require('../utils/errorHandler');
const { nextOrderNumber } = require('../utils/sequence');
const { notifyOrderEvent } = require('../utils/orderSms');
const { LOCKED_STATUS, LOCKED_MESSAGE, isLocked } = require('../utils/orderLock');

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

//Map an order status to the SMS event sent to the customer.
const STATUS_SMS_EVENT = {
    'Confirmed': 'confirmed',
    'Packed': 'packed',
    'Shipped': 'shipped',
    'Out for Delivery': 'out_for_delivery',
    'Delivered': 'delivered',
    'Cancelled': 'cancelled'
};

//Expected delivery date = order date + the store's configured estimate.
async function estimateDeliveryDate() {
    const settings = await Setting.findOne({ key: 'global' });
    const days = Number(settings && settings.deliveryEstimateDays) || 5;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
}

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
        paymentMethod = 'card',
        orderKey
    } = req.body;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        return next(new ErrorHandler('Your cart is empty. Add items before placing an order.', 400))
    }
    if (!shippingInfo || !shippingInfo.address || !shippingInfo.city || !shippingInfo.postalCode || !shippingInfo.phoneNo) {
        return next(new ErrorHandler('Shipping address is incomplete. Please provide a valid address.', 400))
    }

    // Idempotency: a checkout session can only ever produce one order. If the
    // same session (orderKey) or the same payment transaction (paymentInfo.id)
    // already created an order — e.g. a double-click, or a retry after the
    // client lost the response — return the existing order instead of creating
    // a duplicate. The lookup is scoped to the authenticated user so a stale
    // key inherited from another account can never surface that user's order.
    if (orderKey) {
        const existing = await Order.findOne({ orderKey, user: req.user.id });
        if (existing) {
            return res.status(200).json({ success: true, order: existing })
        }
    }
    if (paymentInfo && paymentInfo.id) {
        const existing = await Order.findOne({ 'paymentInfo.id': paymentInfo.id, user: req.user.id });
        if (existing) {
            return res.status(200).json({ success: true, order: existing })
        }
    }

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

    //Sequential human-readable number (#VC10001) + expected delivery date so
    //the confirmation SMS can reference both.
    const [orderNumber, deliveryDate] = await Promise.all([nextOrderNumber(), estimateDeliveryDate()]);

    let order;
    try {
        order = await Order.create({
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
            user: req.user.id,
            orderKey,
            orderNumber,
            deliveryDate,
            orderStatus: 'Pending',
            statusHistory: [{
                status: 'Pending',
                changedAt: Date.now(),
                changedBy: req.user.id,
                note: isPaid ? 'Order placed (paid)' : 'Order placed'
            }]
        })
    } catch (err) {
        // Two submissions for the same session arriving concurrently can both
        // pass the findOne above; the unique index then rejects the second.
        // Treat that as idempotent success and return the already-created order
        // — but only if it belongs to this user. A key from another account is
        // a stale/broken session and must fail loudly, not leak that order.
        if (err && err.code === 11000 && orderKey) {
            const existing = await Order.findOne({ orderKey, user: req.user.id });
            if (existing) {
                return res.status(200).json({ success: true, order: existing })
            }
        }
        throw err;
    }

    //Track coupon usage so admin-created limits stay accurate.
    if (couponCode) {
        await Coupon.findOneAndUpdate(
            { code: String(couponCode).toUpperCase().trim() },
            { $inc: { usedCount: 1 } }
        );
    }

    //Send the order-placed SMS confirmation to the customer's registered mobile
    //(fire-and-forget — notifyOrderEvent never rejects).
    notifyOrderEvent('placed', order, { customer: req.user, deliveryDate });

    res.status(200).json({
        success: true,
        order
    })
})

//Get Single Order - api/v1/order/:id
exports.getSingleOrder = catchAsyncError(async (req, res, next) => {
    const orderDoc = await Order.findById(req.params.id)
        .populate('user', 'name email')
        .populate('deliveryBoy', 'name email mobile');
    if(!orderDoc) {
        return next(new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404))
    }

    const order = orderDoc.toObject();

    //Attach the delivery partner details the tracking page shows (name, phone
    //and vehicle number) once a rider has been assigned.
    if (order.deliveryBoy) {
        const person = await DeliveryPerson.findOne({ user: order.deliveryBoy._id });
        order.deliveryPerson = person
            ? {
                name: person.name,
                phone: person.phone || order.deliveryBoy.mobile || '',
                vehicleNumber: person.vehicleNumber || ''
            }
            : {
                name: order.deliveryBoy.name,
                phone: order.deliveryBoy.mobile || '',
                vehicleNumber: ''
            };
    }

    res.status(200).json({
        success: true,
        order
    })
})

//Get Loggedin User Orders - /api/v1/myorders
exports.myOrders = catchAsyncError(async (req, res, next) => {
    // Orders are looked up by the authenticated user's id so every order a
    // user places is returned, and only theirs. Newest first.
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });

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
    if (order.orderStatus === 'Cancelled' || isLocked(order)) {
        return next(new ErrorHandler('Order has already been cancelled', 400))
    }
    if (order.orderStatus !== 'Pending' && order.orderStatus !== 'Confirmed' && order.orderStatus !== 'Packed') {
        return next(new ErrorHandler('Order can no longer be cancelled after it has been shipped', 400))
    }
    order.orderStatus = LOCKED_STATUS;
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
        status: LOCKED_STATUS,
        changedAt: Date.now(),
        changedBy: req.user.id,
        note: 'Cancelled by customer'
    });
    await order.save();

    //The order is now locked and immutable — release any delivery partner so
    //it stops showing up on their dashboard.
    await DeliveryPerson.updateMany(
        { assignedOrders: order._id },
        { $pull: { assignedOrders: order._id } }
    );
    const person = await DeliveryPerson.findOne({ user: order.deliveryBoy });
    if (person && !person.assignedOrders.length) {
        person.status = 'free';
        await person.save();
    }

    notifyOrderEvent('cancelled', order, { customer: req.user });

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
    if (isLocked(order)) {
        return next(new ErrorHandler(LOCKED_MESSAGE, 400))
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

    if (!order) {
        return next(new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404))
    }

    if (isLocked(order)) {
        return next(new ErrorHandler(LOCKED_MESSAGE, 400))
    }

    const nextStatus = String(req.body.orderStatus || '').trim();
    if (nextStatus === LOCKED_STATUS) {
        return next(new ErrorHandler('This status can only be set by the customer', 400))
    }
    if (!ORDER_STATUSES.includes(nextStatus)) {
        return next(new ErrorHandler(`Invalid order status. Choose from: ${ORDER_STATUSES.join(', ')}`, 400))
    }

    if (order.orderStatus === 'Delivered') {
        return next(new ErrorHandler('Order has been already delivered!', 400))
    }
    //Reserve stock only once — when the order first leaves 'Pending'.
    if (order.orderStatus === 'Pending') {
        order.orderItems.forEach(async orderItem => {
            await updateStock(orderItem.product, orderItem.quantity)
        })
    }

    order.orderStatus = nextStatus;
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
        status: nextStatus,
        changedAt: Date.now(),
        changedBy: req.user.id,
        note: 'Admin update'
    });
    if (req.body.orderStatus === 'Delivered') {
        order.deliveredAt = Date.now();
    }
    await order.save();

    //Notify the customer as their order moves through the fulfilment pipeline.
    const smsEvent = STATUS_SMS_EVENT[nextStatus];
    if (smsEvent) {
        notifyOrderEvent(smsEvent, order);
    }

    res.status(200).json({
        success: true,
        order
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

    if (isLocked(order)) {
        return next(new ErrorHandler(LOCKED_MESSAGE, 400))
    }

    await order.remove();
    res.status(200).json({
        success: true
    })
})

