const catchAsyncError = require('../middlewares/catchAsyncError');
const Setting = require('../models/settingModel');
const ErrorHandler = require('../utils/errorHandler');

//Get store settings - /api/v1/settings
exports.getSettings = catchAsyncError(async (req, res, next) => {
    let settings = await Setting.findOne({ key: 'global' });
    if (!settings) {
        settings = await Setting.create({ key: 'global' });
    }
    res.status(200).json({
        success: true,
        settings
    })
});

//Admin: Update store settings - /api/v1/admin/settings
exports.updateSettings = catchAsyncError(async (req, res, next) => {
    let settings = await Setting.findOne({ key: 'global' });
    if (!settings) {
        settings = await Setting.create({ key: 'global' });
    }

    const allowed = [
        'storeName', 'storeTagline', 'currency', 'supportEmail', 'supportPhone',
        'shippingFee', 'freeShippingAbove', 'deliveryEstimateDays', 'announcement', 'permissions',
        'codEnabled', 'codMaxAmount', 'codPincodes'
    ];

    allowed.forEach(field => {
        if (req.body[field] !== undefined) {
            settings[field] = req.body[field];
        }
    });

    settings.updatedAt = Date.now();
    await settings.save();

    res.status(200).json({
        success: true,
        settings
    })
});
