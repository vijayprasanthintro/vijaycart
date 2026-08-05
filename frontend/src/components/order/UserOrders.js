import { Fragment, useEffect, useState } from 'react'
import MetaData from '../layouts/MetaData';
import { useDispatch, useSelector } from 'react-redux';
import { userOrders as userOrdersAction, cancelOrder } from '../../actions/orderActions';
import { addCartItem } from '../../actions/cartActions';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatMoney } from '../../utils/productHelper';
import { openInvoice } from '../../utils/invoice';

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
];

const statusMeta = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('cancel')) return { label: status, cls: 'cancelled' };
    if (s.includes('delivered')) return { label: status, cls: 'delivered' };
    if (s.includes('ship') || s.includes('out for delivery')) return { label: status, cls: 'shipped' };
    if (s.includes('pack')) return { label: status, cls: 'packed' };
    if (s.includes('process')) return { label: status, cls: 'processing' };
    return { label: status || 'Processing', cls: 'processing' };
};

const matchesTab = (status, tab) => {
    if (tab === 'all') return true;
    const s = (status || '').toLowerCase();
    switch (tab) {
        case 'processing': return s.includes('process');
        case 'shipped': return s.includes('ship') || s.includes('out for delivery') || s.includes('pack');
        case 'delivered': return s.includes('deliver');
        case 'cancelled': return s.includes('cancel');
        default: return true;
    }
};

const fmtDate = (d) => {
    try { return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return ''; }
};

