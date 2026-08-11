const User = require('../models/userModel');

//Percentage of the order total credited back as VijayCoins on delivery.
const COIN_EARN_RATE = 0.05;

//Credit VijayCoins to a customer when their order is delivered. Idempotent:
//an order can only ever earn once (guarded by the order's coinsEarned field).
//Returns the coins credited (0 if already credited).
async function creditOrderCoins(order) {
    if (!order || !order.user) return 0;
    if (order.coinsEarned && Number(order.coinsEarned) > 0) return 0;

    const earned = Math.round(Number(order.totalPrice || 0) * COIN_EARN_RATE);
    if (earned <= 0) return 0;

    const user = await User.findById(order.user);
    if (!user) return 0;

    user.vijayCoins = Math.round((Number(user.vijayCoins || 0) + earned) * 100) / 100;
    user.coinHistory = user.coinHistory || [];
    user.coinHistory.push({
        amount: earned,
        type: 'earned',
        note: `Coins earned on order ${order.orderNumber || order._id}`,
        orderNumber: order.orderNumber || String(order._id)
    });
    await user.save({ validateBeforeSave: false });

    order.coinsEarned = earned;
    await order.save({ validateBeforeSave: false });

    return earned;
}

module.exports = { creditOrderCoins, COIN_EARN_RATE };
