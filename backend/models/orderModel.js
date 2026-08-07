const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    shippingInfo: {
        address: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        phoneNo: {
            type: String,
            required: true
        },
        postalCode: {
            type: String,
            required: true
        },
        state: {
            type: String
        },
        name: {
            type: String
        },
        district: {
            type: String
        },
        locality: {
            type: String
        },
        landmark: {
            type: String
        },
        instructions: {
            type: String
        },
        type: {
            type: String,
            default: 'home'
        }
    },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
        ref: 'User'
    },
    // Client-generated idempotency key for this checkout session. Used to
    // prevent duplicate orders when a payment is submitted more than once
    // (double-click, network retry). Sparse so older orders without a key
    // (and the unique constraint) are unaffected.
    orderKey: {
        type: String,
        unique: true,
        sparse: true
    },
    //Human-readable sequential order number shown to customers (e.g. VC10001).
    orderNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    deliveryBoy: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    },
    orderItems: [{
        name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        image: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        product: {
            type: mongoose.SchemaTypes.ObjectId,
            required: true,
            ref: 'Product'
        }

    }],
    itemsPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    taxPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    discountPrice: {
        type: Number,
        default: 0.0
    },
    couponCode: {
        type: String
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    paymentMethod: {
        type: String,
        enum: ['upi', 'card', 'netbanking', 'wallet', 'cod'],
        default: 'card'
    },
    codStatus: {
        type: String,
        enum: ['Pending', 'Collected'],
        default: 'Pending'
    },
    codCollectedAt: {
        type: Date
    },
    paymentInfo: {
        id: {
            type: String,
            required: true
        },
        status: {
            type: String,
            required: true
        }
    },
    paidAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    //When the delivery partner marks the order Out for Delivery. Used to show
    //the customer an estimated arrival window on the tracking page.
    estimatedArrivalTime: {
        type: Date
    },
    orderStatus: {
        type: String,
        required: true,
        default: 'Pending',
        enum: [
            'Pending',
            'Confirmed',
            'Packed',
            'Shipped',
            'Out for Delivery',
            'Delivered',
            'Cancelled',
            'Cancelled by Customer'
        ]
    },
    //Audit trail behind the visual order timeline. Every status change is
    //appended with the acting user and a timestamp.
    statusHistory: [
        {
            status: {
                type: String,
                trim: true
            },
            changedAt: {
                type: Date,
                default: Date.now
            },
            changedBy: {
                type: mongoose.SchemaTypes.ObjectId,
                ref: 'User'
            },
            note: {
                type: String,
                trim: true
            }
        }
    ],
    deliveryDate: {
        type: Date
    },
    returnStatus: {
        type: String,
        enum: [
            'None',
            'Return Requested',
            'Replacement Requested',
            'Return Approved',
            'Replacement Approved',
            'Return Rejected',
            'Replacement Rejected',
            'Return Completed',
            'Replacement Completed'
        ],
        default: 'None'
    },
    returnReason: {
        type: String
    },
    returnRequestedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

let orderModel = mongoose.model('Order', orderSchema);

module.exports = orderModel;