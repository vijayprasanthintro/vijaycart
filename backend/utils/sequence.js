const Counter = require('../models/counterModel');

//Atomically increments a named counter and returns the new value. Safe against
//concurrent order creation because findOneAndUpdate upsert is atomic.
async function getNextSequence(name) {
    const doc = await Counter.findOneAndUpdate(
        { name },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return doc.seq;
}

//Human-readable order number, e.g. VC10001. The offset keeps numbers 5+ digits
//so the example format (#VC10231) is matched.
async function nextOrderNumber() {
    const seq = await getNextSequence('orderNumber');
    return `VC${10000 + seq}`;
}

module.exports = { getNextSequence, nextOrderNumber };
