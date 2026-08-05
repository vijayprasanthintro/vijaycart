const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDatabase = () => {
    mongoose.set('strictQuery', true);
    mongoose.connect(process.env.DB_LOCAL_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(con => {
        console.log(`MongoDB is connected to the host: ${con.connection.host}`)
    })
    .catch(err => {
        console.log(`Error: ${err.message}`)
        process.exit(1)
    })
}

module.exports = connectDatabase;