const app = require('./app');
const path = require('path');
const connectDatabase = require('./config/database');
const Order = require('./models/orderModel');

connectDatabase();

//One-time data migration: older orders used 'Processing' as the initial
//status. The new vocabulary starts orders at 'Pending'. Runs after the
//mongoose connection is established (buffered automatically).
async function migrateOrderStatuses() {
    const result = await Order.updateMany(
        { orderStatus: 'Processing' },
        { $set: { orderStatus: 'Pending' } }
    );
    if (result && result.modifiedCount) {
        console.log(`Migrated ${result.modifiedCount} order(s): Processing -> Pending`);
    }
}
migrateOrderStatuses().catch(err => {
    console.log(`Migration warning: ${err.message}`);
});

// Railway injects the runtime port through process.env.PORT; fall back to the
// local config value (config.env PORT=8000) so local development needs no extra
// setup. Listening on 0.0.0.0 makes the port reachable from outside the
// container (required by Railway) while http://localhost:8000 keeps working
// locally.
const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, '0.0.0.0', ()=>{
    console.log(`My Server listening to the port: ${PORT} in ${process.env.NODE_ENV || 'development'}`)
    console.log(`Local: http://localhost:${PORT}`)
})

process.on('unhandledRejection',(err)=>{
    console.log(`Error: ${err.message}`);
    console.log('Shutting down the server due to unhandled rejection error');
    server.close(()=>{
        process.exit(1);
    })
})

process.on('uncaughtException',(err)=>{
    console.log(`Error: ${err.message}`);
    console.log('Shutting down the server due to uncaught exception error');
    server.close(()=>{
        process.exit(1);
    })
})



