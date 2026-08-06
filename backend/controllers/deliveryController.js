const catchAsyncError = require('../middlewares/catchAsyncError');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const ErrorHandler = require('../utils/errorHandler');
//Admin: Create a new delivery boy - /api/v1/admin/deliveryboy
exports.createDeliveryBoy = catchAsyncError(async (req, res, next) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
        return next(new ErrorHandler('Please enter name, email and password', 400))
    }

    const existing = await User.findOne({ email });
    if (existing) {
        return next(new ErrorHandler('A user with this email already exists', 400))
    }

    const deliveryBoy = await User.create({
        name,
        email,
        password,
        phone,
        role: 'deliveryboy'
    });

    res.status(201).json({
        success: true,
        deliveryBoy
    })
});
//Expected OTP for an order — last 4 digits of the customer's phone number.
function orderOtp(order) {
    const digits = String(order.shippingInfo.phoneNo || '').replace(/\D/g, '');
    return digits.slice(-4);
}

//Admin: List all delivery boys - /api/v1/admin/deliveryboys
exports.getDeliveryBoys = catchAsyncError(async (req, res, next) => {
    const deliveryBoys = await User.find({ role: 'deliveryboy' }).select('name email avatar role');

    res.status(200).json({
        success: true,
        deliveryBoys
    })
});

//Admin: Assign a delivery boy to an order - /api/v1/admin/order/:id/assign
exports.assignOrder = catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404))
    }

    if (!req.body.deliveryBoy) {
        return next(new ErrorHandler('Please select a delivery boy to assign', 400))
    }

    const deliveryBoy = await User.findById(req.body.deliveryBoy);
    if (!deliveryBoy || deliveryBoy.role !== 'deliveryboy') {
        return next(new ErrorHandler('Selected user is not a delivery boy', 400))
    }

    order.deliveryBoy = deliveryBoy._id;
    await order.save();

    res.status(200).json({
        success: true,
        order
    })
});

//Delivery Boy: All orders assigned to me - /api/v1/delivery/orders
exports.myDeliveryOrders = catchAsyncError(async (req, res, next) => {
    const orders = await Order.find({ deliveryBoy: req.user.id })
        .populate('user', 'name email')
        .sort('-createdAt');

    res.status(200).json({
        success: true,
        orders
    })
});

//Delivery Boy: Orders due for delivery today - /api/v1/delivery/orders/today
exports.todayDeliveryOrders = catchAsyncError(async (req, res, next) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const orders = await Order.find({
        deliveryBoy: req.user.id,
        $or: [
            { deliveryDate: { $gte: start, $lt: end } },
            { deliveryDate: null, createdAt: { $gte: start, $lt: end } }
        ]
    }).populate('user', 'name email').sort('-createdAt');

    res.status(200).json({
        success: true,
        orders
    })
});

//Delivery Boy: Update delivery status / confirm delivery with OTP - /api/v1/delivery/order/:id/status
exports.updateDeliveryStatus = catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404))
    }
    if (String(order.deliveryBoy) !== String(req.user.id)) {
        return next(new ErrorHandler('This order is not assigned to you', 401))
    }
    if (order.orderStatus === 'Cancelled') {
        return next(new ErrorHandler('Cancelled orders cannot be delivered', 400))
    }

    const nextStatus = String(req.body.orderStatus || '').trim();

    //Cash collection for an already-delivered COD order (no status change).
    if (order.paymentMethod === 'cod' && order.orderStatus === 'Delivered' && !nextStatus && req.body.codStatus) {
        if (String(req.body.codStatus) !== 'Collected') {
            return next(new ErrorHandler('Invalid cash collection status', 400))
        }
        if (order.codStatus === 'Collected') {
            return next(new ErrorHandler('Cash has already been collected for this order', 400))
        }
        order.codStatus = 'Collected';
        order.codCollectedAt = Date.now();
        await order.save();
        return res.status(200).json({
            success: true,
            order
        })
    }

    if (order.orderStatus === 'Delivered') {
        return next(new ErrorHandler('Order has already been delivered', 400))
    }
    if (nextStatus !== 'Out for Delivery' && nextStatus !== 'Delivered') {
        return next(new ErrorHandler('Delivery status can only be set to Out for Delivery or Delivered', 400))
    }

    if (nextStatus === 'Delivered') {
        const otp = String(req.body.otp || '').trim();
        const expected = orderOtp(order);
        if (!otp || otp !== expected) {
            return next(new ErrorHandler(`Invalid OTP. Please confirm the last 4 digits of the customer's phone number with them`, 400))
        }
        order.deliveredAt = Date.now();
        if (order.paymentMethod === 'cod') {
            const collected = req.body.codCollected === true || req.body.codCollected === 'true';
            if (collected) {
                order.codStatus = 'Collected';
                order.codCollectedAt = Date.now();
            }
        }
    }

    order.orderStatus = nextStatus;
    await order.save();

    res.status(200).json({
        success: true,
        order
    })
});

//Delivery Boy: Delivery history (delivered/cancelled) - /api/v1/delivery/history
exports.deliveryHistory = catchAsyncError(async (req, res, next) => {
    const orders = await Order.find({
        deliveryBoy: req.user.id,
        orderStatus: { $in: ['Delivered', 'Cancelled'] }
    }).populate('user', 'name email').sort('-createdAt');

    res.status(200).json({
        success: true,
        orders
    })
});
