const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter category name'],
        unique: true,
        trim: true,
        maxLength: [50, 'Category name cannot exceed 50 characters']
    },
    icon: {
        type: String,
        default: 'fa-tag'
    },
    sortOrder: {
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

categorySchema.index({ name: 1 });
categorySchema.index({ sortOrder: 1 });

let model = mongoose.model('Category', categorySchema);

module.exports = model;