export default function UserOrders () {
    const { userOrders = [], loading } = useSelector(state => state.orderState)
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [tab, setTab] = useState('all');

    useEffect(() => {
        dispatch(userOrdersAction)
    }, [dispatch])

    const filtered = userOrders.filter(o => matchesTab(o.orderStatus, tab));
    const tabCount = (key) => key === 'all' ? userOrders.length : userOrders.filter(o => matchesTab(o.orderStatus, key)).length;

    const canCancel = (status) => ['process', 'pack'].some(k => (status || '').toLowerCase().includes(k));

    const returnBadge = (status) => {
        const s = (status || '').toLowerCase();
        if (s.includes('replacement')) return { label: 'Replacement', cls: 'replace' };
        if (s.includes('return')) return { label: 'Return', cls: 'return' };
        return null;
    };

    const handleCancel = async (order) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        const res = await dispatch(cancelOrder(order._id));
        if (res && res.success) {
            toast.success('Order cancelled successfully');
        } else {
            toast.error(res?.error || 'Could not cancel order. Please try again.');
        }
    };

    const buyAgain = async (order) => {
        try {
            await Promise.all(order.orderItems.map(item => dispatch(addCartItem(item.product, item.quantity))));
            toast.success('Items added to your cart');
            navigate('/cart');
        } catch {
            toast.error('Could not add items to cart');
        }
    };

    return (
        <Fragment>
            <MetaData title="My Orders" />
            <div className="mo-page">
                <div className="addr-head">
                    <div>
                        <h1 className="cart-title">My Orders</h1>
                        <p className="addr-sub">Track, cancel or re-order your purchases.</p>
                    </div>
                </div>

                <div className="mo-tabs" role="tablist">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            type="button"
                            role="tab"
                            aria-selected={tab === t.key}
                            className={`mo-tab ${tab === t.key ? 'active' : ''}`}
                            onClick={() => setTab(t.key)}
                        >
                            {t.label} <span className="mo-tab-count">{tabCount(t.key)}</span>
                        </button>
                    ))}
                </div>

                {loading && userOrders.length === 0 ? (
                    <div className="text-center my-5"><i className="fa fa-spinner fa-spin fa-2x" style={{ color: 'var(--vc-orange)' }} aria-hidden="true"></i></div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><i className="fa fa-box-open" aria-hidden="true"></i></div>
                        <h2 className="empty-title">{tab === 'all' ? 'No orders yet' : `No ${tab} orders`}</h2>
                        <p className="empty-sub">{tab === 'all' ? 'When you place an order, it will show up here with live tracking.' : 'Orders in this status will appear here.'}</p>
                        <Link to="/search/all" className="empty-cta"><i className="fa fa-shopping-bag mr-2" aria-hidden="true"></i>Start Shopping</Link>
                    </div>
                ) : (
                    <div className="mo-list">
                        {filtered.map(order => {
                            const meta = statusMeta(order.orderStatus);
                            const rbadge = returnBadge(order.returnStatus);
                            return (
                                <div className="mo-card" key={order._id}>
                                    <div className="mo-card-top">
                                        <div>
                                            <div className="mo-order-id"><i className="fa fa-hashtag mr-1" aria-hidden="true"></i>Order #{order._id}</div>
                                            <div className="mo-date">Placed on {fmtDate(order.createdAt)}</div>
                                        </div>
                                        <span className={`mo-status ${meta.cls}`}><i className={`fa mr-1 ${meta.cls === 'delivered' ? 'fa-check-circle' : meta.cls === 'cancelled' ? 'fa-times-circle' : meta.cls === 'shipped' ? 'fa-truck' : 'fa-hourglass-half'}`} aria-hidden="true"></i>{meta.label}</span>
                                    </div>

                                    {rbadge && (
                                        <div className={`mo-return-badge ${rbadge.cls}`}>
                                            <i className={`fa mr-1 ${rbadge.cls === 'return' ? 'fa-rotate-left' : 'fa-arrows-rotate'}`} aria-hidden="true"></i>{rbadge.label} {String(order.returnStatus).toLowerCase().includes('requested') ? 'requested' : String(order.returnStatus).toLowerCase()}
                                        </div>
                                    )}

                                    <Link to={`/order/${order._id}`} className="mo-thumbs">
                                        {order.orderItems.slice(0, 4).map((item, i) => (
                                            <span className="mo-thumb" key={item.product + i}>
                                                <img src={item.image} alt={item.name} loading="lazy" />
                                            </span>
                                        ))}
                                        {order.orderItems.length > 4 && <span className="mo-thumb mo-thumb-more">+{order.orderItems.length - 4}</span>}
                                    </Link>

                                    <div className="mo-card-mid">
                                        <div className="mo-summary-line">
                                            <span>{order.orderItems.reduce((a, it) => a + it.quantity, 0)} item{order.orderItems.reduce((a, it) => a + it.quantity, 0) === 1 ? '' : 's'}</span>
                                            <b>{formatMoney(order.totalPrice)}</b>
                                        </div>
                                        <div className="mo-pay">
                                            {order.paymentMethod === 'cod'
                                                ? <Fragment>
                                                    <i className="fa fa-hand-holding-dollar mr-1" aria-hidden="true"></i>
                                                    COD{String(order.orderStatus || '').toLowerCase().includes('deliver') ? (order.codStatus === 'Collected' ? ' · Cash Collected' : ' · Cash Pending') : ''}
                                                  </Fragment>
                                                : <Fragment>
                                                    <i className={`fa ${order.paymentInfo?.status === 'succeeded' ? 'fa-check-circle' : 'fa-clock-o'} mr-1`} aria-hidden="true"></i>
                                                    {order.paymentInfo?.status === 'succeeded' ? 'Paid' : 'Payment pending'}
                                                  </Fragment>}
                                        </div>
                                    </div>

                                    <div className="mo-actions">
                                        <Link to={`/order/${order._id}`} className="mo-btn primary"><i className="fa fa-eye mr-1" aria-hidden="true"></i>View Details</Link>
                                        <button type="button" className="mo-btn" onClick={() => openInvoice(order)}><i className="fa fa-file-invoice mr-1" aria-hidden="true"></i>Invoice</button>
                                        <button type="button" className="mo-btn" onClick={() => buyAgain(order)}><i className="fa fa-cart-plus mr-1" aria-hidden="true"></i>Buy Again</button>
                                        {canCancel(order.orderStatus) && (
                                            <button type="button" className="mo-btn danger" onClick={() => handleCancel(order)}><i className="fa fa-times mr-1" aria-hidden="true"></i>Cancel Order</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Fragment>
    )
}
