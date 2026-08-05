const catchAsyncError = require('../middlewares/catchAsyncError');
const User = require('../models/userModel');
const ErrorHandler = require('../utils/errorHandler');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

exports.processPayment  = catchAsyncError(async(req, res, next) => {
    const paymentIntent = await stripe.paymentIntents.create({
        amount: req.body.amount,
        currency: "usd",
        description: "TEST PAYMENT",
        metadata: { integration_check: "accept_payment"},
        shipping: req.body.shipping
    })

    res.status(200).json({
        success: true,
        client_secret: paymentIntent.client_secret
    })
})

exports.sendStripeApi  = catchAsyncError(async(req, res, next) => {
    res.status(200).json({
        stripeApiKey: process.env.STRIPE_API_KEY
    })
})

//Get logged-in user's wallet balance - /api/v1/wallet
exports.getWallet = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
        balance: Number(user.walletBalance) || 500
    })
})

//Pay for an order using wallet balance - /api/v1/payment/wallet
exports.payWithWallet = catchAsyncError(async (req, res, next) => {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
        return next(new ErrorHandler('Please provide a valid amount to pay', 400))
    }

    const user = await User.findById(req.user.id);
    const balance = Number(user.walletBalance) || 500;
    if (balance < amount) {
        return next(new ErrorHandler('Insufficient wallet balance', 400))
    }

    user.walletBalance = Math.round((balance - amount) * 100) / 100;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        balance: user.walletBalance
    })
})

