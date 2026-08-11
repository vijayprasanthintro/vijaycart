const catchAsyncError = require('../middlewares/catchAsyncError');
const Banner = require('../models/bannerModel');
const BannerMeta = require('../models/bannerMetaModel');
const ErrorHandler = require('../utils/errorHandler');

//Seed the built-in homepage banners exactly once, on first run. A persistent
//flag keeps this one-time so an admin who deletes every banner (or the last
//one) never sees the defaults resurrect on the next request.
async function ensureSeed() {
    let meta = await BannerMeta.findOne({ key: 'seed' });
    if (meta && meta.done) return;

    const count = await Banner.countDocuments({ position: 'home' });
    //Banners already exist (e.g. seeded by an older build): just record the
    //flag so we never duplicate or resurrect them.
    if (count === 0) {
        await Banner.insertMany(Banner.DEFAULT_BANNERS);
    }
    await BannerMeta.updateOne({ key: 'seed' }, { $set: { done: true } }, { upsert: true });
}

//Public: get active homepage banners - GET /api/v1/banners
exports.getBanners = catchAsyncError(async (req, res, next) => {
    await ensureSeed();
    const banners = await Banner.find({ position: 'home', active: true })
        .sort({ sortOrder: 1 })
        .select('-updatedAt -__v');
    res.status(200).json({
        success: true,
        banners
    });
});

//Admin: list all banners (active + inactive) - GET /api/v1/admin/banners
exports.getAdminBanners = catchAsyncError(async (req, res, next) => {
    await ensureSeed();
    const banners = await Banner.find({ position: 'home' }).sort({ sortOrder: 1 });
    res.status(200).json({
        success: true,
        banners
    });
});

//Admin: create a new banner - POST /api/v1/admin/banner
exports.createBanner = catchAsyncError(async (req, res, next) => {
    const count = await Banner.countDocuments({ position: 'home' });
    const body = {
        position: 'home',
        sortOrder: count,
        ...req.body
    };
    const banner = await Banner.create(body);
    res.status(201).json({
        success: true,
        banner
    });
});

//Admin: update a banner - PUT /api/v1/admin/banner/:id
exports.updateBanner = catchAsyncError(async (req, res, next) => {
    let banner = await Banner.findById(req.params.id);
    if (!banner) {
        return next(new ErrorHandler('Banner not found', 404));
    }

    const allowed = [
        'title', 'subtitle', 'kicker', 'cta', 'linkTo', 'image',
        'accent', 'gradient', 'active', 'sortOrder'
    ];

    allowed.forEach(field => {
        if (req.body[field] !== undefined) {
            banner[field] = req.body[field];
        }
    });

    banner.updatedAt = Date.now();
    await banner.save();

    res.status(200).json({
        success: true,
        banner
    });
});

//Admin: delete a banner - DELETE /api/v1/admin/banner/:id
exports.deleteBanner = catchAsyncError(async (req, res, next) => {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
        return next(new ErrorHandler('Banner not found', 404));
    }
    await banner.deleteOne();
    res.status(200).json({
        success: true,
        message: 'Banner deleted successfully'
    });
});

//Admin: reorder banners - PUT /api/v1/admin/banners/reorder
//body: { order: ["id1", "id2", ...] } — ids in their new display order.
exports.reorderBanners = catchAsyncError(async (req, res, next) => {
    const order = Array.isArray(req.body.order) ? req.body.order : [];
    if (!order.length) {
        return next(new ErrorHandler('Please provide an order array', 400));
    }

    const ops = order.map((id, index) => ({
        updateOne: {
            filter: { _id: id },
            update: { $set: { sortOrder: index, updatedAt: Date.now() } }
        }
    }));
    await Banner.bulkWrite(ops);

    const banners = await Banner.find({ position: 'home' }).sort({ sortOrder: 1 });
    res.status(200).json({
        success: true,
        banners
    });
});
