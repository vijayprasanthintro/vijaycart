import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getAnalytics } from '../../actions/analyticsActions';
import { BarChart, DonutChart, toINR } from './Charts';
import { ORDER_STATUSES, statusBadge, statusColor } from '../../utils/orderStatuses';

const STATUS_STAT = {
    'Pending': { icon: 'fa-hourglass-half', mod: 'ad-stat--warning', label: 'Pending' },
    'Confirmed': { icon: 'fa-check-circle-o', mod: 'ad-stat--info', label: 'Confirmed' },
    'Packed': { icon: 'fa-box', mod: 'ad-stat--info', label: 'Packed' },
    'Shipped': { icon: 'fa-paper-plane-o', mod: 'ad-stat--primary', label: 'Shipped' },
    'Out for Delivery': { icon: 'fa-truck', mod: 'ad-stat--primary', label: 'Out for Delivery' },
    'Delivered': { icon: 'fa-check-circle', mod: 'ad-stat--success', label: 'Delivered' },
    'Cancelled': { icon: 'fa-times-circle', mod: 'ad-stat--danger', label: 'Cancelled' }
};

export default function Dashboard() {
    const { analytics, loading } = useSelector(state => state.analyticsState);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(getAnalytics());
    }, [dispatch]);

    const statusCounts = analytics.statusCounts || {};
    const statusSegments = ORDER_STATUSES.map(status => ({
        label: status,
        value: statusCounts[status] || 0,
        color: statusColor(status)
    }));

    const trendData = (analytics.orderTrend || []).map(d => ({ label: d.label, value: d.orders }));

    return (
        <div>
            <div className="ad-page-head">
                <div>
                    <h1>Dashboard</h1>
                    <p>Store overview &amp; key metrics</p>
                </div>
                <div className="ad-toolbar">
                    <Link to="/admin/orders" className="ad-btn ad-btn--ghost"><i className="fa fa-shopping-basket" aria-hidden="true"></i> Orders</Link>
                    <Link to="/admin/products/create" className="ad-btn ad-btn--primary"><i className="fa fa-plus" aria-hidden="true"></i> New Product</Link>
                </div>
            </div>

            {loading && !analytics.totalOrders && (
                <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading dashboard…</div>
            )}

            <div className="ad-stat-grid">
                <div className="ad-stat ad-stat--primary">
                    <div className="ad-stat__icon"><i className="fa fa-indian-rupee" aria-hidden="true"></i></div>
                    <div>
                        <div className="ad-stat__label">Total Revenue</div>
                        <div className="ad-stat__value">{toINR(analytics.revenue)}</div>
                    </div>
                </div>
                <div className="ad-stat ad-stat--success">
                    <div className="ad-stat__icon"><i className="fa fa-shopping-basket" aria-hidden="true"></i></div>
                    <div>
                        <div className="ad-stat__label">Orders</div>
                        <div className="ad-stat__value">{analytics.totalOrders || 0}</div>
                    </div>
                </div>
                <div className="ad-stat ad-stat--info">
                    <div className="ad-stat__icon"><i className="fa fa-box" aria-hidden="true"></i></div>
                    <div>
                        <div className="ad-stat__label">Products</div>
                        <div className="ad-stat__value">{analytics.totalProducts || 0}</div>
                    </div>
                </div>
                <div className="ad-stat ad-stat--warning">
                    <div className="ad-stat__icon"><i className="fa fa-users" aria-hidden="true"></i></div>
                    <div>
                        <div className="ad-stat__label">Customers</div>
                        <div className="ad-stat__value">{analytics.customers || 0}</div>
                    </div>
                </div>
                <div className="ad-stat ad-stat--danger">
                    <div className="ad-stat__icon"><i className="fa fa-exclamation-triangle" aria-hidden="true"></i></div>
                    <div>
                        <div className="ad-stat__label">Out of Stock</div>
                        <div className="ad-stat__value">{analytics.outOfStock || 0}</div>
                    </div>
                </div>
                <div className="ad-stat">
                    <div className="ad-stat__icon"><i className="fa fa-warehouse" aria-hidden="true"></i></div>
                    <div>
                        <div className="ad-stat__label">Low Stock</div>
                        <div className="ad-stat__value">{analytics.lowStock || 0}</div>
                    </div>
                </div>
                <div className="ad-stat">
                    <div className="ad-stat__icon"><i className="fa fa-motorcycle" aria-hidden="true"></i></div>
                    <div>
                        <div className="ad-stat__label">Delivery Boys</div>
                        <div className="ad-stat__value">{analytics.deliveryBoys || 0}</div>
                    </div>
                </div>
                <div className="ad-stat">
                    <div className="ad-stat__icon"><i className="fa fa-undo" aria-hidden="true"></i></div>
                    <div>
                        <div className="ad-stat__label">Return Requests</div>
                        <div className="ad-stat__value">{analytics.returnRequests || 0}</div>
                    </div>
                </div>
                {ORDER_STATUSES.map(status => {
                    const meta = STATUS_STAT[status];
                    return (
                        <div className={`ad-stat ${meta.mod}`} key={status}>
                            <div className="ad-stat__icon"><i className={`fa ${meta.icon}`} aria-hidden="true"></i></div>
                            <div>
                                <div className="ad-stat__label">{meta.label}</div>
                                <div className="ad-stat__value">{statusCounts[status] || 0}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="ad-chart-row">
                <div className="ad-card">
                    <div className="ad-card__head">
                        <h3 className="ad-card__title"><i className="fa fa-chart-bar" aria-hidden="true"></i> Orders — Last 14 Days</h3>
                    </div>
                    <div className="ad-card__body">
                        <BarChart data={trendData} />
                    </div>
                </div>
                <div className="ad-card">
                    <div className="ad-card__head">
                        <h3 className="ad-card__title"><i className="fa fa-pie-chart" aria-hidden="true"></i> Orders by Status</h3>
                    </div>
                    <div className="ad-card__body">
                        <DonutChart segments={statusSegments} centerLabel="Orders" centerValue={analytics.totalOrders || 0} />
                    </div>
                </div>
            </div>

            <div className="ad-split">
                <div className="ad-card">
                    <div className="ad-card__head">
                        <h3 className="ad-card__title"><i className="fa fa-clock-o" aria-hidden="true"></i> Recent Orders</h3>
                        <Link to="/admin/orders" className="ad-btn ad-btn--link">View all →</Link>
                    </div>
                    <div className="ad-card__body ad-card__body--flush">
                        {!loading && (analytics.recentOrders || []).length === 0 && (
                            <div className="ad-empty"><i className="fa fa-inbox" aria-hidden="true"></i><p>No orders yet.</p></div>
                        )}
                        {(analytics.recentOrders || []).slice(0, 6).map(order => (
                            <div className="ad-list-item" key={order._id}>
                                <span className={`ad-badge ${statusBadge(order.orderStatus)}`}>
                                    <span className="ad-badge__dot"></span>{order.orderStatus}
                                </span>
                                <div className="ad-td-strong">#{order._id.slice(-8).toUpperCase()}</div>
                                <div className="ad-meta">{order.shippingInfo?.city || order.user?.name || '—'}</div>
                                <div className="ad-td-strong" style={{ marginLeft: 'auto' }}>{toINR(order.totalPrice)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="ad-card">
                    <div className="ad-card__head">
                        <h3 className="ad-card__title"><i className="fa fa-fire" aria-hidden="true"></i> Top Products</h3>
                        <Link to="/admin/analytics" className="ad-btn ad-btn--link">Analytics →</Link>
                    </div>
                    <div className="ad-card__body">
                        {!loading && (analytics.topProducts || []).length === 0 && (
                            <div className="ad-empty"><i className="fa fa-box-open" aria-hidden="true"></i><p>No sales data yet.</p></div>
                        )}
                        {(analytics.topProducts || []).slice(0, 6).map((p, i) => (
                            <div className="ad-list-item" key={i} style={{ padding: '0.7rem 0' }}>
                                <span className="ad-badge ad-badge--primary">{i + 1}</span>
                                <div style={{ minWidth: 0 }}>
                                    <div className="ad-td-strong" style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                                    <div className="ad-stat__label">{p.quantity} sold · {toINR(p.revenue)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
