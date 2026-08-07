const app = require('./app');
const path = require('path');
const connectDatabase = require('./config/database');
const Order = require('./models/orderModel');
const logger = require('./utils/logger');
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
        logger.info(`Migrated ${result.modifiedCount} order(s): Processing -> Pending`);
    }
}
migrateOrderStatuses().catch(err => {
    logger.warn(`Migration warning: ${err.message}`);
});

// Railway injects the runtime port through process.env.PORT; fall back to the
// local config value (config.env PORT=8000) so local development needs no extra
// setup. Listening on 0.0.0.0 makes the port reachable from outside the
// container (required by Railway) while http://localhost:8000 keeps working
// locally.
const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, '0.0.0.0', ()=>{
    logger.info(`Server listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    logger.info(`Local: http://localhost:${PORT}`);
})

process.on('unhandledRejection',(err)=>{
    logger.fatal(`Unhandled rejection, shutting down the server: ${err.message}`, { stack: err.stack });
    server.close(()=>{
        process.exit(1);
    })
})

process.on('uncaughtException',(err)=>{
    logger.fatal(`Uncaught exception, shutting down the server: ${err.message}`, { stack: err.stack });
    server.close(()=>{
        process.exit(1);
    })
})



