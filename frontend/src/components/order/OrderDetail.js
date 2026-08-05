import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Loader from '../layouts/Loader';
import { orderDetail as orderDetailAction, cancelOrder, requestReturn } from '../../actions/orderActions';
import { addCartItem } from '../../actions/cartActions';
import { toast } from 'react-toastify';
import { formatMoney, getDeliveryLabel } from '../../utils/productHelper';
import { openInvoice } from '../../utils/invoice';

const statusMeta = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('cancel')) return { label: status, cls: 'cancelled', icon: 'fa-times-circle' };
    if (s.includes('delivered')) return { label: status, cls: 'delivered', icon: 'fa-check-circle' };
    if (s.includes('out for delivery')) return { label: status, cls: 'shipped', icon: 'fa-truck' };
    if (s.includes('ship')) return { label: status, cls: 'shipped', icon: 'fa-truck' };
    if (s.includes('pack')) return { label: status, cls: 'packed', icon: 'fa-box' };
    return { label: status || 'Processing', cls: 'processing', icon: 'fa-hourglass-half' };
};

const returnMeta = (status) => {
    const s = (status || '').toLowerCase();
    const isReplace = s.includes('replacement');
    const isReturn = s.includes('return');
    const rejected = s.includes('rejected');
    const completed = s.includes('completed');
    const cls = rejected ? 'rejected' : completed ? 'completed' : 'requested';
    if (isReplace) return { label: status, cls, icon: 'fa-arrows-rotate', sub: 'A replacement has been requested for this order.' };
    if (isReturn) return { label: status, cls, icon: 'fa-rotate-left', sub: 'A return has been requested for this order.' };
    return null;
};

const TRACK_STEPS = [
    { label: 'Order Placed', icon: 'fa-check' },
    { label: 'Packed', icon: 'fa-box' },
    { label: 'Shipped', icon: 'fa-truck' },
    { label: 'Out for Delivery', icon: 'fa-motorcycle' },
    { label: 'Delivered', icon: 'fa-check-circle' },
];

function OrderTracking({ status }) {
    const s = (status || '').toLowerCase();
    let current = 0;
    if (s.includes('pack')) current = 1;
    else if (s.includes('ship')) current = s.includes('out for delivery') ? 3 : 2;
    else if (s.includes('deliver')) current = 5;

    return (
        <div className="od-track">
            <div className="od-track-fill" style={{ width: `${(Math.min(current, 4) / (TRACK_STEPS.length - 1)) * 100}%` }}></div>
            {TRACK_STEPS.map((step, i) => (
                <div key={step.label} className={`od-track-step ${i < current ? 'done' : ''} ${i === current ? 'active' : ''}`}>
                    <span className="od-track-dot"><i className={`fa ${i < current ? 'fa-check' : step.icon}`} aria-hidden="true"></i></span>
                    <span className="od-track-label">{step.label}</span>
                </div>
            ))}
        </div>
    );
}

const RETURN_REASONS = {
    return: ['Product is damaged', 'Item is defective', 'Received wrong item', 'Does not match description', 'Product quality not as expected', 'Change of mind'],
    replace: ['Item is defective', 'Received damaged item', 'Received wrong item', 'Product not working'],
};

