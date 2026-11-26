const mongoose = require('mongoose');

/**
 * Persisted state of the Website Design Studio.
 * `designId` is the design that is live on the storefront. `customization`
 * stores only explicit overrides; the full token set is resolved from the
 * design catalog on read, so upgrading a catalog design automatically
 * upgrades every store that uses it.
 */
const designStateSchema = new mongoose.Schema({
    designId: {
        type: String,
        default: 'emox-premium'
    },
    customization: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    previousDesignId: {
        type: String,
        default: null
    },
    previousCustomization: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    appliedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const settingSchema = new mongoose.Schema({
    key: {
        type: String,
        default: 'global',
        unique: true
    },
    storeName: {
        type: String,
        default: 'VijayCart'
    },
    storeTagline: {
        type: String,
        default: 'Marketplace'
    },
    currency: {
        type: String,
        default: 'INR'
    },
    supportEmail: {
        type: String,
        default: 'help@vijaycart.com'
    },
    supportPhone: {
        type: String,
        default: '+91 8220477466'
    },
    shippingFee: {
        type: Number,
        default: 40
    },
    freeShippingAbove: {
        type: Number,
        default: 499
    },
    deliveryEstimateDays: {
        type: Number,
        default: 5
    },
    announcement: {
        type: String,
        default: ''
    },
    codEnabled: {
        type: Boolean,
        default: true
    },
    codMaxAmount: {
        type: Number,
        default: 5000
    },
    codPincodes: {
        type: [String],
        default: []
    },
    prepaidEnabled: {
        type: Boolean,
        default: true
    },
    stripeEnabled: {
        type: Boolean,
        default: true
    },
    //SEO
    metaTitle: {
        type: String,
        default: ''
    },
    metaDescription: {
        type: String,
        default: ''
    },
    //Storefront toggles
    enableRatings: {
        type: Boolean,
        default: true
    },
    enableWishlist: {
        type: Boolean,
        default: true
    },
    enableReviews: {
        type: Boolean,
        default: true
    },
    showDeliveryEstimate: {
        type: Boolean,
        default: true
    },
    //Order / stock defaults
    lowStockThreshold: {
        type: Number,
        default: 5
    },
    defaultOrderStatus: {
        type: String,
        default: 'Pending'
    },
    //Launch / waitlist
    enableWaitlist: {
        type: Boolean,
        default: false
    },
    waitlistMessage: {
        type: String,
        default: ''
    },
    permissions: {
        type: Object,
        default: {}
    },
    // Website Design Studio
    design: {
        type: designStateSchema,
        default: () => ({})
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

settingSchema.index({ key: 1 });

let model = mongoose.model('Setting', settingSchema);

module.exports = model;
