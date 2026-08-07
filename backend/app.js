const express = require('express');
const app = express();
const compression = require('compression');
const errorMiddleware = require('./middlewares/error');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config({path:path.join(__dirname,"config/config.env")});

app.use(compression());

// CORS — environment-based allow-list. Credentials (the httpOnly auth cookie)
// forbid a wildcard origin, so the exact frontend origin(s) are configured via
// FRONTEND_URL (comma-separated for multiple domains). CORS_ORIGINS can add
// extra origins (e.g. a staging frontend). Local dev origins are always
// allowed so no .env change is needed to run the frontend + backend locally.
const buildAllowedOrigins = () => {
    const envOrigins = [
        ...String(process.env.FRONTEND_URL || '').split(','),
        ...String(process.env.CORS_ORIGINS || '').split(',')
    ].map(s => s.trim()).filter(Boolean);
    const devOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:8000',
        'http://127.0.0.1:8000'
    ];
    return [...new Set([...devOrigins, ...envOrigins])];
};
const ALLOWED_ORIGINS = buildAllowedOrigins();

app.use(cors({
    origin: (origin, cb) => {
        // No Origin header: server-to-server / curl / Postman / mobile clients.
        if (!origin) return cb(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname,'uploads')));

const products = require('./routes/product');
const auth = require('./routes/auth');
const order = require('./routes/order');
const payment = require('./routes/payment');
const pincode = require('./routes/pincode');
const delivery = require('./routes/delivery');
const category = require('./routes/category');
const coupon = require('./routes/coupon');
const setting = require('./routes/setting');
const admin = require('./routes/admin');

app.use('/api/v1/',products);
app.use('/api/v1/',auth);
app.use('/api/v1/',order);
app.use('/api/v1/',payment);
app.use('/api/v1/',pincode);
app.use('/api/v1/',delivery);
app.use('/api/v1/',category);
app.use('/api/v1/',coupon);
app.use('/api/v1/',setting);
app.use('/api/v1/',admin);

// Health check — mounted before the production SPA catch-all so it is never
// swallowed by the frontend fallback route. Works locally and on Railway and
// returns no sensitive data.
const health = require('./routes/health');
app.use('/api/health', health);

if(process.env.NODE_ENV === "production") {
    const buildDir = path.join(__dirname, '../frontend/build');

    // react-scripts emits content-hashed files under /static/, safe to cache
    // long-term (immutable). Serves before the generic static middleware so
    // hashed assets get the aggressive caching headers.
    app.use('/static', express.static(path.join(buildDir, 'static'), {
        maxAge: '365d',
        immutable: true
    }));

    // HTML + everything else: no-cache so deploys are picked up immediately.
    app.use(express.static(buildDir, {
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.html')) {
                res.setHeader('Cache-Control', 'no-cache');
            }
        }
    }));

    app.get('*', (req, res) =>{
        res.sendFile(path.resolve(buildDir, 'index.html'))
    })
}

app.use(errorMiddleware);

module.exports = app;