export default function OrderDetail () {
    const { orderDetail, loading } = useSelector(state => state.orderState)
    const { shippingInfo = {}, user = {}, orderStatus = 'Processing', orderItems = [], totalPrice = 0, itemsPrice = 0, shippingPrice = 0, taxPrice = 0, discountPrice = 0, couponCode = '', paymentMethod = '', paymentInfo = {}, returnStatus = 'None', returnReason = '', codStatus = 'Pending' } = orderDetail;
    const isPaid = paymentInfo && paymentInfo.status === "succeeded";
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const [showReturn, setShowReturn] = useState(false);
    const [returnType, setReturnType] = useState('return');
    const [returnReasonVal, setReturnReasonVal] = useState('');
    const [returnLoading, setReturnLoading] = useState(false);

    useEffect(() => {
        dispatch(orderDetailAction(id))
    }, [id, dispatch])

    const canCancel = ['process', 'pack'].some(k => (orderStatus || '').toLowerCase().includes(k));
    const isDelivered = (orderStatus || '').toLowerCase().includes('deliver');
    const ret = returnMeta(returnStatus);
    const canRequestReturn = isDelivered && (!ret || String(returnStatus).toLowerCase().includes('rejected'));

    const handleCancel = async () => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        const res = await dispatch(cancelOrder(id));
        if (res && res.success) {
            toast.success('Order cancelled successfully');
            dispatch(orderDetailAction(id));
        } else {
            toast.error(res?.error || 'Could not cancel order. Please try again.');
        }
    };

    const handleReturn = async () => {
        if (!returnReasonVal) {
            toast.warn('Please select a reason');
            return;
        }
        setReturnLoading(true);
        const res = await dispatch(requestReturn(id, { type: returnType, reason: returnReasonVal }));
        setReturnLoading(false);
        if (res && res.success) {
            toast.success(returnType === 'return' ? 'Return request submitted' : 'Replacement request submitted');
            setShowReturn(false);
            setReturnReasonVal('');
            dispatch(orderDetailAction(id));
        } else {
            toast.error(res?.error || 'Could not submit request. Please try again.');
        }
    };

    const buyAgain = async () => {
        try {
            await Promise.all(orderItems.map(item => dispatch(addCartItem(item.product, item.quantity))));
            toast.success('Items added to your cart');
            navigate('/cart');
        } catch {
            toast.error('Could not add items to cart');
        }
    };

    const meta = statusMeta(orderStatus);
    const isCancelled = meta.cls === 'cancelled';

    return (
        <Fragment>
            {loading ? <Loader /> : !orderDetail._id ? (
                <div className="empty-state">
                    <div className="empty-icon"><i className="fa fa-exclamation-triangle" aria-hidden="true"></i></div>
                    <h2 className="empty-title">Order not found</h2>
                    <Link to="/orders" className="empty-cta"><i className="fa fa-arrow-left mr-2" aria-hidden="true"></i>Back to My Orders</Link>
                </div>
            ) : (
                <div className="od-page">
                    <div className="od-head">
                        <div>
                            <h1 className="cart-title">Order # {orderDetail._id}</h1>
                            <p className="addr-sub">Placed on {new Date(orderDetail.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <span className={`mo-status ${meta.cls}`}><i className={`fa mr-1 ${meta.icon}`} aria-hidden="true"></i>{meta.label}</span>
                    </div>

                    {isCancelled ? (
                        <div className="od-cancelled">
                            <i className="fa fa-times-circle" aria-hidden="true"></i>
                            <div>
                                <b>This order has been cancelled.</b>
                                <p>The items were removed from your order. You can re-order them anytime with Buy Again.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="co-card">
                            <div className="co-card-head"><div><i className="fa fa-truck mr-2" aria-hidden="true"></i>Tracking</div></div>
                            <OrderTracking status={orderStatus} />
                            <div className="od-estimate">
                                <i className="fa fa-clock-o mr-1" aria-hidden="true"></i>Estimated delivery by <b>{getDeliveryLabel(orderDetail._id || shippingInfo.postalCode)}</b>
                                {isDelivered && <span className="od-estimate-delivered"><i className="fa fa-check-circle mr-1" aria-hidden="true"></i>Delivered</span>}
                            </div>
                        </div>
                    )}

                    {ret && (
                        <div className={`od-return od-return--${ret.cls}`}>
                            <i className={`fa ${ret.icon}`} aria-hidden="true"></i>
                            <div>
                                <b>{ret.label}</b>
                                <p>{ret.sub}{returnReason ? ` Reason: ${returnReason}` : ''}</p>
                            </div>
                        </div>
                    )}

                    <div className="row">
                        <div className="col-12 col-lg-8">
                            <div className="co-card">
                                <div className="co-card-head"><div><i className="fa fa-location-dot mr-2" aria-hidden="true"></i>Delivery Address</div></div>
                                <div className="co-address-name">{shippingInfo.name || user.name || ''}</div>
                                <p className="co-address-line">{shippingInfo.address}{shippingInfo.landmark ? `, ${shippingInfo.landmark}` : ''}{shippingInfo.locality ? `, ${shippingInfo.locality}` : ''}, {shippingInfo.city}{shippingInfo.state ? `, ${shippingInfo.state}` : ''} {shippingInfo.postalCode}</p>
                                <div className="addr-meta"><i className="fa fa-phone" aria-hidden="true"></i>{shippingInfo.phoneNo} &middot; {shippingInfo.country}</div>
                                {shippingInfo.instructions && <div className="addr-meta addr-inst"><i className="fa fa-note-sticky mr-1" aria-hidden="true"></i>{shippingInfo.instructions}</div>}
                            </div>

                            <div className="co-card">
                                    <div className="co-card-head">
                                        <div><i className="fa fa-shopping-bag mr-2" aria-hidden="true"></i>Items <span className="section-accent">({orderItems.reduce((a, it) => a + it.quantity, 0)})</span></div>
                                        <span className={`co-pay-state ${isPaid ? 'paid' : paymentMethod === 'cod' ? 'cod' : 'unpaid'}`}>
                                            <i className={`fa mr-1 ${isPaid ? 'fa-check-circle' : paymentMethod === 'cod' ? 'fa-hand-holding-dollar' : 'fa-clock-o'}`} aria-hidden="true"></i>{isPaid ? 'Paid' : paymentMethod === 'cod' ? 'Pay on Delivery' : 'Not Paid'}
                                        </span>
                                    </div>
                                {orderItems.map((item, idx) => (
                                    <div className="co-item" key={item.product || item._id} style={{ animationDelay: `${idx * 0.06}s` }}>
                                        <Link to={`/product/${item.product}`} className="co-item-img">
                                            <img src={item.image} alt={item.name} loading="lazy" />
                                        </Link>
                                        <div className="co-item-body">
                                            <Link to={`/product/${item.product}`} className="co-item-name">{item.name}</Link>
                                            <div className="co-item-meta">
                                                <span className="co-item-qty">Qty: {item.quantity}</span>
                                                <span className="co-item-price">{formatMoney(item.price)}</span>
                                            </div>
                                        </div>
                                        <div className="co-item-total">{formatMoney(item.price * item.quantity)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="col-12 col-lg-4 my-4 my-lg-0">
                            <div className="cart-summary co-summary">
                                <div className="cart-summary-head">Price Details</div>
                                <div className="summary-row">
                                    <span>Subtotal</span>
                                    <b>{formatMoney(itemsPrice)}</b>
                                </div>
                                <div className="summary-row">
                                    <span>Delivery Charges</span>
                                    <b>{Number(shippingPrice) === 0 ? <span className="free-shipping-note">FREE</span> : formatMoney(shippingPrice)}</b>
                                </div>
                                <div className="summary-row">
                                    <span>Tax</span>
                                    <b>{formatMoney(taxPrice)}</b>
                                </div>
                                {Number(discountPrice) > 0 && (
                                    <div className="summary-row summary-coupon-row">
                                        <span><i className="fa fa-tag mr-1" aria-hidden="true"></i>Coupon {couponCode ? `(${couponCode})` : 'Discount'}</span>
                                        <b className="text-coupon">&minus;{formatMoney(discountPrice)}</b>
                                    </div>
                                )}
                                <div className="summary-row summary-total">
                                    <span>Total Amount</span>
                                    <b>{formatMoney(totalPrice)}</b>
                                </div>
                                <div className="od-pay-method">
                                    <i className="fa fa-money-bill-wave mr-1" aria-hidden="true"></i>
                                    <span>
                                        {paymentMethod === 'cod'
                                            ? (isDelivered
                                                ? `Cash on Delivery · ${codStatus === 'Collected' ? 'Cash Collected' : 'Cash Pending'}`
                                                : 'Cash on Delivery')
                                            : isPaid ? `Paid via ${paymentMethod || 'card'}` : 'Payment pending'}
                                    </span>
                                </div>
                                {canCancel && (
                                    <button type="button" className="mo-btn danger w-100 justify-content-center" onClick={handleCancel}>
                                        <i className="fa fa-times mr-1" aria-hidden="true"></i>Cancel Order
                                    </button>
                                )}
                                {canRequestReturn && (
                                    <div className="od-return-actions">
                                        <button type="button" className="mo-btn w-100 justify-content-center" onClick={() => { setReturnType('return'); setShowReturn(true); }}>
                                            <i className="fa fa-rotate-left mr-1" aria-hidden="true"></i>Return Order
                                        </button>
                                        <button type="button" className="mo-btn w-100 justify-content-center" onClick={() => { setReturnType('replace'); setShowReturn(true); }}>
                                            <i className="fa fa-arrows-rotate mr-1" aria-hidden="true"></i>Replace Order
                                        </button>
                                    </div>
                                )}
                                {!isCancelled && (
                                    <button type="button" className="mo-btn w-100 justify-content-center" onClick={() => openInvoice(orderDetail)}>
                                        <i className="fa fa-file-invoice mr-1" aria-hidden="true"></i>Download Invoice
                                    </button>
                                )}
                                {!isCancelled && (
                                    <button type="button" className="checkout-btn w-100" style={{ marginTop: '0.7rem' }} onClick={buyAgain}>
                                        <i className="fa fa-cart-plus mr-2" aria-hidden="true"></i>Buy Again
                                    </button>
                                )}
                                <Link to="/orders" className="addr-continue"><i className="fa fa-arrow-left mr-1" aria-hidden="true"></i>Back to My Orders</Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showReturn && (
                <div className="rr-overlay" onClick={e => { if (e.target === e.currentTarget) setShowReturn(false); }}>
                    <div className="rr-modal">
                        <div className="rr-head">
                            <h3>{returnType === 'return' ? 'Return Order' : 'Replace Order'}</h3>
                            <button type="button" className="addr-form-close" onClick={() => setShowReturn(false)} aria-label="Close">
                                <i className="fa fa-times" aria-hidden="true"></i>
                            </button>
                        </div>
                        <p className="rr-sub">{returnType === 'return' ? 'Let us know why you are returning this order. We will arrange a pickup and refund after verification.' : 'Let us know why you want this order replaced. A fresh item will be shipped to the same address.'}</p>
                        <div className="rr-types">
                            <button type="button" className={`rr-type ${returnType === 'return' ? 'active' : ''}`} onClick={() => setReturnType('return')}>
                                <i className="fa fa-rotate-left" aria-hidden="true"></i>Return
                            </button>
                            <button type="button" className={`rr-type ${returnType === 'replace' ? 'active' : ''}`} onClick={() => setReturnType('replace')}>
                                <i className="fa fa-arrows-rotate" aria-hidden="true"></i>Replace
                            </button>
                        </div>
                        <div className="form-group">
                            <label htmlFor="rr_reason">Reason</label>
                            <select id="rr_reason" className="form-control" value={returnReasonVal} onChange={e => setReturnReasonVal(e.target.value)} style={{ background: '#fff', color: '#212121' }}>
                                <option value="" style={{ background: '#fff', color: '#212121' }}>Select a reason</option>
                                {(RETURN_REASONS[returnType] || []).map(r => (
                                    <option key={r} value={r} style={{ background: '#fff', color: '#212121' }}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <div className="rr-actions">
                            <button type="button" className="addr-form-cancel" onClick={() => setShowReturn(false)}>Cancel</button>
                            <button type="button" className="checkout-btn" disabled={returnLoading} onClick={handleReturn}>
                                {returnLoading ? <><i className="fa fa-spinner fa-spin mr-1" aria-hidden="true"></i>Submitting...</> : <><i className="fa fa-paper-plane mr-1" aria-hidden="true"></i>Submit Request</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Fragment>
    )
}
