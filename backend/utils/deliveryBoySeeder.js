const User = require('../models/userModel');
const dotenv = require('dotenv');
const connectDatabase = require('../config/database')

dotenv.config({path:'backend/config/config.env'});
connectDatabase();

const seedDeliveryBoys = async ()=>{
    try{
        let deliveryBoy = await User.findOne({ email: 'deliveryboy@vijaycart.com' });
        if (!deliveryBoy) {
            deliveryBoy = new User({ email: 'deliveryboy@vijaycart.com' });
        }
        deliveryBoy.name = 'Delivery Boy';
        deliveryBoy.password = '123456';
        deliveryBoy.role = 'deliveryboy';
        // save() (not updateOne) so the pre('save') hook hashes the password.
        await deliveryBoy.save();
        console.log('Delivery boy seeded! (deliveryboy@vijaycart.com / 123456)');
    }catch(error){
        console.log(error.message);
    }
    process.exit();
}

seedDeliveryBoys();
