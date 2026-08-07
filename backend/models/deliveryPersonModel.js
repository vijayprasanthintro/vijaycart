const mongoose = require('mongoose');

const deliveryPersonSchema = new mongoose.Schema({
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    //Optional vehicle/registration number shown to the customer when the
    //order is Out for Delivery so they can spot the right rider.
    vehicleNumber: {
        type: String,
        trim: true,
        default: ''
    },
    availability: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['free', 'on-delivery', 'offline'],
        default: 'free'
    },
    assignedOrders: [
        {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Order'
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

deliveryPersonSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

let deliveryPersonModel = mongoose.model('DeliveryPerson', deliveryPersonSchema);

module.exports = deliveryPersonModel;
