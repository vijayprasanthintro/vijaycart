const catchAsyncError = require('../middlewares/catchAsyncError');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');

//Admin: Analytics overview - /api/v1/admin/analytics
exports.getAnalytics = catchAsyncError(async (req, res, next) => {
    const [orders, products, users] = await Promise.all([
        Order.find().populate('user', 'name email').sort('-createdAt'),
        Product.find(),
        User.find()
    ]);

    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.orderStatus === 'Delivered');

    let revenue = 0;
    let paidRevenue = 0;
    let pendingRevenue = 0;
    const ACTIVE_STATUSES = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery'];
    orders.forEach(o => {
        if (o.orderStatus === 'Cancelled' || o.orderStatus === 'Cancelled by Customer') return;
        revenue += o.totalPrice;
        if (o.orderStatus === 'Delivered') paidRevenue += o.totalPrice;
        if (ACTIVE_STATUSES.includes(o.orderStatus)) pendingRevenue += o.totalPrice;
    });

    const totalProducts = products.length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;

    const totalUsers = users.length;
    const customers = users.filter(u => u.role === 'user').length;
    const deliveryBoys = users.filter(u => u.role === 'deliveryboy').length;
    const admins = users.filter(u => u.role === 'admin').length;

    //Legacy orders created before the Pending/Confirmed/Shipped vocabulary are
    //migrated on startup, but the counts stay robust for in-flight documents.
    const normalizeStatus = s => s === 'Processing' ? 'Pending' : s;
    const statusCounts = {};
    const statusRevenue = {};
    orders.forEach(o => {
        const key = normalizeStatus(o.orderStatus);
        statusCounts[key] = (statusCounts[key] || 0) + 1;
        statusRevenue[key] = (statusRevenue[key] || 0) + o.totalPrice;
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
            if (o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Cancelled by Customer') entry.revenue += o.totalPrice;
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

    //Top customers by lifetime spend (cancelled orders excluded).
    const customerMap = new Map();
    orders.forEach(o => {
        if (o.orderStatus === 'Cancelled' || o.orderStatus === 'Cancelled by Customer') return;
        const key = String(o.user?._id || o.user || o.shippingInfo?.phoneNo || '');
        if (!key) return;
        if (!customerMap.has(key)) {
            customerMap.set(key, {
                userId: key,
                name: (o.user && o.user.name) || o.shippingInfo?.name || 'Guest',
                email: (o.user && o.user.email) || '',
                phone: o.shippingInfo?.phoneNo || '',
                orders: 0,
                spend: 0,
                lastOrderAt: o.createdAt
            });
        }
        const rec = customerMap.get(key);
        rec.orders += 1;
        rec.spend += o.totalPrice;
        if (!rec.lastOrderAt || new Date(o.createdAt) > new Date(rec.lastOrderAt)) rec.lastOrderAt = o.createdAt;
    });
    const topCustomers = Array.from(customerMap.values())
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 10);

    //Low-stock items surfaced as alerts on the dashboard/inventory page.
    const lowStockProducts = products
        .filter(p => p.stock > 0 && p.stock <= 5)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 12)
        .map(p => ({ _id: p._id, name: p.name, category: p.category, stock: p.stock, price: p.price, image: p.images && p.images[0] ? p.images[0].image : '' }));

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
            returnRequests,
            topCustomers,
            lowStockProducts
        }
    })
});
