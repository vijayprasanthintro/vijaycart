const User = require('../models/userModel');
const DeliveryPerson = require('../models/deliveryPersonModel');
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
        deliveryBoy.mobile = '8888800000';
        deliveryBoy.role = 'deliveryboy';
        // save() (not updateOne) so the pre('save') hook keeps the record intact.
        await deliveryBoy.save();

        let person = await DeliveryPerson.findOne({ user: deliveryBoy._id });
        if (!person) {
            person = await DeliveryPerson.create({
                user: deliveryBoy._id,
                name: deliveryBoy.name,
                email: deliveryBoy.email,
                phone: deliveryBoy.mobile
            });
        }
        console.log('Delivery boy seeded! (deliveryboy@vijaycart.com / 8888800000)');
    }catch(error){
        console.log(error.message);
    }
    process.exit();
}

seedDeliveryBoys();
