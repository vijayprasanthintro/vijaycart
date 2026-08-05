const catchAsyncError = require('../middlewares/catchAsyncError');
const ErrorHandler = require('../utils/errorHandler');
const Setting = require('../models/settingModel');
const {
    lookupIndia,
    lookupUSA,
    generateIndia,
    generateUSA,
} = require('../utils/pincodeData');

const COUNTRY_CODES = {
    in: 'in',
    india: 'in',
    us: 'us',
    usa: 'us',
    'united states': 'us',
    gb: 'gb',
    uk: 'gb',
    'united kingdom': 'gb',
    ca: 'ca',
    canada: 'ca',
    au: 'au',
    australia: 'au',
    de: 'de',
    germany: 'de',
    fr: 'fr',
    france: 'fr',
};

const normalizeCode = (country = '') => COUNTRY_CODES[String(country).trim().toLowerCase()] || null;

const fetchWithTimeout = async (url, ms = 4500) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('bad status ' + res.status);
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
};

const liveIndia = async (code) => {
    const raw = await fetchWithTimeout(`https://api.postalpincode.in/pincode/${code}`);
    const first = Array.isArray(raw) ? raw[0] : null;
    const po = first && first.Status === 'Success' && Array.isArray(first.PostOffice) && first.PostOffice[0];
    if (!po) return null;
    return {
        state: po.State || '',
        district: po.District || '',
        city: po.Block || po.District || '',
        area: po.Name || '',
    };
};

const liveUSA = async (code) => {
    const raw = await fetchWithTimeout(`https://api.zippopotam.us/us/${code}`);
    const place = raw && raw.places && raw.places[0];
    if (!place) return null;
    return {
        state: place.state || '',
        district: place['state abbreviation'] || place.state || '',
        city: place['place name'] || '',
        area: place['place name'] || '',
    };
};

// GET /api/v1/pincode/:code?country=in
// Live postal lookup with bundled fallback so checkout always auto-fills.
exports.lookupPincode = catchAsyncError(async (req, res, next) => {
    const code = String(req.params.code || '').replace(/[^0-9]/g, '');
    const country = normalizeCode(req.query.country);

    if (!code || code.length < 3) {
        return next(new ErrorHandler('Please enter a valid postal code', 400));
    }

    const isIndia = country === 'in' || (code.length === 6 && country !== 'us' && country !== 'gb' && country !== 'ca' && country !== 'au' && country !== 'de' && country !== 'fr');
    const isUSA = country === 'us' || (code.length === 5 && !isIndia);

    let data = null;
    let source = 'generated';

    if (isUSA) {
        data = lookupUSA(code);
        if (data) source = 'bundled';
        else {
            try { data = await liveUSA(code); if (data && data.state) source = 'live'; }
            catch (e) { data = null; }
        }
        if (!data || !data.state) { data = generateUSA(code); source = 'generated'; }
    } else {
        data = lookupIndia(code);
        if (data) source = 'bundled';
        else {
            try { data = await liveIndia(code); if (data && data.state) source = 'live'; }
            catch (e) { data = null; }
        }
        if (!data || !data.state) { data = generateIndia(code); source = 'generated'; }
    }

    res.status(200).json({
        success: true,
        source,
        data: {
            state: data.state,
            district: data.district,
            city: data.city,
            area: data.area,
        },
    });
});

// GET /api/v1/pincode/:code/cod?amount=1500
// Cash on Delivery availability for a postal code. Reads the store settings
// (global COD toggle, max COD order amount, optional pincode allow-list).
exports.checkCodAvailability = catchAsyncError(async (req, res, next) => {
    const code = String(req.params.code || '').replace(/[^0-9]/g, '');
    if (!code || code.length < 3) {
        return next(new ErrorHandler('Please enter a valid postal code', 400));
    }

    const settings = await Setting.findOne({ key: 'global' });
    const codEnabled = settings ? settings.codEnabled !== false : true;
    const codMaxAmount = Number(settings && settings.codMaxAmount !== undefined ? settings.codMaxAmount : 5000) || 5000;
    const codPincodes = Array.isArray(settings && settings.codPincodes)
        ? settings.codPincodes.map(p => String(p).trim()).filter(Boolean)
        : [];
    const amount = Number(req.query.amount) || 0;

    let available = codEnabled;
    let reason = '';

    if (available && codPincodes.length > 0 && !codPincodes.includes(code)) {
        available = false;
        reason = 'Cash on Delivery is not available at this pincode yet.';
    }
    if (available && amount > codMaxAmount) {
        available = false;
        reason = `Cash on Delivery is available only for orders up to ₹${codMaxAmount.toLocaleString('en-IN')}.`;
    }

    res.status(200).json({
        success: true,
        pincode: code,
        available,
        reason,
        maxAmount: codMaxAmount
    });
});
