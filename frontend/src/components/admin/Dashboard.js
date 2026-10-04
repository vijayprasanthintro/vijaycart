import { useEffect, useState, useId } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getAnalytics } from '../../actions/analyticsActions';
import { AreaChart, DonutChart, Sparkline, toINR, RangeTabs } from './Charts';
import { ORDER_STATUSES, statusBadge, statusColor } from '../../utils/orderStatuses';
import { resolveProductImage, imgOnError } from '../../utils/productHelper';

const RANGE_LABELS = { '7': '7D', '14': '14D', '30': '30D', '90': '3M', '180': '6M', '365': '1Y' };

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

function Kpi({ label, value, format = v => v.toLocaleString('en-IN'), sub, icon, tone, delta, spark, sparkColor, delay, rangeLabel = '14d' }) {
    const animated = useCountUp(Number(value) || 0);
    return (
        <div className="ad-kpi ad-anim" style={{ animationDelay: delay }}>
            <div className="ad-kpi__top">
                <div>
                    <div className="ad-kpi__label">{label}</div>
                    <div className="ad-kpi__value ad-num">{format(animated)}</div>
                    {sub && <div className="ad-kpi__sub">{sub}</div>}
                </div>
                <span className={`ad-kpi__icon ${tone}`}><i className={`fa ${icon}`} aria-hidden="true"></i></span>
            </div>
            {delta !== null && delta !== undefined && (
                <span className={`ad-kpi__delta ${delta >= 0 ? 'ad-kpi__delta--up' : 'ad-kpi__delta--down'}`}>
                    <i className={`fa ${delta >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`} aria-hidden="true"></i>
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% · {rangeLabel}
                </span>
            )}
            {spark && spark.length > 1 && (
                <div className="ad-kpi__chart"><Sparkline data={spark} color={sparkColor} /></div>
            )}
        </div>
    );
}

// Compact "x ago" time for the activity feed.
function timeAgo(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 0) return 'just now';
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// Minimal rocket illustration for the growth card.
function Rocket() {
    const uid = useId().replace(/:/g, '');
    return (
        <svg viewBox="0 0 64 64" className="ad-rocket" width="52" height="52" aria-hidden="true">
            <defs>
                <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="var(--ad-primary)" />
                </linearGradient>
                <linearGradient id={`${uid}-flame`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb641b" />
                    <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
            </defs>
            <g className="ad-rocket__flame">
                <path d="M26 46 Q32 62 38 46 Z" fill={`url(#${uid}-flame)`} />
                <path d="M29 46 Q32 55 35 46 Z" fill="#ffd166" />
            </g>
            <path d="M21 30 L13 38 L22 38 Z" fill="var(--ad-violet)" />
            <path d="M43 30 L51 38 L42 38 Z" fill="var(--ad-violet)" />
            <path d="M32 5 C23 17 21 26 21 34 a11 11 0 0 0 22 0 C43 26 41 17 32 5 Z" fill={`url(#${uid}-body)`} />
            <circle cx="32" cy="29" r="5.5" fill="#fff" opacity="0.92" />
            <circle cx="33.2" cy="27.8" r="2" fill="var(--ad-primary)" opacity="0.85" />
        </svg>
    );
}

// Loading placeholders
function Skeleton({ h = 14, w = '100%', mb = 10, r = 10 }) {
    return <div className="ad-skeleton" style={{ height: h, width: w, marginBottom: mb, borderRadius: r }}></div>;
}

function KpiSkeleton() {
    return (
        <div className="ad-kpi">
            <div className="ad-kpi__top">
                <div style={{ flex: 1 }}>
                    <Skeleton h={10} w="55%" mb={8} />
                    <Skeleton h={22} w="72%" mb={7} />
                    <Skeleton h={10} w="85%" mb={0} />
                </div>
                <span className="ad-skeleton" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0 }}></span>
            </div>
            <div style={{ marginTop: 12 }}><Skeleton h={9} w="38%" mb={0} /></div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div>
            <div className="ad-hero" style={{ minHeight: 185 }}>
                <div className="ad-hero__glow ad-hero__glow--1"></div>
                <div className="ad-hero__glow ad-hero__glow--2"></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <Skeleton h={14} w={200} mb={12} />
                    <Skeleton h={24} w={270} mb={10} />
                    <Skeleton h={12} w={230} mb={22} />
                    <div style={{ display: 'flex', gap: 28 }}>
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} style={{ width: 110 }}>
                                <Skeleton h={18} w="82%" mb={5} />
                                <Skeleton h={10} w="62%" mb={0} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="ad-kpi-grid">
                {[0, 1, 2, 3].map(i => <KpiSkeleton key={i} />)}
            </div>
            <div className="ad-chart-row">
                <div className="ad-card"><div className="ad-card__body" style={{ padding: 20 }}><Skeleton h={230} mb={0} /></div></div>
                <div className="ad-card"><div className="ad-card__body" style={{ padding: 20 }}><Skeleton h={230} mb={0} /></div></div>
            </div>
        </div>
    );
}

