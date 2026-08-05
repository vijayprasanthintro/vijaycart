const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Please enter coupon code'],
        unique: true,
        uppercase: true,
        trim: true,
        maxLength: [20, 'Coupon code cannot exceed 20 characters']
    },
    description: {
        type: String,
        maxLength: [200, 'Description cannot exceed 200 characters']
    },
    discountType: {
        type: String,
        required: [true, 'Please choose a discount type'],
        enum: ['percent', 'flat']
    },
    discountValue: {
        type: Number,
        required: [true, 'Please enter a discount value'],
        min: [0, 'Discount value cannot be negative']
    },
    minAmount: {
        type: Number,
        default: 0
    },
    maxDiscount: {
        type: Number,
        default: 0
    },
    validFrom: {
        type: Date
    },
    validUntil: {
        type: Date
    },
    usageLimit: {
        type: Number,
        default: 0
    },
    usedCount: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

couponSchema.index({ code: 1 });

let model = mongoose.model('Coupon', couponSchema);

module.exports = model;
