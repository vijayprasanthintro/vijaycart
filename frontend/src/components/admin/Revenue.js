import { Fragment, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAnalytics } from '../../actions/analyticsActions';
import { BarChart, DonutChart, toINR } from './Charts';
import { statusColor } from '../../utils/orderStatuses';

export default function Revenue() {
    const { analytics, loading } = useSelector(state => state.analyticsState);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(getAnalytics());
    }, [dispatch]);

    const statusRevenueSegments = Object.entries(analytics.statusRevenue || {}).map(([label, value]) => ({
        label, value, color: statusColor(label)
    }));

    const revenueTrend = (analytics.orderTrend || []).map(d => ({ label: d.label, value: d.revenue }));

    const totalOrders = analytics.totalOrders || 0;
    const avgOrder = totalOrders > 0 ? (analytics.revenue || 0) / totalOrders : 0;

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Revenue</h1>
                    <p>Earnings &amp; payment insights</p>
                </div>
            </div>

            {loading && !analytics.totalOrders && (
                <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading revenue…</div>
            )}

            <div className="ad-stat-grid">
                <div className="ad-stat ad-stat--primary">
                    <div className="ad-stat__icon"><i className="fa fa-indian-rupee" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Gross Revenue</div><div className="ad-stat__value">{toINR(analytics.revenue)}</div></div>
                </div>
                <div className="ad-stat ad-stat--success">
                    <div className="ad-stat__icon"><i className="fa fa-check-circle" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Collected (Delivered)</div><div className="ad-stat__value">{toINR(analytics.paidRevenue)}</div></div>
                </div>
                <div className="ad-stat ad-stat--warning">
                    <div className="ad-stat__icon"><i className="fa fa-hourglass-half" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Pending (In Transit)</div><div className="ad-stat__value">{toINR(analytics.pendingRevenue)}</div></div>
                </div>
                <div className="ad-stat">
                    <div className="ad-stat__icon"><i className="fa fa-calculator" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Avg. Order Value</div><div className="ad-stat__value">{toINR(avgOrder)}</div></div>
                </div>
            </div>

            <div className="ad-chart-row">
                <div className="ad-card">
                    <div className="ad-card__head"><h3 className="ad-card__title"><i className="fa fa-chart-bar" aria-hidden="true"></i> Revenue — Last 14 Days</h3></div>
                    <div className="ad-card__body"><BarChart data={revenueTrend} alt /></div>
                </div>
                <div className="ad-card">
                    <div className="ad-card__head"><h3 className="ad-card__title"><i className="fa fa-pie-chart" aria-hidden="true"></i> Revenue by Status</h3></div>
                    <div className="ad-card__body"><DonutChart segments={statusRevenueSegments} centerLabel="Revenue" centerValue={toINR(analytics.revenue)} /></div>
                </div>
            </div>

            <div className="ad-card">
                <div className="ad-card__head"><h3 className="ad-card__title"><i className="fa fa-indian-rupee" aria-hidden="true"></i> Revenue Breakdown</h3></div>
                <div className="ad-card__body">
                    <div className="ad-form" style={{ gap: '0.6rem' }}>
                        {Object.entries(analytics.statusRevenue || {}).map(([label, value]) => {
                            const pct = analytics.revenue > 0 ? ((value / analytics.revenue) * 100).toFixed(1) : 0;
                            return (
                                <div className="ad-list-item" style={{ padding: '0.55rem 0' }} key={label}>
                                    <span className="ad-legend__dot" style={{ background: statusColor(label) }}></span>
                                    <span className="ad-td-strong">{label}</span>
                                    <span className="ad-stat__label">{analytics.statusCounts?.[label] || 0} orders</span>
                                    <span style={{ marginLeft: 'auto', minWidth: 160 }}>
                                        <span className="ad-td-strong">{toINR(value)}</span> <span className="ad-stat__label">({pct}%)</span>
                                    </span>
                                </div>
                            );
                        })}
                        {!loading && Object.keys(analytics.statusRevenue || {}).length === 0 && (
                            <div className="ad-empty"><i className="fa fa-inbox" aria-hidden="true"></i><p>No revenue data yet.</p></div>
                        )}
                    </div>
                </div>
            </div>
        </Fragment>
    );
}
