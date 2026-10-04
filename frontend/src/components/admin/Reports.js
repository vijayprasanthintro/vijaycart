import { Fragment, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAdminProducts } from '../../actions/productActions';
import { adminOrders } from '../../actions/orderActions';
import { getUsers } from '../../actions/userActions';
import { getAnalytics } from '../../actions/analyticsActions';
import { toINR } from './Charts';
import AdminExport from './AdminExport';

// A report card: headline metrics + one-click CSV/Excel export + a preview of
// the first rows so the admin sees exactly what will download.
function ReportCard({ icon, accent, title, desc, stats, headers, rows, loading }) {
    return (
        <div className="ad-card ad-card--lift ad-report-card">
            <div className="ad-card__head">
                <div className="ad-report-card__title">
                    <span className={`ad-report-card__icon ${accent}`}><i className={`fa ${icon}`} aria-hidden="true"></i></span>
                    <div>
                        <h3 className="ad-card__title">{title}</h3>
                        <p className="ad-stat__label">{desc}</p>
                    </div>
                </div>
                <AdminExport filename={title.toLowerCase().replace(/[^a-z0-9]+/g, '-')} headers={headers} rows={rows} />
            </div>
            <div className="ad-card__body">
                {loading ? (
                    <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading…</div>
                ) : (
                    <Fragment>
                        <div className="ad-report-stats">
                            {stats.map((s, i) => (
                                <div key={i}>
                                    <div className="ad-stat__label">{s.label}</div>
                                    <div className="ad-report-stats__value ad-num">{s.value}</div>
                                </div>
                            ))}
                        </div>
                        {rows.length > 0 && (
                            <div className="ad-table-wrap ad-report-preview">
                                <table className="ad-table">
                                    <thead>
                                        <tr>{headers.map((h, i) => <th key={i}>{h.label}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        {rows.slice(0, 5).map((r, i) => (
                                            <tr key={i}>
                                                {headers.map((h, j) => <td key={j}>{r[h.key] != null && r[h.key] !== '' ? r[h.key] : '—'}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {rows.length === 0 && (
                            <div className="ad-empty ad-empty--small"><i className="fa fa-inbox" aria-hidden="true"></i><p>No rows to export yet.</p></div>
                        )}
                    </Fragment>
                )}
            </div>
        </div>
    );
}

export default function Reports() {
    const dispatch = useDispatch();
    const { products = [], loading: productsLoading } = useSelector(state => state.productsState);
    const { adminOrders: orders = [], loading: ordersLoading } = useSelector(state => state.orderState);
    const { users = [], loading: usersLoading } = useSelector(state => state.userState);
    const { analytics, loading: analyticsLoading } = useSelector(state => state.analyticsState);

    useEffect(() => {
        dispatch(getAdminProducts);
        dispatch(adminOrders());
        dispatch(getUsers);
        dispatch(getAnalytics('365'));
    }, [dispatch]);

    // ---- Orders report ----
    const orderHeaders = [
        { label: 'Order ID', key: 'id' },
        { label: 'Customer', key: 'customer' },
        { label: 'Phone', key: 'phone' },
        { label: 'City', key: 'city' },
        { label: 'Items', key: 'items', type: 'number' },
        { label: 'Total', key: 'total', type: 'number' },
        { label: 'Payment', key: 'payment' },
        { label: 'Status', key: 'status' },
        { label: 'Placed', key: 'placed', type: 'date' }
    ];
    const orderRows = orders.map(o => ({
        id: o._id,
        customer: o.shippingInfo?.name || o.user?.name || '',
        phone: o.shippingInfo?.phoneNo || '',
        city: o.shippingInfo?.city || '',
        items: o.orderItems?.length || 0,
        total: o.totalPrice,
        payment: o.paymentMethod === 'cod' ? 'COD' : (o.paymentInfo?.status === 'succeeded' ? 'Paid' : 'Not Paid'),
        status: o.orderStatus,
        placed: o.createdAt
    }));

    // ---- Products report ----
    const productHeaders = [
        { label: 'Name', key: 'name' },
        { label: 'Category', key: 'category' },
        { label: 'Seller', key: 'seller' },
        { label: 'Price', key: 'price', type: 'number' },
        { label: 'Stock', key: 'stock', type: 'number' },
        { label: 'Rating', key: 'ratings', type: 'number' }
    ];
    const productRows = products.map(p => ({
        name: p.name,
        category: p.category,
        seller: p.seller || '',
        price: p.price,
        stock: p.stock,
        ratings: p.ratings || 0
    }));

    // ---- Customers report ----
    const topCustomers = analytics.topCustomers || [];
    const customerHeaders = [
        { label: 'Name', key: 'name' },
        { label: 'Email', key: 'email' },
        { label: 'Phone', key: 'phone' },
        { label: 'Orders', key: 'orders', type: 'number' },
        { label: 'Spend', key: 'spend', type: 'number' },
        { label: 'Joined', key: 'joined', type: 'date' }
    ];
    const customerRows = users
        .filter(u => u.role === 'user')
        .map(u => {
            const tc = topCustomers.find(t => String(t.userId) === String(u._id));
            return {
                name: u.name || '',
                email: u.email || '',
                phone: u.mobile || '',
                orders: tc?.orders || 0,
                spend: tc?.spend || 0,
                joined: u.createdAt
            };
        })
        .sort((a, b) => b.spend - a.spend);

    // ---- Inventory report ----
    const threshold = analytics.lowStockThreshold || 5;
    const inventoryHeaders = [
        { label: 'Name', key: 'name' },
        { label: 'Category', key: 'category' },
        { label: 'Stock', key: 'stock', type: 'number' },
        { label: 'Status', key: 'status' },
        { label: 'Price', key: 'price', type: 'number' }
    ];
    const inventoryRows = products
        .filter(p => p.stock <= threshold)
        .map(p => ({
            name: p.name,
            category: p.category,
            stock: p.stock,
            status: p.stock === 0 ? 'Out of stock' : 'Low stock',
            price: p.price
        }))
        .sort((a, b) => a.stock - b.stock);

    // ---- Revenue report ----
    const statusCounts = analytics.statusCounts || {};
    const revenueHeaders = [
        { label: 'Status', key: 'status' },
        { label: 'Orders', key: 'count', type: 'number' },
        { label: 'Revenue', key: 'total', type: 'number' }
    ];
    const revenueRows = Object.entries(analytics.statusRevenue || {}).map(([status, total]) => ({
        status,
        count: statusCounts[status] || 0,
        total: Math.round(total)
    }));

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Reports &amp; Exports</h1>
                    <p>Download live store data as CSV or Excel — Orders, Products, Customers, Inventory &amp; Revenue</p>
                </div>
            </div>

            <div className="ad-reports-grid">
                <ReportCard
                    icon="fa-shopping-basket" accent="ad-stat--info"
                    title="Orders Report" desc="Every order with customer, payment & status"
                    loading={ordersLoading && orders.length === 0}
                    headers={orderHeaders} rows={orderRows}
                    stats={[
                        { label: 'Total orders', value: orders.length },
                        { label: 'Revenue (excl. cancelled)', value: toINR(orders.filter(o => o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Cancelled by Customer').reduce((s, o) => s + o.totalPrice, 0)) },
                        { label: 'Pending', value: (statusCounts['Pending'] || 0) },
                        { label: 'Delivered', value: orders.filter(o => o.orderStatus === 'Delivered').length }
                    ]}
                />

                <ReportCard
                    icon="fa-cube" accent="ad-stat--violet"
                    title="Products Report" desc="Full catalogue with pricing & stock"
                    loading={productsLoading && products.length === 0}
                    headers={productHeaders} rows={productRows}
                    stats={[
                        { label: 'Total products', value: products.length },
                        { label: 'Out of stock', value: products.filter(p => p.stock === 0).length },
                        { label: `Low stock (≤${threshold})`, value: products.filter(p => p.stock > 0 && p.stock <= threshold).length }
                    ]}
                />

                <ReportCard
                    icon="fa-users" accent="ad-stat--success"
                    title="Customers Report" desc="Accounts with lifetime order value"
                    loading={usersLoading && users.length === 0}
                    headers={customerHeaders} rows={customerRows}
                    stats={[
                        { label: 'Customer accounts', value: users.filter(u => u.role === 'user').length },
                        { label: 'Total accounts', value: users.length },
                        { label: 'Top spender', value: customerRows.length ? String(customerRows[0].name).split(' ')[0] : '—' }
                    ]}
                />

                <ReportCard
                    icon="fa-industry" accent="ad-stat--warning"
                    title="Inventory Report" desc="Products at or below the low-stock threshold"
                    loading={productsLoading && products.length === 0}
                    headers={inventoryHeaders} rows={inventoryRows}
                    stats={[
                        { label: 'Need attention', value: inventoryRows.length },
                        { label: 'Out of stock', value: products.filter(p => p.stock === 0).length },
                        { label: 'Alert threshold', value: `≤${threshold}` }
                    ]}
                />

                <ReportCard
                    icon="fa-rupee" accent="ad-stat--primary"
                    title="Revenue Report" desc="Revenue split by order status"
                    loading={analyticsLoading && analytics.totalOrders === undefined}
                    headers={revenueHeaders} rows={revenueRows}
                    stats={[
                        { label: 'Total revenue', value: toINR(analytics.revenue || 0) },
                        { label: 'Collected', value: toINR(analytics.paidRevenue || 0) },
                        { label: 'In transit', value: toINR(analytics.pendingRevenue || 0) },
                        { label: 'Today', value: toINR(analytics.todayRevenue || 0) }
                    ]}
                />
            </div>
        </Fragment>
    );
}
