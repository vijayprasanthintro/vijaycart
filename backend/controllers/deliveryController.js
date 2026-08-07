const catchAsyncError = require('../middlewares/catchAsyncError');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const DeliveryPerson = require('../models/deliveryPersonModel');
const ErrorHandler = require('../utils/errorHandler');

//Expected OTP for an order — last 4 digits of the customer's phone number.
function orderOtp(order) {
    const digits = String(order.shippingInfo.phoneNo || '').replace(/\D/g, '');
    return digits.slice(-4);
}

//Resolves the delivery profile (DeliveryPerson doc) for a delivery user,
//creating one lazily for legacy delivery accounts created before the model.
async function ensureDeliveryPerson(user) {
    let person = await DeliveryPerson.findOne({ user: user._id });
    if (!person) {
        person = await DeliveryPerson.create({
            user: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || ''
        });
    }
    return person;
}

//Admin: List all delivery boys - /api/v1/admin/deliveryboys
exports.getDeliveryBoys = catchAsyncError(async (req, res, next) => {
    const users = await User.find({ role: 'deliveryboy' }).select('name email avatar role');

    const boys = await Promise.all(users.map(async user => {
        const person = await ensureDeliveryPerson(user);
        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            phone: person.phone || user.phone || '',
            availability: person.availability !== false,
            status: person.status,
            assignedOrders: person.assignedOrders || []
        };
    }));

    res.status(200).json({
        success: true,
        deliveryBoys: boys
    })
});

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

    await DeliveryPerson.create({
        user: deliveryBoy._id,
        name,
        email,
        phone: phone || ''
    });

    res.status(201).json({
        success: true,
        deliveryBoy
    })
});

//Admin: Toggle a delivery boy's availability - /api/v1/admin/deliveryboy/:id/availability
exports.toggleAvailability = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'deliveryboy') {
        return next(new ErrorHandler('Delivery boy not found', 404))
    }

    const person = await ensureDeliveryPerson(user);
    person.availability = req.body.availability === false || req.body.availability === 'false' ? false : true;
    await person.save();

    res.status(200).json({
        success: true,
        deliveryBoy: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: person.phone,
            availability: person.availability,
            status: person.status,
            assignedOrders: person.assignedOrders
        }
    })
});

//Admin: Assign a delivery boy to an order - /api/v1/admin/order/:id/assign
exports.assignOrder = catchAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ErrorHandler(`Order not found with this id: ${req.params.id}`, 404))
    }
    if (order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled') {
        return next(new ErrorHandler(`A ${order.orderStatus.toLowerCase()} order cannot be assigned`, 400))
    }

    if (!req.body.deliveryBoy) {
        return next(new ErrorHandler('Please select a delivery boy to assign', 400))
    }

    const deliveryBoy = await User.findById(req.body.deliveryBoy);
    if (!deliveryBoy || deliveryBoy.role !== 'deliveryboy') {
        return next(new ErrorHandler('Selected user is not a delivery boy', 400))
    }

    const person = await ensureDeliveryPerson(deliveryBoy);
    if (person.availability === false) {
        return next(new ErrorHandler(`${deliveryBoy.name} is currently unavailable. Pick an available delivery person.`, 400))
    }

    //Reassigning: drop the order from the previous boy's list.
    if (order.deliveryBoy && String(order.deliveryBoy) !== String(deliveryBoy._id)) {
        await DeliveryPerson.updateMany(
            { assignedOrders: order._id },
            { $pull: { assignedOrders: order._id } }
        );
    }

    if (!person.assignedOrders.some(id => String(id) === String(order._id))) {
        person.assignedOrders.push(order._id);
    }
    person.status = 'on-delivery';
    await person.save();

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
            return next(new ErrorHandler(`Invalid OTP. Please confirm the last 4 digits of the customer's phone number`, 400))
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
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
        status: nextStatus,
        changedAt: Date.now(),
        changedBy: req.user.id,
        note: 'Delivery partner'
    });
    await order.save();

    //Free the delivery person once the order is completed.
    if (nextStatus === 'Delivered') {
        await DeliveryPerson.updateMany(
            { user: req.user.id },
            { $pull: { assignedOrders: order._id } }
        );
        const person = await DeliveryPerson.findOne({ user: req.user.id });
        if (person) {
            if (!person.assignedOrders.length) person.status = 'free';
            await person.save();
        }
    }

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
