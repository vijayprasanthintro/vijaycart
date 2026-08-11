const mongoose = require('mongoose');

// "Notify Me" entries: a logged-in user asking to be told when an out-of-stock
// product is back. One row per (user, product); the unique compound index makes
// re-subscribing idempotent (a second POST is simply ignored).
const waitlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

waitlistSchema.index({ user: 1, product: 1 }, { unique: true });
waitlistSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('Waitlist', waitlistSchema);
