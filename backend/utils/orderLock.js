//Orders cancelled by the customer are immutable. The admin panel and the
//delivery dashboard may only VIEW them — every mutation endpoint must reject
//them before it touches the document.
const LOCKED_STATUS = 'Cancelled by Customer';
const LOCKED_MESSAGE = 'This order has been cancelled by the customer and cannot be modified';

function isLocked(order) {
    return !!(order && String(order.orderStatus || '') === LOCKED_STATUS);
}

module.exports = { LOCKED_STATUS, LOCKED_MESSAGE, isLocked };
