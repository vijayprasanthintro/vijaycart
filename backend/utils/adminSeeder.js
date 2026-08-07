const User = require('../models/userModel');
const dotenv = require('dotenv');
const connectDatabase = require('../config/database')

dotenv.config({path:'backend/config/config.env'});
connectDatabase();

const seedAdmin = async ()=>{
    try{
        let admin = await User.findOne({ email: 'admin@vijaycart.com' });
        if (!admin) {
            admin = new User({ email: 'admin@vijaycart.com' });
        }
        admin.name = 'VijayCart Admin';
        admin.mobile = '9999900000';
        admin.role = 'admin';
        // save() (not updateOne) so the pre('save') hook keeps the record intact.
        await admin.save();
        console.log('Admin seeded! (admin@vijaycart.com / 9999900000)');
    }catch(error){
        console.log(error.message);
    }
    process.exit();
}

seedAdmin();
