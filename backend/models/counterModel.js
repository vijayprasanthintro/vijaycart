const mongoose = require('mongoose');

// Atomic increment counters, used for human-readable sequential identifiers
// such as order numbers (VC10001, VC10002, ...).
const counterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    seq: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Counter', counterSchema);
