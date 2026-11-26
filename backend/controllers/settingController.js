const catchAsyncError = require('../middlewares/catchAsyncError');
const Setting = require('../models/settingModel');
const ErrorHandler = require('../utils/errorHandler');
const {
    DEFAULT_DESIGN_ID,
    getDesign,
    listDesigns,
    sanitizeCustomization,
    resolveDesign
} = require('../utils/designs');

/**
 * Normalise the persisted design sub-document. Older stores (created before
 * the Design Studio existed) simply have no `design` field, so every read
 * falls back to the default design without a migration step.
 */
function readDesignState(settings) {
    const raw = settings && settings.design
        ? (typeof settings.design.toObject === 'function' ? settings.design.toObject() : settings.design)
        : {};

    const designId = getDesign(raw.designId) ? raw.designId : DEFAULT_DESIGN_ID;
    const previousDesignId = raw.previousDesignId && getDesign(raw.previousDesignId)
        ? raw.previousDesignId
        : null;

    return {
        designId,
        customization: sanitizeCustomization(raw.customization || {}),
        previousDesignId,
        previousCustomization: previousDesignId
            ? sanitizeCustomization(raw.previousCustomization || {})
            : {},
        appliedAt: raw.appliedAt || null
    };
}

/** Convert a Mongoose document into the public settings payload. */
function serializeSettings(settings) {
    const payload = typeof settings.toObject === 'function'
        ? settings.toObject()
        : Object.assign({}, settings);

    const state = readDesignState(settings);
    const design = getDesign(state.designId) || getDesign(DEFAULT_DESIGN_ID);

    payload.design = {
        designId: state.designId,
        name: design.name,
        category: design.category,
        customization: state.customization,
        tokens: resolveDesign(state.designId, state.customization),
        previousDesignId: state.previousDesignId,
        previousCustomization: state.previousCustomization,
        appliedAt: state.appliedAt
    };

    return payload;
}

async function getOrCreateSettings() {
    let settings = await Setting.findOne({ key: 'global' });
    if (!settings) {
        settings = await Setting.create({ key: 'global' });
    }
    return settings;
}

//Get store settings - /api/v1/settings
exports.getSettings = catchAsyncError(async (req, res, next) => {
    const settings = await getOrCreateSettings();
    // Theme/design must never be served stale; the storefront applies it before
    // first paint and admins expect saves to be visible on the next refresh.
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.status(200).json({
        success: true,
        settings: serializeSettings(settings)
    });
});

//Admin: Update store settings - /api/v1/admin/settings
exports.updateSettings = catchAsyncError(async (req, res, next) => {
    const settings = await getOrCreateSettings();

    const allowed = [
        'storeName', 'storeTagline', 'currency', 'supportEmail', 'supportPhone',
        'shippingFee', 'freeShippingAbove', 'deliveryEstimateDays', 'announcement', 'permissions',
        'codEnabled', 'codMaxAmount', 'codPincodes',
        'prepaidEnabled', 'stripeEnabled',
        'metaTitle', 'metaDescription',
        'enableRatings', 'enableWishlist', 'enableReviews', 'showDeliveryEstimate',
        'lowStockThreshold', 'defaultOrderStatus',
        'enableWaitlist', 'waitlistMessage'
    ];

    allowed.forEach((field) => {
        if (req.body[field] !== undefined) {
            settings[field] = req.body[field];
        }
    });

    settings.updatedAt = Date.now();
    await settings.save();

    res.status(200).json({
        success: true,
        settings: serializeSettings(settings)
    });
});

/* ------------------------------------------------------------------ */
/* Website Design Studio                                               */
/* ------------------------------------------------------------------ */

//Public catalog - /api/v1/designs
exports.getDesigns = catchAsyncError(async (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=300');
    res.status(200).json({
        success: true,
        defaultDesignId: DEFAULT_DESIGN_ID,
        designs: listDesigns()
    });
});

//Admin: apply a design to the live storefront - PUT /api/v1/admin/designs/apply
exports.applyDesign = catchAsyncError(async (req, res, next) => {
    const { designId } = req.body || {};
    if (!getDesign(designId)) {
        return next(new ErrorHandler('Please choose a valid design.', 400));
    }

    const settings = await getOrCreateSettings();
    const current = readDesignState(settings);
    const customization = sanitizeCustomization(req.body.customization || {});

    settings.design = {
        designId,
        customization,
        previousDesignId: current.designId,
        previousCustomization: current.customization,
        appliedAt: new Date()
    };
    settings.markModified('design');
    settings.updatedAt = Date.now();
    await settings.save();

    res.status(200).json({
        success: true,
        message: 'Design applied to the live storefront.',
        settings: serializeSettings(settings)
    });
});

//Admin: save customisation without discarding the reset target - PUT /api/v1/admin/designs/save
exports.saveDesign = catchAsyncError(async (req, res, next) => {
    const { designId } = req.body || {};
    if (!getDesign(designId)) {
        return next(new ErrorHandler('Please choose a valid design.', 400));
    }

    const settings = await getOrCreateSettings();
    const current = readDesignState(settings);
    const customization = sanitizeCustomization(req.body.customization || {});

    // Saving the currently live design keeps the original reset target, so
    // "Reset" still returns to the design that was live before the session.
    const keepPrevious = current.designId === designId && current.previousDesignId;

    settings.design = {
        designId,
        customization,
        previousDesignId: keepPrevious ? current.previousDesignId : current.designId,
        previousCustomization: keepPrevious ? current.previousCustomization : current.customization,
        appliedAt: new Date()
    };
    settings.markModified('design');
    settings.updatedAt = Date.now();
    await settings.save();

    res.status(200).json({
        success: true,
        message: 'Design saved.',
        settings: serializeSettings(settings)
    });
});

//Admin: restore the previous design - POST /api/v1/admin/designs/reset
exports.resetDesign = catchAsyncError(async (req, res, next) => {
    const settings = await getOrCreateSettings();
    const current = readDesignState(settings);

    const targetId = current.previousDesignId || DEFAULT_DESIGN_ID;
    const targetCustomization = current.previousDesignId ? current.previousCustomization : {};

    settings.design = {
        designId: targetId,
        customization: targetCustomization,
        previousDesignId: current.designId,
        previousCustomization: current.customization,
        appliedAt: new Date()
    };
    settings.markModified('design');
    settings.updatedAt = Date.now();
    await settings.save();

    res.status(200).json({
        success: true,
        message: 'Previous design restored.',
        settings: serializeSettings(settings)
    });
});
