const User = require('../models/userModel');
const Setting = require('../models/settingModel');
const sendSms = require('./sms');

//Builds the customer-facing SMS text for a given order event. Event → message
//mapping is isolated here so wording can be tweaked without touching controllers.
const EVENT_LABEL = {
    placed: 'placed',
    confirmed: 'confirmed',
    packed: 'packed',
    shipped: 'shipped',
    out_for_delivery: 'out for delivery',
    delivered: 'delivered',
    cancelled: 'cancelled'
};

const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

const formatShortDate = (d) => {
    if (!d) return '';
    try {
        return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); // e.g. 12 Aug
    } catch {
        return '';
    }
};

const itemsSummary = (order, maxItems = 3) => {
    const items = (order.orderItems || []).slice(0, maxItems)
        .map(it => `${it.name} x${it.quantity}`);
    const total = (order.orderItems || []).length;
    if (total > maxItems) items.push(`+${total - maxItems} more`);
    return items.length ? items.join(', ') : '—';
};

const supportPhone = (settings) =>
    process.env.SUPPORT_PHONE || (settings && settings.supportPhone) || '+91 8220477466';

const orderLabel = (order) => order.orderNumber || `#${String(order._id || '').slice(-8).toUpperCase()}`;

function buildMessage(event, order, ctx = {}) {
    const customer = ctx.customer || {};
    const name = customer.name || (order.shippingInfo && order.shippingInfo.name) || 'Customer';
    const orderNo = orderLabel(order);
    const total = formatINR(order.totalPrice);
    const items = itemsSummary(order);
    const est = formatShortDate(order.deliveryDate || ctx.deliveryDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000));
    const support = supportPhone(ctx.settings);

    switch (event) {
        case 'placed':
            return `Thank you for shopping with VijayCart, ${name}.\n\n` +
                `Your Order ${orderNo} has been successfully placed.\n\n` +
                `Products: ${items}\n` +
                `Total ${total}.\n` +
                `Expected Delivery: ${est}.\n\n` +
                `Track anytime from My Orders. For support, call ${support}.`;

        case 'confirmed':
            return `Hi ${name}, your VijayCart order ${orderNo} has been Confirmed.\n\n` +
                `Products: ${items}\n` +
                `Total ${total}.\n` +
                `Expected Delivery: ${est}.\n\n` +
                `Track anytime from My Orders. Support: ${support}`;

        case 'packed':
            return `Hi ${name}, your VijayCart order ${orderNo} is Packed and ready to dispatch.\n\n` +
                `Products: ${items}\n` +
                `Total ${total}.\n\n` +
                `Track anytime from My Orders. Support: ${support}`;

        case 'shipped':
            return `Hi ${name}, your VijayCart order ${orderNo} has been Shipped!\n\n` +
                `Expected Delivery: ${est}.\n` +
                `Track anytime from My Orders. Support: ${support}`;

        case 'out_for_delivery':
            return `Hi ${name}, your VijayCart order ${orderNo} is Out for Delivery today.\n\n` +
                `Please keep your phone handy. Track anytime from My Orders. Support: ${support}`;

        case 'delivered':
            return `Hi ${name}, your VijayCart order ${orderNo} has been Delivered.\n\n` +
                `Thank you for shopping with us! Share your feedback from My Orders. Support: ${support}`;

        case 'cancelled':
            return `Hi ${name}, your VijayCart order ${orderNo} has been Cancelled.\n\n` +
                `Refunds, if any, will be processed to your original payment method. Support: ${support}`;

        default:
            return null;
    }
}

//Sends the SMS for an order event. Never throws — the caller can fire it and
//forget, or await it. Loads the customer + store settings lazily when not
//provided so admin/delivery flows (which act as another user) still work.
async function notifyOrderEvent(event, order, opts = {}) {
    try {
        if (!order || !EVENT_LABEL[event]) {
            return { success: false, reason: `unknown-event:${event}` };
        }
        const customer = opts.customer || await User.findById(order.user);
        const settings = opts.settings || await Setting.findOne({ key: 'global' }) || {};

        const phone = (customer && customer.mobile) || (order.shippingInfo && order.shippingInfo.phoneNo);
        if (!phone) {
            console.error(`[SMS] No customer phone for order ${order._id}, ${event} SMS skipped.`);
            return { success: false, reason: 'no-phone' };
        }

        const message = buildMessage(event, order, { customer, settings });
        if (!message) {
            return { success: false, reason: `no-message-for-event:${event}` };
        }

        const result = await sendSms({ to: phone, message });
        if (!result.success && result.reason !== 'no-phone') {
            console.error(`[SMS] ${event} notification failed for order ${order._id}:`, result);
        }
        return result;
    } catch (error) {
        console.error(`[SMS] ${event} notification errored for order ${order._id}:`, error.message);
        return { success: false, reason: 'exception', error: error.message };
    }
}

module.exports = { notifyOrderEvent, buildMessage, EVENT_LABEL };
