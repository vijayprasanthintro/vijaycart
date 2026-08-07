import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getAnalytics } from '../../actions/analyticsActions';
import { AreaChart, DonutChart, Sparkline, toINR } from './Charts';
import { ORDER_STATUSES, statusBadge, statusColor } from '../../utils/orderStatuses';
import { productImage, imgOnError } from '../../utils/productHelper';

const pctDelta = series => {
    const vals = series.map(v => Number(v) || 0);
    if (vals.length < 2) return null;
    const first = vals[0];
    const last = vals[vals.length - 1];
    if (first <= 0) return null;
    return ((last - first) / first) * 100;
};

// Smooth count-up for KPI numbers.
function useCountUp(target, duration = 900) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        let raf;
        const from = 0;
        const start = performance.now();
        const tick = now => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setVal(from + (target - from) * eased);
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, duration]);
    return val;
}

function Kpi({ label, value, format = v => v.toLocaleString('en-IN'), sub, icon, tone, delta, spark, sparkColor, delay }) {
    const animated = useCountUp(Number(value) || 0);
    return (
        <div className="ad-kpi ad-anim" style={{ animationDelay: delay }}>
            <div className="ad-kpi__top">
                <div>
                    <div className="ad-kpi__label">{label}</div>
                    <div className="ad-kpi__value">{format(animated)}</div>
                    {sub && <div className="ad-kpi__sub">{sub}</div>}
                </div>
                <span className={`ad-kpi__icon ${tone}`}><i className={`fa ${icon}`} aria-hidden="true"></i></span>
            </div>
            {delta !== null && delta !== undefined && (
                <span className={`ad-kpi__delta ${delta >= 0 ? 'ad-kpi__delta--up' : 'ad-kpi__delta--down'}`}>
                    <i className={`fa ${delta >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`} aria-hidden="true"></i>
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% · 14d
                </span>
            )}
            {spark && spark.length > 1 && (
                <div className="ad-kpi__chart"><Sparkline data={spark} color={sparkColor} /></div>
            )}
        </div>
    );
}

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
    })).filter(s => s.value > 0);

    const orderTrend = analytics.orderTrend || [];
    const revenueSeries = orderTrend.map(d => d.revenue);
    const ordersSeries = orderTrend.map(d => d.orders);

    const totalOrders = analytics.totalOrders || 0;
    const revenue = analytics.revenue || 0;
    const avgOrder = totalOrders > 0 ? revenue / totalOrders : 0;
    const revDelta = pctDelta(revenueSeries);
    const ordDelta = pctDelta(ordersSeries);

    const lowStock = analytics.lowStockProducts || [];
    const topCustomers = analytics.topCustomers || [];
    const maxSpend = Math.max(1, ...topCustomers.map(c => Number(c.spend) || 0));

    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div>
            {/* Hero strip */}
            <div className="ad-hero ad-anim">
                <div>
                    <div className="ad-hero__title">Welcome back</div>
                    <div className="ad-hero__sub">Here's what's happening at your store · {today}</div>
                    <div className="ad-hero__stat">
                        <div><b>{toINR(revenue)}</b><span>Total Revenue</span></div>
                        <div><b>{totalOrders}</b><span>Orders</span></div>
                        <div><b>{analytics.customers || 0}</b><span>Customers</span></div>
                        <div><b>{analytics.totalProducts || 0}</b><span>Products</span></div>
                    </div>
                </div>
                <div className="ad-hero__actions">
                    <Link to="/admin/orders" className="ad-btn ad-btn--glass"><i className="fa fa-shopping-basket" aria-hidden="true"></i> Orders</Link>
                    <Link to="/admin/products/create" className="ad-btn ad-btn--white"><i className="fa fa-plus" aria-hidden="true"></i> New Product</Link>
                </div>
            </div>

            {loading && !analytics.totalOrders && (
                <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading dashboard…</div>
            )}

            {/* KPI cards */}
            <div className="ad-kpi-grid">
                <Kpi
                    label="Total Revenue"
                    value={revenue}
                    format={v => toINR(v)}
                    sub={`${toINR(analytics.paidRevenue)} collected · ${toINR(analytics.pendingRevenue)} in transit`}
                    icon="fa-indian-rupee" tone="ad-stat--primary"
                    delta={revDelta} spark={revenueSeries} sparkColor="var(--ad-primary)"
                    delay="0.05s"
                />
                <Kpi
                    label="Orders"
                    value={totalOrders}
                    sub={`${statusCounts['Pending'] || 0} pending · ${statusCounts['Delivered'] || 0} delivered`}
                    icon="fa-shopping-basket" tone="ad-stat--success"
                    delta={ordDelta} spark={ordersSeries} sparkColor="var(--ad-success)"
                    delay="0.1s"
                />
                <Kpi
                    label="Customers"
                    value={analytics.customers || 0}
                    sub={`${analytics.deliveryBoys || 0} delivery partners · ${analytics.totalUsers || 0} accounts`}
                    icon="fa-users" tone="ad-stat--info"
                    delay="0.15s"
                />
                <Kpi
                    label="Avg. Order Value"
                    value={avgOrder}
                    format={v => toINR(v)}
                    sub={`${analytics.returnRequests || 0} return requests · ${analytics.outOfStock || 0} out of stock`}
                    icon="fa-calculator" tone="ad-stat--violet"
                    delay="0.2s"
                />
            </div>

            {/* Health stats */}
            <div className="ad-stat-grid">
                <div className="ad-stat ad-stat--danger ad-anim ad-delay-1">
                    <div className="ad-stat__icon"><i className="fa fa-times-circle" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Out of Stock</div><div className="ad-stat__value">{analytics.outOfStock || 0}</div></div>
                </div>
                <div className="ad-stat ad-stat--warning ad-anim ad-delay-2">
                    <div className="ad-stat__icon"><i className="fa fa-exclamation-triangle" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Low Stock (≤5)</div><div className="ad-stat__value">{analytics.lowStock || 0}</div></div>
                </div>
                <div className="ad-stat ad-stat--success ad-anim ad-delay-3">
                    <div className="ad-stat__icon"><i className="fa fa-check-circle" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Collected</div><div className="ad-stat__value">{toINR(analytics.paidRevenue)}</div></div>
                </div>
                <div className="ad-stat ad-stat--info ad-anim ad-delay-4">
                    <div className="ad-stat__icon"><i className="fa fa-undo" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Return Requests</div><div className="ad-stat__value">{analytics.returnRequests || 0}</div></div>
                </div>
            </div>

            {/* Revenue analytics + sales charts */}
            <div className="ad-chart-row">
                <div className="ad-card ad-card--lift ad-anim ad-delay-1">
                    <div className="ad-card__head">
                        <h3 className="ad-card__title"><i className="fa fa-chart-area" aria-hidden="true"></i> Revenue Trend — Last 14 Days</h3>
                        <Link to="/admin/revenue" className="ad-btn ad-btn--link">Revenue →</Link>
                    </div>
                    <div className="ad-card__body">
                        <AreaChart
                            data={orderTrend.map(d => ({ label: d.label, value: d.revenue }))}
                            color="var(--ad-primary)"
                            format={v => toINR(v)}
                        />
                    </div>
                </div>
                <div className="ad-card ad-card--lift ad-anim ad-delay-2">
                    <div className="ad-card__head">
                        <h3 className="ad-card__title"><i className="fa fa-pie-chart" aria-hidden="true"></i> Orders by Status</h3>
                        <Link to="/admin/analytics" className="ad-btn ad-btn--link">Analytics →</Link>
                    </div>
                    <div className="ad-card__body">
                        <DonutChart segments={statusSegments} centerLabel="Orders" centerValue={totalOrders} />
                    </div>
                </div>
            </div>

            {/* Low stock + top products */}
            <div className="ad-split">
                <div className="ad-card ad-card--lift ad-anim ad-delay-2">
                    <div className="ad-card__head">
                        <h3 className="ad-card__title"><i className="fa fa-exclamation-triangle" aria-hidden="true"></i> Low Stock Alerts</h3>
                        <Link to="/admin/inventory" className="ad-btn ad-btn--link">Inventory →</Link>
                    </div>
                    <div className="ad-card__body ad-card__body--flush">
                        {!loading && lowStock.length === 0 && (
                            <div className="ad-empty ad-empty--small"><i className="fa fa-check-circle" aria-hidden="true"></i><p>All products sufficiently stocked.</p></div>
                        )}
                        {lowStock.slice(0, 8).map(p => (
                            <div className="ad-alert-item" key={p._id}>
                                <span className="ad-alert-item__icon ad-stat--warning"><i className="fa fa-box" aria-hidden="true"></i></span>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div className="ad-alert-item__name">{p.name}</div>
                                    <div className="ad-alert-item__meta">{p.category}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="ad-td-strong" style={{ fontSize: '0.82rem' }}>{toINR(p.price)}</div>
                                    <span className={`ad-badge ${p.stock === 0 ? 'ad-badge--danger' : 'ad-badge--warning'}`}>{p.stock === 0 ? 'Out' : `${p.stock} left`}</span>
                                </div>
                                <Link to={`/admin/product/${p._id}`} className="ad-btn ad-btn--ghost ad-btn--sm ad-btn--icon" title="Restock"><i className="fa fa-plus" aria-hidden="true"></i></Link>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="ad-card ad-card--lift ad-anim ad-delay-3">
                    <div className="ad-card__head">
                        <h3 className="ad-card__title"><i className="fa fa-fire" aria-hidden="true"></i> Top Products</h3>
                        <Link to="/admin/analytics" className="ad-btn ad-btn--link">Analytics →</Link>
                    </div>
                    <div className="ad-card__body">
                        {!loading && (analytics.topProducts || []).length === 0 && (
                            <div className="ad-empty"><i className="fa fa-box-open" aria-hidden="true"></i><p>No sales data yet.</p></div>
                        )}
                        {(analytics.topProducts || []).slice(0, 6).map((p, i) => {
                            const img = p.image && p.image.image ? productImage(p) : '';
                            return (
                                <div className="ad-list-item" key={i} style={{ padding: '0.7rem 0' }}>
                                    {img ? (
                                        <img src={img} alt={p.name} className="ad-avatar" style={{ width: 42, height: 42, borderRadius: 12 }} onError={imgOnError} />
                                    ) : (
                                        <span className="ad-avatar" style={{ width: 42, height: 42, borderRadius: 12 }}><i className="fa fa-box" aria-hidden="true"></i></span>
                                    )}
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div className="ad-td-strong" style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                                        <div className="ad-stat__label">{p.quantity} sold · {toINR(p.revenue)}</div>
                                    </div>
                                    <span className="ad-badge ad-badge--primary">{i + 1}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Customer analytics */}
            <div className="ad-card ad-card--lift ad-anim ad-delay-3">
                <div className="ad-card__head">
                    <h3 className="ad-card__title"><i className="fa fa-users" aria-hidden="true"></i> Customer Analytics</h3>
                    <Link to="/admin/users" className="ad-btn ad-btn--link">Users →</Link>
                </div>
                <div className="ad-card__body">
                    {!loading && topCustomers.length === 0 && (
                        <div className="ad-empty"><i className="fa fa-users" aria-hidden="true"></i><p>No customer spending data yet.</p></div>
                    )}
                    <div className="ad-form" style={{ gap: '0.9rem' }}>
                        {topCustomers.slice(0, 5).map((c, i) => (
                            <div className="ad-list-item" style={{ padding: '0.55rem 0' }} key={i}>
                                <span className="ad-avatar" style={{ borderRadius: 12 }}>{String(c.name || 'C')[0].toUpperCase()}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="ad-td-strong" style={{ fontSize: '0.82rem' }}>{c.name || 'Customer'}</div>
                                    <div className="ad-progress" style={{ marginTop: '0.4rem' }}>
                                        <div className="ad-progress__fill" style={{ width: `${(Number(c.spend) || 0) / maxSpend * 100}%` }}></div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="ad-td-strong">{toINR(c.spend)}</div>
                                    <div className="ad-stat__label">{i === 0 ? 'Top spender' : `${c.orders || 0} orders`}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Latest orders */}
            <div className="ad-card ad-card--lift ad-anim ad-delay-4">
                <div className="ad-card__head">
                    <h3 className="ad-card__title"><i className="fa fa-clock-o" aria-hidden="true"></i> Latest Orders</h3>
                    <Link to="/admin/orders" className="ad-btn ad-btn--primary ad-btn--sm"><i className="fa fa-eye" aria-hidden="true"></i> View All</Link>
                </div>
                <div className="ad-card__body ad-card__body--flush">
                    {!loading && (analytics.recentOrders || []).length === 0 && (
                        <div className="ad-empty"><i className="fa fa-inbox" aria-hidden="true"></i><p>No orders yet.</p></div>
                    )}
                    {(analytics.recentOrders || []).length > 0 && (
                        <div className="ad-table-wrap">
                            <table className="ad-table">
                                <thead>
                                    <tr>
                                        <th>Order</th>
                                        <th>Customer</th>
                                        <th>Status</th>
                                        <th>Payment</th>
                                        <th>Total</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(analytics.recentOrders || []).slice(0, 8).map(order => (
                                        <tr key={order._id}>
                                            <td><span className="ad-td-mono">#{order._id.slice(-8).toUpperCase()}</span></td>
                                            <td>
                                                <div className="ad-td-strong">{order.shippingInfo?.name || order.user?.name || '—'}</div>
                                                <div className="ad-stat__label">{order.shippingInfo?.city || ''}</div>
                                            </td>
                                            <td>
                                                <span className={`ad-badge ${statusBadge(order.orderStatus)}`}>
                                                    <span className="ad-badge__dot"></span>{order.orderStatus}
                                                </span>
                                            </td>
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
                                            <td><span className="ad-td-strong">{toINR(order.totalPrice)}</span></td>
                                            <td>
                                                <Link to={`/admin/order/${order._id}`} className="ad-btn ad-btn--ghost ad-btn--sm"><i className="fa fa-eye" aria-hidden="true"></i> View</Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
