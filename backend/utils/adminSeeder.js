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
        admin.username = 'vijayadmin';
        admin.role = 'admin';
        // Plain text here is fine — the pre('save') hook hashes it with bcrypt
        // before the document is written (the hook also skips already-hashed
        // "$2..." values on re-seeds).
        admin.password = 'vijay@2006';
        // save() (not updateOne) so the pre('save') hook keeps the record intact.
        await admin.save();
        console.log('Admin seeded! (username: vijayadmin, email: admin@vijaycart.com)');
    }catch(error){
        console.log(error.message);
    }
    process.exit();
}

seedAdmin();
