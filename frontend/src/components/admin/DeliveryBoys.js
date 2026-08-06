import { Fragment, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getDeliveryBoys } from '../../actions/deliveryActions';
import { adminOrders as adminOrdersAction } from '../../actions/orderActions';

export default function DeliveryBoys() {
    const { deliveryBoys = [], loading } = useSelector(state => state.deliveryState);
    const { adminOrders = [] } = useSelector(state => state.orderState);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(getDeliveryBoys);
        dispatch(adminOrdersAction());
    }, [dispatch]);

    const stats = id => {
        const mine = adminOrders.filter(o => String(o.deliveryBoy) === String(id));
        return {
            assigned: mine.length,
            outForDelivery: mine.filter(o => o.orderStatus === 'Out for Delivery').length,
            delivered: mine.filter(o => o.orderStatus === 'Delivered').length
        };
    };

    const unassigned = adminOrders.filter(o => !o.deliveryBoy && o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Delivered').length;

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Delivery Boys</h1>
                    <p>{deliveryBoys.length} partners · {unassigned} unassigned active orders</p>
                </div>
                <Link to="/admin/delivery" className="ad-btn ad-btn--primary"><i className="fa fa-motorcycle" aria-hidden="true"></i> Assign Orders</Link>
            </div>

            <div className="ad-stat-grid">
                <div className="ad-stat ad-stat--primary">
                    <div className="ad-stat__icon"><i className="fa fa-motorcycle" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Delivery Partners</div><div className="ad-stat__value">{deliveryBoys.length}</div></div>
                </div>
                <div className="ad-stat ad-stat--warning">
                    <div className="ad-stat__icon"><i className="fa fa-hourglass-half" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Unassigned Active</div><div className="ad-stat__value">{unassigned}</div></div>
                </div>
                <div className="ad-stat ad-stat--success">
                    <div className="ad-stat__icon"><i className="fa fa-check-circle" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Delivered Orders</div><div className="ad-stat__value">{adminOrders.filter(o => o.orderStatus === 'Delivered').length}</div></div>
                </div>
            </div>

            <div className="ad-card">
                <div className="ad-card__body ad-card__body--flush">
                    {loading && deliveryBoys.length === 0 ? (
                        <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading partners…</div>
                    ) : deliveryBoys.length === 0 ? (
                        <div className="ad-empty"><i className="fa fa-motorcycle" aria-hidden="true"></i><p>No delivery boys yet.</p></div>
                    ) : (
                        <div className="ad-table-wrap">
                            <table className="ad-table">
                                <thead>
                                    <tr>
                                        <th>Partner</th>
                                        <th>Email</th>
                                        <th>Assigned</th>
                                        <th>Out for Delivery</th>
                                        <th>Delivered</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deliveryBoys.map(boy => {
                                        const s = stats(boy._id);
                                        return (
                                            <tr key={boy._id}>
                                                <td>
                                                    <div className="ad-toolbar" style={{ justifyContent: 'flex-start' }}>
                                                        {boy.avatar ? <img src={boy.avatar} alt={boy.name} className="ad-avatar" /> : <span className="ad-avatar"><i className="fa fa-motorcycle" aria-hidden="true"></i></span>}
                                                        <span className="ad-td-strong">{boy.name}</span>
                                                    </div>
                                                </td>
                                                <td>{boy.email}</td>
                                                <td><span className="ad-td-strong">{s.assigned}</span></td>
                                                <td><span className={`ad-badge ${s.outForDelivery > 0 ? 'ad-badge--primary' : 'ad-badge--muted'}`}>{s.outForDelivery}</span></td>
                                                <td><span className={`ad-badge ${s.delivered > 0 ? 'ad-badge--success' : 'ad-badge--muted'}`}>{s.delivered}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Fragment>
    );
}
