const catchAsyncError = require('../middlewares/catchAsyncError');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const Setting = require('../models/settingModel');
const ErrorHandler = require('../utils/errorHandler');
const sendToken = require('../utils/jwt');

//Admin login (email + password) - POST /api/v1/admin/login
//A separate, simple password path for admin access that does not depend on
//the customer OTP flow. Regular users keep using OTP.
exports.loginAdmin = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return next(new ErrorHandler('Please enter email and password', 400));
    }

    // select('+password') overrides the field's select:false so bcrypt can run.
    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+password');

    if (!user || !user.password) {
        // Same message for "no account" and "no password set yet" so the
        // endpoint does not reveal which accounts exist.
        return next(new ErrorHandler('Invalid credentials. Run the admin seeder if the password was never set.', 401));
    }

    if (user.role !== 'admin') {
        return next(new ErrorHandler('Admin access only. This account is not an admin.', 403));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return next(new ErrorHandler('Invalid credentials', 401));
    }

    // sendToken sets the JWT cookie with maxAge (never the old `expires`
    // form) and returns the admin user without the password field.
    sendToken(user, 200, res);
});

//Admin: Analytics overview - /api/v1/admin/analytics
exports.getAnalytics = catchAsyncError(async (req, res, next) => {
    const [orders, products, users] = await Promise.all([
        Order.find().populate('user', 'name email').sort('-createdAt'),
        Product.find(),
        User.find()
    ]);

    // The low-stock alert threshold is configurable from Settings so the
    // dashboard/inventory warnings follow the store's own stock policy.
    const settings = await Setting.findOne({ key: 'global' });
    const LOW_STOCK_THRESHOLD = Math.max(1, Math.floor(Number(settings && settings.lowStockThreshold) || 5));

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
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;

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

    // Range-driven revenue/order trend. Buckets adapt so every range stays
    // readable: daily up to 30d, weekly up to 180d, monthly for the full year.
    const RANGES = { 7: 7, 14: 14, 30: 30, 90: 90, 180: 180, 365: 365 };
    const days = RANGES[req.query.range] || 14;
    const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
    const startOfWeek = d => { const x = startOfDay(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
    const startOfMonth = d => { const x = startOfDay(d); x.setDate(1); return x; };
    const bucketStart = days <= 30 ? startOfDay : days <= 180 ? startOfWeek : startOfMonth;
    const nextBucket = s => {
        const n = new Date(s);
        if (days <= 30) n.setDate(n.getDate() + 1);
        else if (days <= 180) n.setDate(n.getDate() + 7);
        else n.setMonth(n.getMonth() + 1);
        return n;
    };
    const bucketLabel = s => {
        if (days <= 30) return s.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        if (days <= 180) return s.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        return s.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    };

    const now = new Date();
    const trendFrom = new Date(now);
    trendFrom.setDate(trendFrom.getDate() - (days - 1));
    const dayMap = new Map();
    let cur = bucketStart(trendFrom);
    const trendEnd = bucketStart(now);
    let guard = 0;
    while (cur <= trendEnd && guard < 500) {
        const end = nextBucket(cur);
        dayMap.set(cur.getTime(), {
            start: cur.getTime(),
            end: end.getTime(),
            date: cur.toISOString().slice(0, 10),
            label: bucketLabel(cur),
            orders: 0,
            revenue: 0
        });
        cur = end;
        guard++;
    }
    orders.forEach(o => {
        const d = bucketStart(new Date(o.createdAt));
        const entry = dayMap.get(d.getTime());
        if (entry) {
            entry.orders += 1;
            if (o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Cancelled by Customer') entry.revenue += o.totalPrice;
        }
    });
    const orderTrend = Array.from(dayMap.values());

    // Today / this week / this month sales (rolling, cancelled excluded).
    const dayStart = startOfDay(now).getTime();
    const weekStart = dayStart - 6 * 86400000;
    const monthStart = dayStart - 29 * 86400000;
    let todayRevenue = 0, todayOrders = 0, weekRevenue = 0, weekOrders = 0, monthRevenue = 0, monthOrders = 0;
    orders.forEach(o => {
        if (o.orderStatus === 'Cancelled' || o.orderStatus === 'Cancelled by Customer') return;
        const t = new Date(o.createdAt).getTime();
        if (t >= dayStart) { todayRevenue += o.totalPrice; todayOrders += 1; }
        if (t >= weekStart) { weekRevenue += o.totalPrice; weekOrders += 1; }
        if (t >= monthStart) { monthRevenue += o.totalPrice; monthOrders += 1; }
    });

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
    //Includes out-of-stock so restock actions are never missed. The threshold
    //is the store's configured value from Settings.
    const lowStockProducts = products
        .filter(p => p.stock <= LOW_STOCK_THRESHOLD)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 12)
        .map(p => ({ _id: p._id, name: p.name, category: p.category, stock: p.stock, threshold: LOW_STOCK_THRESHOLD, price: p.price, image: p.images && p.images[0] ? p.images[0].image : '' }));

    //Newest customer signups, for the dashboard "recent customers" panel.
    users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const recentUsers = users
        .filter(u => u.role === 'user')
        .slice(0, 5)
        .map(u => ({ _id: u._id, name: u.name, email: u.email, avatar: u.avatar || '', createdAt: u.createdAt }));

    res.status(200).json({
        success: true,
        analytics: {
            totalOrders,
            revenue,
            paidRevenue,
            pendingRevenue,
            completedOrders: deliveredOrders.length,
            cancelledOrders: (statusCounts['Cancelled'] || 0) + (statusCounts['Cancelled by Customer'] || 0),
            todayRevenue,
            todayOrders,
            weekRevenue,
            weekOrders,
            monthRevenue,
            monthOrders,
            totalProducts,
            outOfStock,
            lowStock,
            lowStockThreshold: LOW_STOCK_THRESHOLD,
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
            recentUsers,
            returnRequests,
            topCustomers,
            lowStockProducts
        }
    })
});
