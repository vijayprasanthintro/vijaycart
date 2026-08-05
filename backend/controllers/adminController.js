const catchAsyncError = require('../middlewares/catchAsyncError');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');

//Admin: Analytics overview - /api/v1/admin/analytics
exports.getAnalytics = catchAsyncError(async (req, res, next) => {
    const [orders, products, users] = await Promise.all([
        Order.find().sort('-createdAt'),
        Product.find(),
        User.find()
    ]);

    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.orderStatus === 'Delivered');

    let revenue = 0;
    let paidRevenue = 0;
    let pendingRevenue = 0;
    orders.forEach(o => {
        if (o.orderStatus === 'Cancelled') return;
        revenue += o.totalPrice;
        if (o.orderStatus === 'Delivered') paidRevenue += o.totalPrice;
        if (['Processing', 'Packed', 'Out for Delivery'].includes(o.orderStatus)) pendingRevenue += o.totalPrice;
    });

    const totalProducts = products.length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;

    const totalUsers = users.length;
    const customers = users.filter(u => u.role === 'user').length;
    const deliveryBoys = users.filter(u => u.role === 'deliveryboy').length;
    const admins = users.filter(u => u.role === 'admin').length;

    const statusCounts = {};
    const statusRevenue = {};
    orders.forEach(o => {
        statusCounts[o.orderStatus] = (statusCounts[o.orderStatus] || 0) + 1;
        statusRevenue[o.orderStatus] = (statusRevenue[o.orderStatus] || 0) + o.totalPrice;
    });

    const days = 14;
    const dayMap = new Map();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        dayMap.set(d.toDateString(), {
            date: d.toISOString().slice(0, 10),
            label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            orders: 0,
            revenue: 0
        });
    }
    orders.forEach(o => {
        const d = new Date(o.createdAt);
        d.setHours(0, 0, 0, 0);
        const entry = dayMap.get(d.toDateString());
        if (entry) {
            entry.orders += 1;
            if (o.orderStatus !== 'Cancelled') entry.revenue += o.totalPrice;
        }
    });
    const orderTrend = Array.from(dayMap.values());

    const categoryMap = {};
    products.forEach(p => {
        categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
    });
    const categoryDistribution = Object.entries(categoryMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    const productSold = new Map();
    orders.forEach(o => {
        o.orderItems.forEach(item => {
            const key = String(item.product);
            if (!productSold.has(key)) {
                productSold.set(key, { product: item.product, name: item.name, quantity: 0, revenue: 0, image: item.image });
            }
            const rec = productSold.get(key);
            rec.quantity += item.quantity;
            rec.revenue += item.quantity * item.price;
        });
    });
    const topProducts = Array.from(productSold.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 8);

    const recentOrders = orders.slice(0, 8);

    const returnRequests = orders.filter(o => o.returnStatus && o.returnStatus !== 'None').length;

    res.status(200).json({
        success: true,
        analytics: {
            totalOrders,
            revenue,
            paidRevenue,
            pendingRevenue,
            totalProducts,
            outOfStock,
            lowStock,
            totalUsers,
            customers,
            deliveryBoys,
            admins,
            statusCounts,
            statusRevenue,
            orderTrend,
            categoryDistribution,
            topProducts,
            recentOrders,
            returnRequests
        }
    })
});
