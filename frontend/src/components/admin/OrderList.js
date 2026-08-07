import { Fragment, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { adminOrders as adminOrdersAction, deleteOrder } from '../../actions/orderActions';
import { getDeliveryBoys } from '../../actions/deliveryActions';
import { clearError, clearOrderDeleted } from '../../slices/orderSlice';
import { toast } from 'react-toastify';
import { toINR } from './Charts';
import { ORDER_STATUSES, statusBadge } from '../../utils/orderStatuses';
import AdminPagination from './AdminPagination';
import AdminExport from './AdminExport';

export default function OrderList() {
    const { adminOrders = [], loading = true, error, isOrderDeleted } = useSelector(state => state.orderState);
    const { deliveryBoys = [] } = useSelector(state => state.deliveryState);
    const dispatch = useDispatch();

    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;

    useEffect(() => {
        dispatch(adminOrdersAction());
        dispatch(getDeliveryBoys());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast(error, { position: toast.POSITION.BOTTOM_CENTER, type: 'error', onOpen: () => dispatch(clearError()) });
            return;
        }
        if (isOrderDeleted) {
            toast('Order deleted successfully!', { type: 'success', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearOrderDeleted()) });
            return;
        }
    }, [dispatch, error, isOrderDeleted]);

    const boyName = id => {
        const boy = deliveryBoys.find(b => String(b._id) === String(id));
        return boy ? boy.name : null;
    };

    const filtered = useMemo(() => {
        let list = adminOrders;
        if (status) list = list.filter(o => o.orderStatus === status);
        if (query.trim()) {
            const q = query.trim().toLowerCase();
            list = list.filter(o =>
                o._id.toLowerCase().includes(q) ||
                (o.shippingInfo?.name || o.user?.name || '').toLowerCase().includes(q) ||
                (o.shippingInfo?.city || '').toLowerCase().includes(q) ||
                (o.shippingInfo?.phoneNo || '').includes(q)
            );
        }
        return list;
    }, [adminOrders, query, status]);

    useEffect(() => { setPage(1); }, [query, status]);

    const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const exportHeaders = [
        { label: 'Order ID', key: 'id' },
        { label: 'Customer', key: 'customer' },
        { label: 'Phone', key: 'phone' },
        { label: 'City', key: 'city' },
        { label: 'Items', key: 'items', type: 'number' },
        { label: 'Total', key: 'total', type: 'number' },
        { label: 'Payment', key: 'payment' },
        { label: 'Status', key: 'status' },
        { label: 'Delivery Boy', key: 'deliveryBoy' },
        { label: 'Placed', key: 'placed', type: 'date' }
    ];
    const exportRows = filtered.map(o => ({
        id: o._id,
        customer: o.shippingInfo?.name || o.user?.name || '',
        phone: o.shippingInfo?.phoneNo || '',
        city: o.shippingInfo?.city || '',
        items: o.orderItems?.length || 0,
        total: o.totalPrice,
        payment: o.paymentMethod === 'cod' ? `COD (${o.codStatus === 'Collected' ? 'Collected' : 'Pending'})` : (o.paymentInfo?.status === 'succeeded' ? 'Paid' : 'Not Paid'),
        status: o.orderStatus,
        deliveryBoy: boyName(o.deliveryBoy) || '',
        placed: o.createdAt
    }));

    const revenue = adminOrders.filter(o => o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Cancelled by Customer').reduce((s, o) => s + o.totalPrice, 0);

    const deleteHandler = (id) => {
        dispatch(deleteOrder(id));
    };

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Orders</h1>
                    <p>{adminOrders.length} total · {toINR(revenue)} revenue (excl. cancelled)</p>
                </div>
                <div className="ad-toolbar">
                    <AdminExport filename="orders" headers={exportHeaders} rows={exportRows} />
                    <Link to="/admin/delivery" className="ad-btn ad-btn--primary"><i className="fa fa-motorcycle" aria-hidden="true"></i> Assign Delivery</Link>
                </div>
            </div>

            <div className="ad-stat-grid">
                <div className="ad-stat ad-stat--success">
                    <div className="ad-stat__icon"><i className="fa fa-shopping-basket" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Total Orders</div><div className="ad-stat__value">{adminOrders.length}</div></div>
                </div>
                <div className="ad-stat ad-stat--warning">
                    <div className="ad-stat__icon"><i className="fa fa-hourglass-half" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Pending</div><div className="ad-stat__value">{adminOrders.filter(o => o.orderStatus === 'Pending' || o.orderStatus === 'Processing').length}</div></div>
                </div>
                <div className="ad-stat ad-stat--primary">
                    <div className="ad-stat__icon"><i className="fa fa-truck" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">In Transit</div><div className="ad-stat__value">{adminOrders.filter(o => ['Confirmed', 'Packed', 'Shipped', 'Out for Delivery'].includes(o.orderStatus)).length}</div></div>
                </div>
                <div className="ad-stat ad-stat--info">
                    <div className="ad-stat__icon"><i className="fa fa-check-circle" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Delivered</div><div className="ad-stat__value">{adminOrders.filter(o => o.orderStatus === 'Delivered').length}</div></div>
                </div>
            </div>

            <div className="ad-card">
                <div className="ad-card__head">
                    <div className="ad-toolbar">
                        <div className="ad-search">
                            <i className="fa fa-search" aria-hidden="true"></i>
                            <input placeholder="Search by ID, city or phone…" value={query} onChange={e => setQuery(e.target.value)} />
                        </div>
                        <select className="ad-filter" value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="">All statuses</option>
                            {ORDER_STATUSES.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="ad-card__body ad-card__body--flush">
                    {loading ? (
                        <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading orders…</div>
                    ) : filtered.length === 0 ? (
                        <div className="ad-empty"><i className="fa fa-inbox" aria-hidden="true"></i><p>No orders match your filters.</p></div>
                    ) : (
                        <div className="ad-table-wrap">
                            <table className="ad-table">
                                <thead>
                                    <tr>
                                        <th>Order</th>
                                        <th>Customer</th>
                                        <th>Ship To</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Payment</th>
                                        <th>Status</th>
                                        <th>Delivery Boy</th>
                                        <th>Placed</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageItems.map(order => {
                                        const boy = boyName(order.deliveryBoy);
                                        const locked = order.orderStatus === 'Cancelled by Customer';
                                        return (
                                            <tr key={order._id}>
                                                <td><span className="ad-td-mono">#{order._id.slice(-8).toUpperCase()}</span></td>
                                                <td>
                                                    <div className="ad-td-strong">{order.shippingInfo?.name || order.user?.name || '—'}</div>
                                                    <div className="ad-stat__label">{order.shippingInfo?.phoneNo || ''}</div>
                                                </td>
                                                <td>
                                                    <span className="ad-stat__label">
                                                        {[order.shippingInfo?.city, order.shippingInfo?.state, order.shippingInfo?.postalCode].filter(Boolean).join(', ') || '—'}
                                                    </span>
                                                </td>
                                                <td>{order.orderItems?.length || 0}</td>
                                                <td><span className="ad-td-strong">{toINR(order.totalPrice)}</span></td>
                                                <td>
                                                    {order.paymentMethod === 'cod' ? (
                                                        <span className={`ad-badge ${order.codStatus === 'Collected' ? 'ad-badge--success' : 'ad-badge--warning'}`}>
                                                            COD · {order.codStatus === 'Collected' ? 'Collected' : 'Pending'}
                                                        </span>
                                                    ) : (
                                                        <span className={`ad-badge ${order.paymentInfo?.status === 'succeeded' ? 'ad-badge--success' : 'ad-badge--danger'}`}>
                                                            {order.paymentInfo?.status === 'succeeded' ? 'PAID' : 'NOT PAID'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`ad-badge ${statusBadge(order.orderStatus)}`}>
                                                        {locked && <i className="fa fa-lock mr-1" aria-hidden="true"></i>}
                                                        {order.orderStatus}
                                                    </span>
                                                </td>
                                                <td>{boy ? <span className="ad-chip"><i className="fa fa-motorcycle" aria-hidden="true"></i>{boy}</span> : <span className="ad-stat__label">—</span>}</td>
                                                <td><span className="ad-stat__label">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></td>
                                                <td>
                                                    <div className="ad-toolbar">
                                                        {locked ? (
                                                            <Link to={`/admin/order/${order._id}`} className="ad-btn ad-btn--ghost ad-btn--sm" title="View only"><i className="fa fa-eye" aria-hidden="true"></i></Link>
                                                        ) : (
                                                            <Link to={`/admin/order/${order._id}`} className="ad-btn ad-btn--ghost ad-btn--sm" title="Manage"><i className="fa fa-pencil" aria-hidden="true"></i></Link>
                                                        )}
                                                        {!locked && (
                                                            <button type="button" className="ad-btn ad-btn--danger ad-btn--sm ad-btn--icon" title="Delete" onClick={() => deleteHandler(order._id)}>
                                                                <i className="fa fa-trash" aria-hidden="true"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {filtered.length > PER_PAGE && (
                        <AdminPagination count={filtered.length} perPage={PER_PAGE} page={page} onChange={setPage} />
                    )}
                </div>
            </div>
        </Fragment>
    );
}
