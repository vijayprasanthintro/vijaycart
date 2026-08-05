import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import MetaData from '../layouts/MetaData';
import Loader from '../layouts/Loader';
import { clearAuthError, logout } from '../../actions/userActions';
import {
    getAssignedOrders,
    getDeliveryHistory,
    getTodayOrders,
    updateDeliveryStatus
} from '../../actions/deliveryActions';
import { clearUpdateDelivery } from '../../slices/deliverySlice';

const STATUS_BADGES = {
    'Processing': 'badge-warning',
    'Packed': 'badge-info',
    'Out for Delivery': 'badge-primary',
    'Delivered': 'badge-success',
    'Cancelled': 'badge-danger'
};

function buildAddress(order) {
    const s = order.shippingInfo || {};
    return [s.address, s.locality, s.district, s.city, s.state, s.postalCode, s.country]
        .filter(Boolean).join(', ');
}

function mapLink(order) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(buildAddress(order))}`;
}

function callLink(order) {
    const phone = (order.shippingInfo?.phoneNo || '').replace(/[^0-9+]/g, '');
    return phone ? `tel:${phone}` : '#';
}

function expectedDate(order) {
    if (!order.deliveryDate) return '—';
    return new Date(order.deliveryDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function DeliveryDashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.authState);
    const { assignedOrders, todayOrders, historyOrders, loading } = useSelector(state => state.deliveryState);

    const [tab, setTab] = useState('today');
    const [otpOrder, setOtpOrder] = useState(null);
    const [otpValue, setOtpValue] = useState('');
    const [otpError, setOtpError] = useState('');
    const [collectCash, setCollectCash] = useState(true);
    const [actionId, setActionId] = useState(null);

    useEffect(() => {
        dispatch(getTodayOrders());
        dispatch(getAssignedOrders());
        dispatch(getDeliveryHistory());
    }, [dispatch]);

    const logoutHandler = () => {
        dispatch(logout());
        dispatch(clearAuthError());
        navigate('/delivery/login');
    };

    const markOutForDelivery = async (order) => {
        setActionId(order._id);
        const res = await dispatch(updateDeliveryStatus(order._id, { orderStatus: 'Out for Delivery' }));
        setActionId(null);
        if (res?.success) {
            toast('Order marked as Out for Delivery', { type: 'success' });
            refresh();
        } else if (res?.error) {
            toast(res.error, { type: 'error' });
        }
    };

    const refresh = () => {
        dispatch(getTodayOrders());
        dispatch(getAssignedOrders());
        dispatch(getDeliveryHistory());
    };

    const openOtpModal = (order) => {
        setOtpOrder(order);
        setOtpValue('');
        setOtpError('');
        setCollectCash(order.paymentMethod === 'cod' && order.codStatus !== 'Collected');
    };

    const closeOtpModal = () => {
        setOtpOrder(null);
        setOtpValue('');
        setOtpError('');
        setCollectCash(true);
    };

    const submitOtp = async () => {
        if (!/^\d{4}$/.test(otpValue.trim())) {
            setOtpError('Please enter the 4-digit OTP');
            return;
        }
        setOtpError('');
        setActionId(otpOrder._id);
        const payload = { orderStatus: 'Delivered', otp: otpValue.trim() };
        if (otpOrder.paymentMethod === 'cod') payload.codCollected = collectCash;
        const res = await dispatch(updateDeliveryStatus(otpOrder._id, payload));
        setActionId(null);
        if (res?.success) {
            toast('Order delivered successfully', { type: 'success' });
            closeOtpModal();
            refresh();
        } else if (res?.error) {
            setOtpError(res.error);
        }
    };

    const collectCodCash = async (order) => {
        setActionId(order._id);
        const res = await dispatch(updateDeliveryStatus(order._id, { codStatus: 'Collected' }));
        setActionId(null);
        if (res?.success) {
            toast('Cash marked as collected', { type: 'success' });
            refresh();
        } else if (res?.error) {
            toast(res.error, { type: 'error' });
        }
    };

    useEffect(() => {
        return () => dispatch(clearUpdateDelivery());
    }, [dispatch]);

    const orders = tab === 'today' ? todayOrders : tab === 'assigned' ? assignedOrders : historyOrders;

    return (
        <Fragment>
            <MetaData title={`Delivery Dashboard`} />
            <div className="de-dash">
                <div className="de-dash-head">
                    <div>
                        <h1 className="de-dash-title"><i className="fa fa-motorcycle" aria-hidden="true"></i> Delivery Dashboard</h1>
                        <p className="de-dash-sub">Welcome back, {user?.name?.split(' ')[0] || 'Partner'}!</p>
                    </div>
                    <div className="de-dash-actions">
                        <span className="de-role-badge"><i className="fa fa-user-circle mr-1" aria-hidden="true"></i>Delivery Boy</span>
                        <button type="button" className="de-logout-btn" onClick={logoutHandler}>
                            <i className="fa fa-sign-out mr-2" aria-hidden="true"></i>Logout
                        </button>
                    </div>
                </div>

                <div className="de-stat-row">
                    <div className="de-stat de-stat--today">
                        <span className="de-stat-num">{todayOrders.filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled').length}</span>
                        <span className="de-stat-label">Due Today</span>
                    </div>
                    <div className="de-stat">
                        <span className="de-stat-num">{assignedOrders.length}</span>
                        <span className="de-stat-label">Assigned</span>
                    </div>
                    <div className="de-stat">
                        <span className="de-stat-num">{assignedOrders.filter(o => o.orderStatus === 'Out for Delivery').length}</span>
                        <span className="de-stat-label">Out for Delivery</span>
                    </div>
                    <div className="de-stat">
                        <span className="de-stat-num">{historyOrders.filter(o => o.orderStatus === 'Delivered').length}</span>
                        <span className="de-stat-label">Delivered</span>
                    </div>
                </div>

                <div className="de-tabs">
                    <button type="button" className={`de-tab ${tab === 'today' ? 'de-tab--active' : ''}`} onClick={() => setTab('today')}>
                        <i className="fa fa-calendar-check-o mr-1" aria-hidden="true"></i> Today's Deliveries
                    </button>
                    <button type="button" className={`de-tab ${tab === 'assigned' ? 'de-tab--active' : ''}`} onClick={() => setTab('assigned')}>
                        <i className="fa fa-list-ul mr-1" aria-hidden="true"></i> Assigned Orders
                    </button>
                    <button type="button" className={`de-tab ${tab === 'history' ? 'de-tab--active' : ''}`} onClick={() => setTab('history')}>
                        <i className="fa fa-history mr-1" aria-hidden="true"></i> Delivery History
                    </button>
                </div>

                {loading ? <Loader /> : orders.length === 0 ? (
                    <div className="de-empty">
                        <i className="fa fa-inbox" aria-hidden="true"></i>
                        <p>No orders in this list yet.</p>
                    </div>
                ) : (
                    <div className="de-order-list">
                        {orders.map(order => {
                            const status = order.orderStatus;
                            const showActions = tab !== 'history' && status !== 'Delivered' && status !== 'Cancelled';
                            const busy = actionId === order._id;
                            return (
                                <div className="de-order-card" key={order._id}>
                                    <div className="de-order-top">
                                        <div className="de-order-id">
                                            <span className="de-order-id-label">Order</span>
                                            <span className="de-order-id-value">#{order._id.slice(-8).toUpperCase()}</span>
                                        </div>
                                        <span className={`badge ${STATUS_BADGES[status] || 'badge-secondary'}`}>{status}</span>
                                        {order.paymentMethod === 'cod' && (
                                            <span className={`de-cod-badge ${order.codStatus === 'Collected' ? 'de-cod-badge--done' : ''}`}>
                                                <i className="fa fa-hand-holding-dollar mr-1" aria-hidden="true"></i>COD
                                                {order.orderStatus === 'Delivered' && (order.codStatus === 'Collected' ? ' · Cash Collected' : ' · Cash Pending')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="de-order-body">
                                        <div className="de-order-cust">
                                            <div className="de-cust-avatar"><i className="fa fa-user" aria-hidden="true"></i></div>
                                            <div>
                                                <div className="de-cust-name">{order.shippingInfo?.name || order.user?.name || 'Customer'}</div>
                                                <a href={callLink(order)} className="de-cust-phone">
                                                    <i className="fa fa-phone mr-1" aria-hidden="true"></i>{order.shippingInfo?.phoneNo || '—'}
                                                </a>
                                            </div>
                                        </div>

                                        <div className="de-order-meta">
                                            <div className="de-meta-item">
                                                <i className="fa fa-map-marker" aria-hidden="true"></i>
                                                <span className="de-meta-text">{buildAddress(order)}</span>
                                            </div>
                                            <div className="de-meta-item">
                                                <i className="fa fa-calendar" aria-hidden="true"></i>
                                                <span className="de-meta-text">Expected: {expectedDate(order)}</span>
                                            </div>
                                            <div className="de-meta-item">
                                                <i className="fa fa-shopping-bag" aria-hidden="true"></i>
                                                <span className="de-meta-text">{order.orderItems?.length || 0} item(s) · ₹{(order.totalPrice || 0).toLocaleString('en-IN')}</span>
                                            </div>
                                            {order.shippingInfo?.landmark && (
                                                <div className="de-meta-item">
                                                    <i className="fa fa-flag" aria-hidden="true"></i>
                                                    <span className="de-meta-text">Landmark: {order.shippingInfo.landmark}</span>
                                                </div>
                                            )}
                                            {order.shippingInfo?.instructions && (
                                                <div className="de-meta-item">
                                                    <i className="fa fa-sticky-note-o" aria-hidden="true"></i>
                                                    <span className="de-meta-text">{order.shippingInfo.instructions}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="de-order-foot">
                                        <a href={mapLink(order)} target="_blank" rel="noreferrer" className="de-btn de-btn--ghost">
                                            <i className="fa fa-map-marker-alt mr-1" aria-hidden="true"></i> Navigate
                                        </a>
                                        <a href={callLink(order)} className="de-btn de-btn--ghost">
                                            <i className="fa fa-phone mr-1" aria-hidden="true"></i> Call
                                        </a>
                                        {showActions && (
                                            <Fragment>
                                                {status !== 'Out for Delivery' ? (
                                                    <button type="button" className="de-btn de-btn--primary" disabled={busy} onClick={() => markOutForDelivery(order)}>
                                                        {busy ? <i className="fa fa-spinner fa-spin mr-1" aria-hidden="true"></i> : <i className="fa fa-truck mr-1" aria-hidden="true"></i>}
                                                        Out for Delivery
                                                    </button>
                                                ) : (
                                                    <button type="button" className="de-btn de-btn--success" disabled={busy} onClick={() => openOtpModal(order)}>
                                                        <i className="fa fa-check mr-1" aria-hidden="true"></i> Confirm Delivery
                                                    </button>
                                                )}
                                            </Fragment>
                                        )}
                                        {tab === 'history' && order.paymentMethod === 'cod' && status === 'Delivered' && order.codStatus !== 'Collected' && (
                                            <button type="button" className="de-btn de-btn--primary" disabled={busy} onClick={() => collectCodCash(order)}>
                                                {busy ? <i className="fa fa-spinner fa-spin mr-1" aria-hidden="true"></i> : <i className="fa fa-hand-holding-dollar mr-1" aria-hidden="true"></i>}
                                                Collect Cash
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <p className="text-center mt-4 mb-0" style={{ fontSize: '0.85rem' }}>
                    <Link to="/">← Back to VijayCart</Link>
                </p>
            </div>

            <Modal show={!!otpOrder} onHide={closeOtpModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title><i className="fa fa-key mr-2" aria-hidden="true"></i>Confirm Delivery</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="de-otp-note">
                        Ask the customer for the <strong>last 4 digits</strong> of their registered phone number
                        (<span className="de-otp-phone">{otpOrder?.shippingInfo?.phoneNo || ''}</span>) to confirm delivery.
                    </p>
                    <input
                        type="tel"
                        inputMode="numeric"
                        maxLength="4"
                        autoFocus
                        className="de-otp-input"
                        placeholder="• • • •"
                        value={otpValue}
                        onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={e => { if (e.key === 'Enter') submitOtp(); }}
                    />
                    {otpError && <p className="de-otp-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{otpError}</p>}
                    {otpOrder?.paymentMethod === 'cod' && (
                        <label className="de-cash-check">
                            <input
                                type="checkbox"
                                checked={collectCash}
                                onChange={e => setCollectCash(e.target.checked)}
                            />
                            <span><i className="fa fa-hand-holding-dollar mr-1" aria-hidden="true"></i>Cash of <b>₹{Number(otpOrder.totalPrice || 0).toLocaleString('en-IN')}</b> collected from customer</span>
                        </label>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <button type="button" className="de-btn de-btn--ghost" onClick={closeOtpModal}>Cancel</button>
                    <button type="button" className="de-btn de-btn--success" disabled={actionId === otpOrder?._id} onClick={submitOtp}>
                        {actionId === otpOrder?._id ? <i className="fa fa-spinner fa-spin mr-1" aria-hidden="true"></i> : <i className="fa fa-check mr-1" aria-hidden="true"></i>}
                        Confirm &amp; Deliver
                    </button>
                </Modal.Footer>
            </Modal>
        </Fragment>
    )
}
