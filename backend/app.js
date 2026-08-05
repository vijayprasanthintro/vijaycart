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

// CORS Configuration
app.use(cors({
    origin: [
        'https://vijaycart-snowy.vercel.app',
        'https://vijayprasanthintros-projects.vercel.app'
    ],
    credentials: true
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
