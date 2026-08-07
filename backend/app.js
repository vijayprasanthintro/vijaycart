const express = require('express');
const app = express();
const compression = require('compression');
const errorMiddleware = require('./middlewares/error');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
dotenv.config({path:path.join(__dirname,"config/config.env")});

app.use(compression());

// Security headers. CSP allows same-origin assets, inline styles (React inline
// styles + Bootstrap), uploaded product images and the Stripe checkout frame.
// When the API is served from a different origin than the frontend (e.g.
// Vercel frontend + Railway API), list that origin in CSP_CONNECT_SRC
// (comma-separated) so fetch/XHR calls are still allowed.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            fontSrc: ["'self'", "data:"],
            connectSrc: ["'self'", ...String(process.env.CSP_CONNECT_SRC || '').split(',').map(s => s.trim()).filter(Boolean)],
            frameSrc: ["'self'", "https://js.stripe.com"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Request logging. Development goes to stdout in the readable dev format;
// production streams structured JSON through the shared logger.
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
} else {
    app.use(morgan('dev'));
}

// Behind Railway/Vercel the client IP arrives via X-Forwarded-For; two trusted
// hops cover (proxy -> load balancer). Required for accurate rate limiting.
app.set('trust proxy', 2);

// OTP request throttling — keyed by IP + target identifier so a shared network
// can't be locked out while still blocking brute-force/spam per target.
const otpRequestLimiter = rateLimit({
    windowMs: (Number(process.env.OTP_RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
    limit: Number(process.env.OTP_RATE_LIMIT_MAX) || 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const body = req.body || {};
        const id = String(body.mobile || body.email || '').replace(/\D/g, '') || 'anon';
        return `${ipKeyGenerator(req)}:${id}`;
    },
    handler: (req, res, next) => {
        res.status(429).json({ success: false, message: 'Too many OTP requests. Please try again in a while.' });
    }
});

// General API throttling — default 300 requests per 15 minutes per IP so a
// single client can't hammer every endpoint. Tune via API_RATE_LIMIT_MAX.
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.API_RATE_LIMIT_MAX) || 300,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({ success: false, message: 'Too many requests. Please try again in a while.' });
    }
});

// Stricter throttle for OTP verification / login attempts.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({ success: false, message: 'Too many attempts. Please try again in a while.' });
    }
});

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

// Bound JSON/urlencoded bodies and clean input before routes run:
//  - mongoSanitize strips $ and . from keys to block query-injection.
//  - xssClean strips < > from strings to block stored XSS in reviews/comments.
//  - hpp collapses duplicate query params, whitelisting the filter fields that
//    legitimately use operator arrays (e.g. price[gte], ratings[lte]).
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '2mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.JSON_BODY_LIMIT || '2mb' }));
app.use(mongoSanitize());
app.use(xssClean());
app.use(hpp({ whitelist: ['price', 'ratings', 'category', 'brand', 'seller', 'keyword'] }));
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

app.use('/api/v1', apiLimiter);
app.use('/api/v1/otp/verify', authLimiter);
app.use('/api/v1/otp/request', otpRequestLimiter);

// Caching policy for the API: authenticated/stateful responses are never
// cached; public product reads get a short browser cache so repeat visits
// don't re-fetch the same catalog. Set before the routes so route-level
// handlers can override.
app.use('/api/v1', (req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store');
    next();
});
app.use('/api/v1/products', (req, res, next) => {
    if (req.method === 'GET') res.setHeader('Cache-Control', 'public, max-age=30');
    next();
});
app.use('/api/v1/product/', (req, res, next) => {
    if (req.method === 'GET') res.setHeader('Cache-Control', 'public, max-age=60');
    next();
});

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

// Unknown API routes return JSON instead of falling through to the SPA.
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'Resource not found' });
});

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
