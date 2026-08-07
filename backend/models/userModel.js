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
    walletBalance: {
        type: Number,
        default: 500,
        min: [0, 'Wallet balance cannot be negative']
    },
    resetPasswordToken: String,
    resetPasswordTokenExpire: Date,
    createdAt :{
        type: Date,
        default: Date.now
    }
})

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