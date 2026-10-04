const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto')

// Saved delivery addresses belong to exactly one user account (subdocuments),
// so the header/checkout always resolve them from the authenticated user and
// no address can ever leak across accounts.
const addressSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Address name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    phoneNo: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        maxlength: [16, 'Phone number cannot exceed 16 characters']
    },
    address: {
        type: String,
        required: [true, 'Address line is required'],
        trim: true,
        maxlength: [300, 'Address cannot exceed 300 characters']
    },
    landmark: {
        type: String,
        trim: true,
        maxlength: [120, 'Landmark cannot exceed 120 characters'],
        default: ''
    },
    instructions: {
        type: String,
        trim: true,
        maxlength: [120, 'Instructions cannot exceed 120 characters'],
        default: ''
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        maxlength: [80, 'City cannot exceed 80 characters']
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
        maxlength: [80, 'State cannot exceed 80 characters']
    },
    district: {
        type: String,
        trim: true,
        maxlength: [80, 'District cannot exceed 80 characters'],
        default: ''
    },
    locality: {
        type: String,
        trim: true,
        maxlength: [120, 'Locality cannot exceed 120 characters'],
        default: ''
    },
    postalCode: {
        type: String,
        required: [true, 'Postal code is required'],
        trim: true,
        maxlength: [10, 'Postal code cannot exceed 10 characters']
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
        maxlength: [80, 'Country cannot exceed 80 characters']
    },
    type: {
        type: String,
        enum: ['home', 'work', 'other'],
        default: 'home'
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { _id: true, timestamps: false });

const userSchema = new mongoose.Schema({
    name : {
        type: String,
        required: [true, 'Please enter name']
    },
    email:{
        type: String,
        unique: true,
        sparse: true,
        validate: [validator.isEmail, 'Please enter valid email address']
    },
    mobile: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v) {
                return !v || /^[6-9]\d{9}$/.test(String(v).replace(/\D/g, ''));
            },
            message: 'Please enter a valid 10-digit mobile number'
        }
    },
    mobileVerifiedAt: {
        type: Date,
        default: null
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        minlength: [6, 'Password must be at least 6 characters'],
        maxlength: [64, 'Password cannot exceed 64 characters'],
        select: false
    },
    avatar: {
        type: String
    },
    // Saved delivery addresses (per-account address book used by the header
    // "Deliver to" bar and the checkout address selection).
    addresses: [addressSchema],
    role :{
        type: String,
        default: 'user'
    },
    wishlist: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        }
    ],
    walletBalance: {
        type: Number,
        default: 500,
        min: [0, 'Wallet balance cannot be negative']
    },
    // VijayCoins loyalty balance. 1 coin = ₹1 redeemable at checkout; earned
    // (5% of the order total) automatically when an order is delivered.
    vijayCoins: {
        type: Number,
        default: 0,
        min: [0, 'VijayCoins balance cannot be negative']
    },
    coinHistory: [
        {
            amount: {
                type: Number,
                required: true
            },
            type: {
                type: String,
                enum: ['earned', 'redeemed'],
                required: true
            },
            note: {
                type: String,
                trim: true
            },
            orderNumber: {
                type: String
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    resetPasswordToken: String,
    resetPasswordTokenExpire: Date,
    createdAt :{
        type: Date,
        default: Date.now
    }
})

// Faster lookups for the wishlist API (user id + product ref).
userSchema.index({ _id: 1 });
userSchema.index({ googleId: 1 });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || this.password.startsWith('$2')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.getJwtToken = function(){
   return jwt.sign({id: this.id, role: this.role}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    })
}

userSchema.methods.isValidPassword = async function(enteredPassword){
    return  bcrypt.compare(enteredPassword, this.password)
}

userSchema.methods.comparePassword = async function(candidatePassword){
    return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.getResetToken = function(){
    //Generate Token
    const token = crypto.randomBytes(20).toString('hex');

    //Generate Hash and set to resetPasswordToken
   this.resetPasswordToken =  crypto.createHash('sha256').update(token).digest('hex');

   //Set token expire time
    this.resetPasswordTokenExpire = Date.now() + 30 * 60 * 1000;

    return token
}
let model =  mongoose.model('User', userSchema);


module.exports = model;