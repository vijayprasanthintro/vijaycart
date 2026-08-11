const catchAsyncError = require('../middlewares/catchAsyncError');
const SellerApplication = require('../models/sellerApplicationModel');
const User = require('../models/userModel');
const ErrorHandler = require('../utils/errorHandler');

//Become a Seller - POST /api/v1/seller/apply (authenticated customer)
exports.applySeller = catchAsyncError(async (req, res, next) => {
    const { storeName, storeCategory, storePhone, storeCity, gstin } = req.body || {};

    //Already a seller: no need to apply again.
    if (req.user.role === 'seller') {
        return res.status(200).json({
            success: true,
            message: 'You are already registered as a seller.'
        });
    }

    //One pending application per user; an existing one is returned so the
    //customer page can show its status instead of silently submitting again.
    const existing = await SellerApplication.findOne({
        user: req.user.id,
        status: 'pending'
    }).populate('user', 'name email');

    if (existing) {
        return res.status(200).json({
            success: true,
            application: existing,
            message: 'You already have a seller application under review.'
        });
    }

    const application = await SellerApplication.create({
        user: req.user.id,
        storeName: String(storeName).trim(),
        storeCategory: String(storeCategory).trim(),
        storePhone: String(storePhone).replace(/\D/g, ''),
        storeCity: String(storeCity).trim(),
        gstin: gstin ? String(gstin).trim() : ''
    });

    res.status(201).json({
        success: true,
        application,
        message: 'Your seller application has been submitted. Our team will review it shortly.'
    });
});

//Current user's application status - GET /api/v1/seller/application
exports.getMySellerApplication = catchAsyncError(async (req, res, next) => {
    const application = await SellerApplication.findOne({ user: req.user.id })
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        application: application || null
    });
});

//Admin: list all seller applications - GET /api/v1/admin/seller-applications
exports.getSellerApplications = catchAsyncError(async (req, res, next) => {
    const applications = await SellerApplication.find()
        .populate('user', 'name email mobile createdAt')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        applications
    });
});

//Admin: approve or reject an application - PUT /api/v1/admin/seller-applications/:id
//Approving promotes the applicant to the "seller" role so they can be surfaced
//as a registered seller on the platform.
exports.updateSellerApplication = catchAsyncError(async (req, res, next) => {
    const { status, adminNote } = req.body || {};

    if (!['approved', 'rejected'].includes(status)) {
        return next(new ErrorHandler('Please choose either approve or reject', 400));
    }

    const application = await SellerApplication.findById(req.params.id);
    if (!application) {
        return next(new ErrorHandler('Seller application not found', 404));
    }

    application.status = status;
    if (adminNote) application.adminNote = String(adminNote).trim().slice(0, 300);
    application.reviewedAt = new Date();
    application.reviewedBy = req.user.id;

    if (status === 'approved') {
        await User.findByIdAndUpdate(application.user, { role: 'seller' });
    }

    await application.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        application,
        message: status === 'approved'
            ? 'Application approved. The user is now a seller.'
            : 'Application rejected.'
    });
});
