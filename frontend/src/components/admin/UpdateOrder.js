import { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from "react-router-dom";
import { orderDetail as orderDetailAction, updateOrder } from "../../actions/orderActions";
import { toast } from "react-toastify";
import { clearOrderUpdated, clearError } from "../../slices/orderSlice";
import { getDeliveryBoys } from "../../actions/deliveryActions";
import { Link } from "react-router-dom";
import { toINR } from './Charts';
import { resolveProductImage, imgOnError } from '../../utils/productHelper';
import { ORDER_STATUSES, statusBadge } from '../../utils/orderStatuses';

export default function UpdateOrder() {
    const { loading, isOrderUpdated, error, orderDetail } = useSelector(state => state.orderState);
    const { deliveryBoys = [] } = useSelector(state => state.deliveryState);
    const { user = {}, orderItems = [], shippingInfo = {}, totalPrice = 0, paymentInfo = {}, returnStatus = 'None', returnReason = '', paymentMethod = '', codStatus = 'Pending' } = orderDetail;
    const isPaid = paymentInfo.status === 'succeeded';
    const [orderStatus, setOrderStatus] = useState("Pending");
    const { id: orderId } = useParams();
    const dispatch = useDispatch();

    const submitHandler = (e) => {
        e.preventDefault();
        dispatch(updateOrder(orderId, { orderStatus }));
    }

    useEffect(() => {
        if (isOrderUpdated) {
            toast('Order updated successfully!', { type: 'success', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearOrderUpdated()) });
            return;
        }
        if (error) {
            toast(error, { type: 'error', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearError()) });
            return;
        }
        dispatch(orderDetailAction(orderId));
    }, [isOrderUpdated, error, dispatch, orderId]);

    useEffect(() => {
        dispatch(getDeliveryBoys());
    }, [dispatch]);

    useEffect(() => {
        if (orderDetail._id) setOrderStatus(orderDetail.orderStatus);
    }, [orderDetail]);

    const boy = deliveryBoys.find(b => String(b._id) === String(orderDetail.deliveryBoy));

    const currentIndex = ORDER_STATUSES.indexOf(orderDetail.orderStatus);
    const isCancelled = orderDetail.orderStatus === 'Cancelled';
    const historyTimes = {};
    (orderDetail.statusHistory || []).forEach(h => {
        if (h.status) historyTimes[h.status] = h.changedAt;
    });
    const fmtTime = t => t ? new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : null;

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Manage Order</h1>
                    <p>Order <span className="ad-td-mono">#{orderDetail._id}</span></p>
                </div>
                <Link to="/admin/orders" className="ad-btn ad-btn--ghost"><i className="fa fa-arrow-left" aria-hidden="true"></i> Back to Orders</Link>
            </div>

            <div className="ad-split">
                <div className="ad-card">
                    <div className="ad-card__head"><h3 className="ad-card__title"><i className="fa fa-truck" aria-hidden="true"></i> Shipping Info</h3></div>
                    <div className="ad-card__body">
                        <div className="ad-form" style={{ gap: '0.6rem' }}>
                            <div className="ad-list-item" style={{ padding: '0.45rem 0' }}><span className="ad-label" style={{ width: 80 }}>Name</span><span className="ad-td-strong">{user.name}</span></div>
                            <div className="ad-list-item" style={{ padding: '0.45rem 0' }}><span className="ad-label" style={{ width: 80 }}>Phone</span><span>{shippingInfo.phoneNo}</span></div>
                            <div className="ad-list-item" style={{ padding: '0.45rem 0' }}><span className="ad-label" style={{ width: 80 }}>Address</span><span>{shippingInfo.address}, {shippingInfo.locality ? shippingInfo.locality + ', ' : ''}{shippingInfo.city}, {shippingInfo.postalCode}, {shippingInfo.state}, {shippingInfo.country}</span></div>
                            <div className="ad-list-item" style={{ padding: '0.45rem 0' }}><span className="ad-label" style={{ width: 80 }}>Amount</span><span className="ad-td-strong" style={{ color: 'var(--ad-primary)' }}>{toINR(totalPrice)}</span></div>
                            <div className="ad-list-item" style={{ padding: '0.45rem 0' }}><span className="ad-label" style={{ width: 80 }}>Payment</span>
                                {paymentMethod === 'cod' ? (
                                    <span className={`ad-badge ${codStatus === 'Collected' ? 'ad-badge--success' : 'ad-badge--warning'}`}>
                                        COD · {codStatus === 'Collected' ? 'CASH COLLECTED' : 'CASH PENDING'}
                                    </span>
                                ) : (
                                    <span className={`ad-badge ${isPaid ? 'ad-badge--success' : 'ad-badge--danger'}`}>{isPaid ? 'PAID' : 'NOT PAID'}</span>
                                )}
                            </div>
                            {boy && (
                                <div className="ad-list-item" style={{ padding: '0.45rem 0' }}><span className="ad-label" style={{ width: 80 }}>Delivery Boy</span><span className="ad-chip"><i className="fa fa-motorcycle" aria-hidden="true"></i>{boy.name}</span></div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="ad-card">
                    <div className="ad-card__head"><h3 className="ad-card__title"><i className="fa fa-cog" aria-hidden="true"></i> Update Status</h3></div>
                    <div className="ad-card__body">
                        <div className="ad-field">
                            <label className="ad-label">Order Status</label>
                            <select className="ad-select" value={orderStatus} onChange={e => setOrderStatus(e.target.value)}>
                                {ORDER_STATUSES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <button className="ad-btn ad-btn--primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading} onClick={submitHandler}>
                            {loading && <i className="fa fa-spinner fa-spin" aria-hidden="true"></i>} Update Status
                        </button>
                    </div>
                </div>
            </div>

            <div className="ad-card">
                <div className="ad-card__head"><h3 className="ad-card__title"><i className="fa fa-history" aria-hidden="true"></i> Order Timeline</h3></div>
                <div className="ad-card__body">
                    <div className="ad-timeline">
                        {ORDER_STATUSES.map((s, i) => {
                            const reached = isCancelled ? false : i <= currentIndex;
                            const isCurrent = !isCancelled && i === currentIndex;
                            const danger = isCancelled && s === 'Cancelled';
                            const done = reached && !isCurrent;
                            const time = historyTimes[s] ? fmtTime(historyTimes[s]) : null;
                            const icon = s === 'Delivered' ? 'fa-check' : s === 'Cancelled' ? 'fa-times' : s === 'Out for Delivery' ? 'fa-truck' : s === 'Packed' ? 'fa-box' : s === 'Shipped' ? 'fa-paper-plane-o' : s === 'Confirmed' ? 'fa-check-circle-o' : 'fa-hourglass-half';
                            return (
                                <div className={`ad-timeline__item ${done ? 'ad-timeline__item--done' : ''} ${isCurrent ? 'ad-timeline__item--current' : ''} ${danger ? 'ad-timeline__item--danger' : ''}`} key={s}>
                                    <div className="ad-timeline__rail">
                                        <span className="ad-timeline__node"><i className={`fa ${icon}`} aria-hidden="true"></i></span>
                                        {i < ORDER_STATUSES.length - 1 && <span className="ad-timeline__line"></span>}
                                    </div>
                                    <div className="ad-timeline__content">
                                        <span className={`ad-badge ${danger ? 'ad-badge--danger' : statusBadge(s)}`}>{s}</span>
                                        {time && <span className="ad-muted ad-timeline__time">{time}</span>}
                                        {isCurrent && <span className="ad-timeline__tag">Current</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="ad-card">
                <div className="ad-card__head"><h3 className="ad-card__title"><i className="fa fa-shopping-bag" aria-hidden="true"></i> Order Items</h3></div>
                <div className="ad-card__body ad-card__body--flush">
                    <div className="ad-table-wrap">
                        <table className="ad-table">
                            <thead>
                                <tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th></tr>
                            </thead>
                            <tbody>
                                {orderItems && orderItems.map(item => (
                                    <tr key={item._id}>
                                        <td>
                                            <div className="ad-toolbar" style={{ justifyContent: 'flex-start' }}>
                                                {item.image && <img src={resolveProductImage(item.image)} alt={item.name} className="ad-avatar" style={{ width: 42, height: 42 }} onError={imgOnError} />}
                                                <Link to={`/product/${item.product}`} className="ad-td-strong">{item.name}</Link>
                                            </div>
                                        </td>
                                        <td>{toINR(item.price)}</td>
                                        <td>{item.quantity}</td>
                                        <td><span className="ad-td-strong">{toINR(item.price * item.quantity)}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {returnStatus && returnStatus !== 'None' && (
                <div className="ad-card">
                    <div className="ad-card__head"><h3 className="ad-card__title"><i className="fa fa-undo" aria-hidden="true"></i> Return / Replacement</h3></div>
                    <div className="ad-card__body">
                        <span className={`ad-badge ${returnStatus.toLowerCase().includes('rejected') ? 'ad-badge--danger' : returnStatus.toLowerCase().includes('completed') ? 'ad-badge--success' : 'ad-badge--warning'}`}>{returnStatus}</span>
                        {returnReason && <p style={{ margin: '0.6rem 0 0', color: 'var(--ad-text-2)', fontSize: '0.85rem' }}>{returnReason}</p>}
                    </div>
                </div>
            )}
        </Fragment>
    );
}
