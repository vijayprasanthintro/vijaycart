const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name : {
        type: String,
        required: [true, "Please enter product name"],
        trim: true,
        maxLength: [100, "Product name cannot exceed 100 characters"]
    },
    price: {
        type: Number,
        required: true,
        default: 0.0
    },
    mrp: {
        type: Number,
        default: 0.0
    },
    discount: {
        type: Number,
        min: [0, 'Discount cannot be negative'],
        max: [95, 'Discount cannot exceed 95%'],
        default: 0
    },
    brand: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        required: [true, "Please enter product description"]
    },
    specifications: [
        {
            label: {
                type: String,
                trim: true
            },
            value: {
                type: String,
                trim: true
            }
        }
    ],
    features: [String],
    highlights: [String],
    warranty: {
        type: String,
        trim: true
    },
    ratings: {
        type: String,
        default: 0
    },
    images: [
        {
            image: {
                type: String,
                required: true
            }
        }
    ],
    category: {
        type: String,
        required: [true, "Please enter product category"],
        enum: {
            values: [
                'Electronics',
                'Mobile Phones',
                'Smartphones',
                'Laptops',
                'Tablets',
                'Headphones',
                'Audio',
                'Cameras',
                'Monitors',
                'Televisions',
                'Gaming',
                'Drones',
                'Wearables',
                'Components',
                'Accessories',
                'Clothes/Shoes',
                'Home',
                'Food',
                'Sports',
                'Outdoor',
                'Books',
                'Beauty/Health'
            ],
            message : "Please select correct category"
        }
    },
    seller: {
        type: String,
        required: [true, "Please enter product seller"]
    },
    stock: {
        type: Number,
        required: [true, "Please enter product stock"],
        maxLength: [20, 'Product stock cannot exceed 20']
    },
    numOfReviews: {
        type: Number,
        default: 0
    },
    reviews: [
        {
            user:{
                type:mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            userName: {
                type: String,
                trim: true
            },
            rating: {
                type: String,
                required: true
            },
            comment: {
                type: String,
                required: true
            }
        }
    ],
    user: {
        type : mongoose.Schema.Types.ObjectId
    }
    ,
    createdAt:{
        type: Date,
        default: Date.now()
    }
})

// Indexes for the hot read paths (category filters, price/rating ranges,
// and the seller-based "similar products" sort).
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ ratings: 1 });
productSchema.index({ seller: 1 });

let schema = mongoose.model('Product', productSchema)

module.exports = schema