const QUICK_ACTIONS = [
    { to: '/admin/products/create', icon: 'fa-plus', label: 'New Product', tone: 'ad-stat--primary' },
    { to: '/admin/orders', icon: 'fa-shopping-basket', label: 'View Orders', tone: 'ad-stat--info' },
    { to: '/admin/categories', icon: 'fa-th-large', label: 'New Category', tone: 'ad-stat--violet' },
    { to: '/admin/coupons', icon: 'fa-ticket', label: 'New Coupon', tone: 'ad-stat--warning' },
    { to: '/admin/users', icon: 'fa-users', label: 'Manage Users', tone: 'ad-stat--success' },
    { to: '/', icon: 'fa-globe', label: 'View Store', tone: 'ad-stat--danger' }
];

function GrowthRow({ icon, label, value }) {
    const up = value !== null && value >= 0;
    const down = value !== null && value < 0;
    return (
        <div className="ad-growth__row">
            <span className="ad-growth__row-icon"><i className={`fa ${icon}`} aria-hidden="true"></i></span>
            <span className="ad-growth__row-label">{label}</span>
            <span className={`ad-growth__row-val ${down ? 'ad-growth__row-val--down' : up ? 'ad-growth__row-val--up' : ''}`}>
                {value === null ? '—' : `${up ? '+' : ''}${value.toFixed(1)}%`}
                {value !== null && <i className={`fa ${up ? 'fa-arrow-up' : 'fa-arrow-down'}`} aria-hidden="true"></i>}
            </span>
        </div>
    );
}

