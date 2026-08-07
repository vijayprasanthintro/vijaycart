import { Fragment, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAnalytics } from '../../actions/analyticsActions';
import { BarChart, DonutChart, toINR } from './Charts';
import { statusColor } from '../../utils/orderStatuses';

export default function Analytics() {
    const { analytics, loading } = useSelector(state => state.analyticsState);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(getAnalytics());
    }, [dispatch]);

    const statusSegments = Object.entries(analytics.statusCounts || {}).map(([label, value]) => ({
        label, value, color: statusColor(label)
    }));

    const orderTrend = (analytics.orderTrend || []).map(d => ({ label: d.label, value: d.orders }));
    const revenueTrend = (analytics.orderTrend || []).map(d => ({ label: d.label, value: d.revenue }));
    const categories = (analytics.categoryDistribution || []).slice(0, 10).map(c => ({ label: c.name, value: c.count }));
    const maxTop = Math.max(1, ...(analytics.topProducts || []).map(p => p.quantity));

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Analytics</h1>
                    <p>Orders, traffic &amp; catalogue insights</p>
                </div>
            </div>

            {loading && !analytics.totalOrders && (
                <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading analytics…</div>
            )}

            <div className="ad-stat-grid">
                <div className="ad-stat ad-stat--success">
                    <div className="ad-stat__icon"><i className="fa fa-shopping-basket" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Total Orders</div><div className="ad-stat__value">{analytics.totalOrders || 0}</div></div>
                </div>
                <div className="ad-stat ad-stat--primary">
                    <div className="ad-stat__icon"><i className="fa fa-indian-rupee" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Revenue (14d)</div><div className="ad-stat__value">{toINR(revenueTrend.reduce((s, d) => s + d.value, 0))}</div></div>
                </div>
                <div className="ad-stat ad-stat--warning">
                    <div className="ad-stat__icon"><i className="fa fa-box" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Products</div><div className="ad-stat__value">{analytics.totalProducts || 0}</div></div>
                </div>
                <div className="ad-stat ad-stat--danger">
                    <div className="ad-stat__icon"><i className="fa fa-exclamation-triangle" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Return Requests</div><div className="ad-stat__value">{analytics.returnRequests || 0}</div></div>
                </div>
            </div>

            <div className="ad-chart-row">
                <div className="ad-card">
                    <div className="ad-card__head"><h3 className="ad-card__title"><i className="fa fa-chart-bar" aria-hidden="true"></i> Orders — Last 14 Days</h3></div>
                    <div className="ad-card__body"><BarChart data={orderTrend} /></div>
                </div>
                <div className="ad-card">
                    <div className="ad-card__head"><h3 className="ad-card__title"><i className="fa fa-pie-chart" aria-hidden="true"></i> Orders by Status</h3></div>
                    <div className="ad-card__body"><DonutChart segments={statusSegments} centerLabel="Orders" centerValue={analytics.totalOrders || 0} /></div>
                </div>
            </div>

            <div className="ad-chart-row">
                <div className="ad-card">
                    <div className="ad-card__head"><h3 className="ad-card__title"><i className="fa fa-indian-rupee" aria-hidden="true"></i> Revenue — Last 14 Days</h3></div>
                    <div className="ad-card__body"><BarChart data={revenueTrend} alt /></div>
                </div>
                <div className="ad-card">
                    <div className="ad-card__head"><h3 className="ad-card__title"><i className="fa fa-th-large" aria-hidden="true"></i> Catalogue by Category</h3></div>
                    <div className="ad-card__body"><BarChart data={categories} /></div>
                </div>
            </div>

            <div className="ad-card">
                <div className="ad-card__head"><h3 className="ad-card__title"><i className="fa fa-fire" aria-hidden="true"></i> Top Selling Products</h3></div>
                <div className="ad-card__body">
                    {!loading && (analytics.topProducts || []).length === 0 && (
                        <div className="ad-empty"><i className="fa fa-box-open" aria-hidden="true"></i><p>No sales data yet.</p></div>
                    )}
                    <div className="ad-form" style={{ gap: '0.9rem' }}>
                        {(analytics.topProducts || []).map((p, i) => (
                            <div key={i}>
                                <div className="ad-list-item" style={{ padding: '0.45rem 0' }}>
                                    <span className="ad-badge ad-badge--primary">{i + 1}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="ad-td-strong" style={{ fontSize: '0.82rem' }}>{p.name}</div>
                                        <div className="ad-progress" style={{ marginTop: '0.35rem' }}>
                                            <div className="ad-progress__fill" style={{ width: `${(p.quantity / maxTop) * 100}%` }}></div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div className="ad-td-strong">{p.quantity} sold</div>
                                        <div className="ad-stat__label">{toINR(p.revenue)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Fragment>
    );
}
