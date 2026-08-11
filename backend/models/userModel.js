const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto')

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