export default function Dashboard() {
    const { analytics, loading } = useSelector(state => state.analyticsState);
    const { user } = useSelector(state => state.authState);
    const dispatch = useDispatch();
    const [range, setRange] = useState('14');

    useEffect(() => {
        dispatch(getAnalytics(range));
    }, [dispatch, range]);

    const hasData = analytics.totalOrders !== undefined;

    const statusCounts = analytics.statusCounts || {};
    const statusSegments = ORDER_STATUSES.map(status => ({
        label: status,
        value: statusCounts[status] || 0,
        color: statusColor(status)
    })).filter(s => s.value > 0);

    const orderTrend = analytics.orderTrend || [];
    const revenueSeries = orderTrend.map(d => d.revenue);
    const ordersSeries = orderTrend.map(d => d.orders);
    const aovSeries = orderTrend.filter(d => d.orders > 0).map(d => d.revenue / d.orders);

    const totalOrders = analytics.totalOrders || 0;
    const revenue = analytics.revenue || 0;
    const avgOrder = totalOrders > 0 ? revenue / totalOrders : 0;
    const revDelta = pctDelta(revenueSeries);
    const ordDelta = pctDelta(ordersSeries);
    const aovDelta = pctDelta(aovSeries);

    const rangeRevenue = orderTrend.reduce((s, d) => s + (Number(d.revenue) || 0), 0);
    const rangeOrders = orderTrend.reduce((s, d) => s + (Number(d.orders) || 0), 0);
    const rangeLabel = RANGE_LABELS[range] || '14D';

    const lowStock = analytics.lowStockProducts || [];
    const topCustomers = analytics.topCustomers || [];
    const maxSpend = Math.max(1, ...topCustomers.map(c => Number(c.spend) || 0));

    //Live activity feed: recent orders, stock alerts and new signups blended
    //into one scrollable list (all from real data).
    const activityItems = [];
    (analytics.recentOrders || []).slice(0, 6).forEach(o => activityItems.push({
        id: 'o' + o._id,
        icon: 'fa-shopping-basket',
        tone: 'ad-stat--info',
        title: `New order from ${o.shippingInfo?.name || o.user?.name || 'customer'}`,
        sub: `${toINR(o.totalPrice)} · #${o._id.slice(-8).toUpperCase()}`,
        time: timeAgo(o.createdAt)
    }));
    lowStock.slice(0, 3).forEach(p => activityItems.push({
        id: 'p' + p._id,
        icon: 'fa-exclamation-triangle',
        tone: 'ad-stat--warning',
        title: `${p.name} running low`,
        sub: p.stock === 0 ? 'Out of stock' : `${p.stock} / ${p.threshold || 5} left`,
        time: 'Live'
    }));
    (analytics.recentUsers || []).forEach(u => activityItems.push({
        id: 'u' + u._id,
        icon: 'fa-user-plus',
        tone: 'ad-stat--success',
        title: `${u.name || 'A customer'} created an account`,
        sub: u.email || 'New signup',
        time: timeAgo(u.createdAt)
    }));

    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    const firstName = (user?.name || 'Admin').split(' ')[0];
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    if (loading && !hasData) return <DashboardSkeleton />;

    return (
        <div>
            {/* Hero strip */}
            <div className="ad-hero ad-anim">
                <div className="ad-hero__glow ad-hero__glow--1"></div>
                <div className="ad-hero__glow ad-hero__glow--2"></div>
                <div className="ad-hero__sheen"></div>
                <div>
                    <div className="ad-hero__chip"><i className="fa fa-circle" aria-hidden="true"></i> LIVE · {today}</div>
                    <div className="ad-hero__title">{greeting}, {firstName}</div>
                    <div className="ad-hero__sub">Here's what's happening at your store today</div>
                    <div className="ad-hero__stat">
                        <div><b className="ad-num">{toINR(revenue)}</b><span>Total Revenue</span></div>
                        <div><b className="ad-num">{totalOrders}</b><span>Orders</span></div>
                        <div><b className="ad-num">{analytics.customers || 0}</b><span>Customers</span></div>
                        <div><b className="ad-num">{analytics.totalProducts || 0}</b><span>Products</span></div>
                    </div>
                </div>
                <div className="ad-hero__actions">
                    <Link to="/admin/orders" className="ad-btn ad-btn--glass"><i className="fa fa-shopping-basket" aria-hidden="true"></i> Orders</Link>
                    <Link to="/admin/banners" className="ad-btn ad-btn--glass"><i className="fa fa-image" aria-hidden="true"></i> Banners</Link>
                    <Link to="/admin/products/create" className="ad-btn ad-btn--white"><i className="fa fa-plus" aria-hidden="true"></i> New Product</Link>
                </div>
            </div>

            {loading && hasData && <div className="ad-refresh-bar"><div className="ad-refresh-bar__fill"></div></div>}

            {/* Quick actions */}
            <div className="ad-card ad-card--lift ad-anim" style={{ animationDelay: '0.03s' }}>
                <div className="ad-card__head">
                    <h3 className="ad-card__title"><i className="fa fa-bolt" aria-hidden="true"></i> Quick Actions</h3>
                </div>
                <div className="ad-card__body">
                    <div className="ad-quick-grid">
                        {QUICK_ACTIONS.map(a => (
                            <Link key={a.to} to={a.to} className="ad-quick-item">
                                <span className={`ad-quick-item__icon ${a.tone}`}><i className={`fa ${a.icon}`} aria-hidden="true"></i></span>
                                <span className="ad-quick-item__label">{a.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* KPI cards */}
            <div className="ad-kpi-grid">
                <Kpi
                    label="Total Revenue"
                    value={revenue}
                    format={v => toINR(v)}
                    sub={`${toINR(analytics.paidRevenue)} collected · ${toINR(analytics.pendingRevenue)} in transit`}
                    icon="fa-rupee" tone="ad-stat--primary"
                    delta={revDelta} spark={revenueSeries} sparkColor="var(--ad-primary)"
                    rangeLabel={rangeLabel} delay="0.05s"
                />
                <Kpi
                    label="Orders"
                    value={totalOrders}
                    sub={`${statusCounts['Pending'] || 0} pending · ${analytics.completedOrders || 0} completed`}
                    icon="fa-shopping-basket" tone="ad-stat--success"
                    delta={ordDelta} spark={ordersSeries} sparkColor="var(--ad-success)"
                    rangeLabel={rangeLabel} delay="0.1s"
                />
                <Kpi
                    label="Customers"
                    value={analytics.customers || 0}
                    sub={`${analytics.deliveryBoys || 0} delivery partners · ${analytics.totalUsers || 0} accounts`}
                    icon="fa-users" tone="ad-stat--info"
                    delay="0.15s"
                />
                <Kpi
                    label="Products"
                    value={analytics.totalProducts || 0}
                    sub={`${analytics.lowStock || 0} low on stock · ${analytics.outOfStock || 0} out of stock`}
                    icon="fa-cube" tone="ad-stat--violet"
                    delay="0.2s"
                />
            </div>

            {/* Sales period */}
            <div className="ad-stat-grid">
                <div className="ad-stat ad-stat--primary ad-anim ad-delay-1">
                    <div className="ad-stat__icon"><i className="fa fa-sun-o" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Today's Sales</div><div className="ad-stat__value ad-num">{toINR(analytics.todayRevenue)}</div><div className="ad-stat__sub">{analytics.todayOrders || 0} orders today</div></div>
                </div>
                <div className="ad-stat ad-stat--info ad-anim ad-delay-2">
                    <div className="ad-stat__icon"><i className="fa fa-calendar-o" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">This Week</div><div className="ad-stat__value ad-num">{toINR(analytics.weekRevenue)}</div><div className="ad-stat__sub">{analytics.weekOrders || 0} orders · last 7 days</div></div>
                </div>
                <div className="ad-stat ad-stat--violet ad-anim ad-delay-3">
                    <div className="ad-stat__icon"><i className="fa fa-calendar" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">This Month</div><div className="ad-stat__value ad-num">{toINR(analytics.monthRevenue)}</div><div className="ad-stat__sub">{analytics.monthOrders || 0} orders · last 30 days</div></div>
                </div>
                <div className="ad-stat ad-stat--success ad-anim ad-delay-4">
                    <div className="ad-stat__icon"><i className="fa fa-calculator" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Avg. Order Value</div><div className="ad-stat__value ad-num">{toINR(avgOrder, 2)}</div><div className="ad-stat__sub">{totalOrders} total orders</div></div>
                </div>
            </div>

            {/* Order health */}
            <div className="ad-stat-grid">
                <div className="ad-stat ad-stat--warning ad-anim ad-delay-1">
                    <div className="ad-stat__icon"><i className="fa fa-hourglass-half" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Pending Orders</div><div className="ad-stat__value ad-num">{statusCounts['Pending'] || 0}</div><div className="ad-stat__sub">awaiting confirmation</div></div>
                </div>
                <div className="ad-stat ad-stat--success ad-anim ad-delay-2">
                    <div className="ad-stat__icon"><i className="fa fa-check-circle" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Completed Orders</div><div className="ad-stat__value ad-num">{analytics.completedOrders || 0}</div><div className="ad-stat__sub">delivered</div></div>
                </div>
                <div className="ad-stat ad-stat--danger ad-anim ad-delay-3">
                    <div className="ad-stat__icon"><i className="fa fa-times-circle" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Cancelled Orders</div><div className="ad-stat__value ad-num">{analytics.cancelledOrders || 0}</div><div className="ad-stat__sub">all sources</div></div>
                </div>
                    <div className="ad-stat ad-stat--info ad-anim ad-delay-4">
                        <div className="ad-stat__icon"><i className="fa fa-exclamation-triangle" aria-hidden="true"></i></div>
                        <div><div className="ad-stat__label">Low Stock (≤{analytics.lowStockThreshold || 5})</div><div className="ad-stat__value ad-num">{analytics.lowStock || 0}</div><div className="ad-stat__sub">{analytics.outOfStock || 0} out of stock</div></div>
                    </div>
            </div>

            {/* Revenue analytics + growth */}
            <div className="ad-chart-row">
                <div className="ad-card ad-card--lift ad-anim ad-delay-1">
                    <div className="ad-card__head">
                        <h3 className="ad-card__title"><i className="fa fa-area-chart" aria-hidden="true"></i> Revenue Trend — Last {rangeLabel}</h3>
                        <div className="ad-card__tools">
                            <RangeTabs value={range} onChange={setRange} />
                            <Link to="/admin/revenue" className="ad-btn ad-btn--link">Revenue →</Link>
                        </div>
                    </div>
                    <div className="ad-card__body">
                        <AreaChart
                            data={orderTrend.map(d => ({ label: d.label, value: d.revenue }))}
                            color="var(--ad-primary)"
                            format={v => toINR(v)}
                            travel
                        />
                        <div className="ad-range-summary">
                            <span><b className="ad-num">{toINR(rangeRevenue)}</b> revenue · last {rangeLabel}</span>
                            <span><b className="ad-num">{rangeOrders}</b> orders · last {rangeLabel}</span>
                        </div>
                    </div>
                </div>
                <div className="ad-card ad-card--lift ad-anim ad-delay-2">
                    <div className="ad-card__head">
                        <h3 className="ad-card__title"><i className="fa fa-rocket" aria-hidden="true"></i> Business Growth</h3>
                    </div>
                    <div className="ad-card__body">
                        <div className="ad-growth">
                            <div className="ad-growth__top">
                                <Rocket />
                                <div className="ad-growth__copy">
                                    <div className="ad-growth__title">Growth vs start of {rangeLabel}</div>
                                    <div className="ad-growth__sub">{today}</div>
                                </div>
                            </div>
                            <GrowthRow icon="fa-rupee" label="Revenue" value={revDelta} />
                            <GrowthRow icon="fa-shopping-basket" label="Orders" value={ordDelta} />
                            <GrowthRow icon="fa-calculator" label="Avg order value" value={aovDelta} />
                            <Link to="/admin/analytics" className="ad-btn ad-btn--soft ad-btn--sm ad-growth__cta">View Insights <i className="fa fa-arrow-right" aria-hidden="true"></i></Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Donut + top products */}
            <div className="ad-split ad-split--half">
                <div className="ad-card ad-card--lift ad-anim ad-delay-2">
                    <div className="ad-card__head">
                        <h3 className="ad-card__title"><i className="fa fa-pie-chart" aria-hidden="true"></i> Orders by Status</h3>
                        <Link to="/admin/analytics" className="ad-btn ad-btn--link">Analytics →</Link>
                    </div>
                    <div className="ad-card__body">
                        <DonutChart segments={statusSegments} centerLabel="Total Orders" centerValue={totalOrders} />
                    </div>
                </div>

                <div className="ad-card ad-card--lift ad-anim ad-delay-3">
                    <div className="ad-card__head">
                        <h3 className="ad-card__title"><i className="fa fa-fire" aria-hidden="true"></i> Top Products</h3>
                        <Link to="/admin/products" className="ad-btn ad-btn--link">Products →</Link>
                    </div>
                    <div className="ad-card__body">
                        {!loading && (analytics.topProducts || []).length === 0 && (
                            <div className="ad-empty"><i className="fa fa-archive" aria-hidden="true"></i><p>No sales data yet.</p></div>
                        )}
                        {(analytics.topProducts || []).slice(0, 6).map((p, i) => (
                            <div className="ad-list-item" key={i} style={{ padding: '0.7rem 0' }}>
                                <img src={resolveProductImage(p.image)} alt={p.name} className="ad-avatar ad-top-img" onError={imgOnError} />
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div className="ad-td-strong ad-top-name" style={{ fontSize: '0.8rem' }}>{p.name}</div>
                                    <div className="ad-stat__label">{p.quantity} sold · {toINR(p.revenue)}</div>
                                </div>
                                <span className="ad-badge ad-badge--primary">{i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Low stock + customer analytics */}
            <div className="ad-split">
                <div className="ad-card ad-card--lift ad-anim ad-delay-3">
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
                                <img src={resolveProductImage(p.image)} alt={p.name} className="ad-alert-item__img" onError={imgOnError} />
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div className="ad-alert-item__name">{p.name}</div>
                                    <div className="ad-alert-item__meta">{p.category}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="ad-td-strong ad-num" style={{ fontSize: '0.82rem' }}>{toINR(p.price)}</div>
                                    <span className={`ad-badge ${p.stock === 0 ? 'ad-badge--danger' : 'ad-badge--warning'}`}>{p.stock === 0 ? 'Out of stock' : `${p.stock} / ${p.threshold || 5} left`}</span>
                                </div>
                                <Link to={`/admin/product/${p._id}`} className="ad-btn ad-btn--ghost ad-btn--sm ad-btn--icon" title="Restock"><i className="fa fa-plus" aria-hidden="true"></i></Link>
                            </div>
                        ))}
                    </div>
                </div>

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
                                        <div className="ad-td-strong ad-num">{toINR(c.spend)}</div>
                                        <div className="ad-stat__label">{i === 0 ? 'Top spender' : `${c.orders || 0} orders`}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Live activity + recent customers */}
            <div className="ad-split">
                <div className="ad-card ad-card--lift ad-anim ad-delay-4">
                    <div className="ad-card__head">
                        <h3 className="ad-card__title"><i className="fa fa-bolt" aria-hidden="true"></i> Live Activity</h3>
                        <Link to="/admin/orders" className="ad-btn ad-btn--link">Orders →</Link>
                    </div>
                    <div className="ad-card__body ad-card__body--flush">
                        {!loading && activityItems.length === 0 && (
                            <div className="ad-empty ad-empty--small"><i className="fa fa-check-circle" aria-hidden="true"></i><p>No recent activity yet.</p></div>
                        )}
                        {activityItems.slice(0, 9).map(item => (
                            <div className="ad-activity" key={item.id}>
                                <span className={`ad-activity__dot ${item.tone}`}><i className={`fa ${item.icon}`} aria-hidden="true"></i></span>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div className="ad-activity__title">{item.title}</div>
                                    <div className="ad-activity__sub">{item.sub}</div>
                                </div>
                                <span className="ad-activity__time">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="ad-card ad-card--lift ad-anim ad-delay-4">
                    <div className="ad-card__head">
                        <h3 className="ad-card__title"><i className="fa fa-user-plus" aria-hidden="true"></i> Recent Customers</h3>
                        <Link to="/admin/users" className="ad-btn ad-btn--link">Users →</Link>
                    </div>
                    <div className="ad-card__body ad-card__body--flush">
                        {!loading && (analytics.recentUsers || []).length === 0 && (
                            <div className="ad-empty ad-empty--small"><i className="fa fa-users" aria-hidden="true"></i><p>No new signups yet.</p></div>
                        )}
                        {(analytics.recentUsers || []).map(u => (
                            <div className="ad-list-item" key={u._id} style={{ padding: '0.6rem 0' }}>
                                {u.avatar ? (
                                    <img src={u.avatar} alt={u.name} className="ad-avatar" style={{ borderRadius: 12 }} onError={imgOnError} />
                                ) : (
                                    <span className="ad-avatar" style={{ borderRadius: 12 }}>{String(u.name || 'U')[0].toUpperCase()}</span>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="ad-td-strong" style={{ fontSize: '0.82rem' }}>{u.name || 'Customer'}</div>
                                    <div className="ad-stat__label">{u.email || 'New account'}</div>
                                </div>
                                <span className="ad-activity__time">{timeAgo(u.createdAt)}</span>
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
                                        <th className="ad-td-num">Total</th>
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
                                            <td className="ad-td-num"><span className="ad-td-strong">{toINR(order.totalPrice)}</span></td>
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
