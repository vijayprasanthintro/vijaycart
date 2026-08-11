const mongoose = require('mongoose');

//Seller application submitted from the "Become a Seller" page. Admins review
//these in the admin panel and approve (which promotes the user to the
//"seller" role) or reject them.
const sellerApplicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide the applicant user']
    },
    storeName: {
        type: String,
        required: [true, 'Please enter your store name'],
        trim: true,
        maxlength: [80, 'Store name cannot exceed 80 characters']
    },
    storeCategory: {
        type: String,
        required: [true, 'Please select a store category'],
        trim: true,
        maxlength: [80, 'Store category cannot exceed 80 characters']
    },
    storePhone: {
        type: String,
        trim: true,
        required: [true, 'Please enter a store contact number'],
        validate: {
            validator: function (v) {
                return /^[6-9]\d{9}$/.test(String(v).replace(/\D/g, ''));
            },
            message: 'Please enter a valid 10-digit mobile number'
        }
    },
    storeCity: {
        type: String,
        required: [true, 'Please enter your city'],
        trim: true,
        maxlength: [80, 'City cannot exceed 80 characters']
    },
    gstin: {
        type: String,
        trim: true,
        maxlength: [15, 'GSTIN cannot exceed 15 characters'],
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    adminNote: {
        type: String,
        trim: true,
        maxlength: [300, 'Note cannot exceed 300 characters']
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

//A user can only have one open (non-reviewed) application at a time.
sellerApplicationSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('SellerApplication', sellerApplicationSchema);
