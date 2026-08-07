import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getDeliveryBoys, createDeliveryBoy, toggleAvailability } from '../../actions/deliveryActions';
import { adminOrders as adminOrdersAction } from '../../actions/orderActions';

export default function DeliveryBoys() {
    const { deliveryBoys = [], loading } = useSelector(state => state.deliveryState);
    const { adminOrders = [] } = useSelector(state => state.orderState);
    const dispatch = useDispatch();

    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toggling, setToggling] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

    useEffect(() => {
        dispatch(getDeliveryBoys());
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

    const unassigned = adminOrders.filter(o => !o.deliveryBoy && o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Delivered');

    const availabilityHandler = async (boy) => {
        const next = boy.availability === false;
        setToggling(boy._id);
        const res = await toggleAvailability(boy._id, next)(dispatch);
        setToggling(null);
        if (res.success) {
            toast.success(next ? `${boy.name} is now available` : `${boy.name} is now unavailable`, { position: toast.POSITION.BOTTOM_CENTER });
            dispatch(getDeliveryBoys());
        } else {
            toast.error(res.error || 'Failed to update availability', { position: toast.POSITION.BOTTOM_CENTER });
        }
    };

    const changeHandler = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password) {
            toast.error('Please fill name, email and password', { position: toast.POSITION.BOTTOM_CENTER });
            return;
        }
        setSubmitting(true);
        const res = await createDeliveryBoy(form)(dispatch);
        setSubmitting(false);
        if (res.success) {
            toast.success('Delivery boy added successfully!', { position: toast.POSITION.BOTTOM_CENTER });
            setForm({ name: '', email: '', password: '', phone: '' });
            setShowForm(false);
            dispatch(getDeliveryBoys());
        } else {
            toast.error(res.error || 'Failed to add delivery boy', { position: toast.POSITION.BOTTOM_CENTER });
        }
    };

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Delivery Boys</h1>
                    <p>{deliveryBoys.length} partners &middot; {unassigned.length} unassigned active orders</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="ad-btn ad-btn--primary" onClick={() => setShowForm(s => !s)}>
                        <i className="fa fa-plus" aria-hidden="true"></i> Add Delivery Boy
                    </button>
                    <Link to="/admin/delivery" className="ad-btn ad-btn--primary"><i className="fa fa-motorcycle" aria-hidden="true"></i> Assign Orders</Link>
                </div>
            </div>

            {showForm && (
                <div className="ad-card" style={{ marginBottom: '1rem' }}>
                    <div className="ad-card__head"><h3 className="ad-card__title"><i className="fa fa-user-plus" aria-hidden="true"></i> New Delivery Boy</h3></div>
                    <div className="ad-card__body">
                        <form onSubmit={submitHandler} className="ad-form" style={{ gap: '0.6rem' }}>
                            <div className="ad-list-item" style={{ padding: '0.45rem 0' }}>
                                <span className="ad-label">Name</span>
                                <input type="text" name="name" value={form.name} onChange={changeHandler} placeholder="Full name" />
                            </div>
                            <div className="ad-list-item" style={{ padding: '0.45rem 0' }}>
                                <span className="ad-label">Email</span>
                                <input type="email" name="email" value={form.email} onChange={changeHandler} placeholder="email@example.com" />
                            </div>
                            <div className="ad-list-item" style={{ padding: '0.45rem 0' }}>
                                <span className="ad-label">Password</span>
                                <input type="password" name="password" value={form.password} onChange={changeHandler} placeholder="Password" />
                            </div>
                            <div className="ad-list-item" style={{ padding: '0.45rem 0' }}>
                                <span className="ad-label">Phone</span>
                                <input type="text" name="phone" value={form.phone} onChange={changeHandler} placeholder="Phone number" />
                            </div>
                            <button type="submit" className="ad-btn ad-btn--primary" disabled={submitting}>
                                {submitting ? 'Adding...' : 'Add Delivery Boy'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="ad-stat-grid">
                <div className="ad-stat ad-stat--primary">
                    <div className="ad-stat__icon"><i className="fa fa-motorcycle" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Delivery Partners</div><div className="ad-stat__value">{deliveryBoys.length}</div></div>
                </div>
                <div className="ad-stat ad-stat--warning">
                    <div className="ad-stat__icon"><i className="fa fa-hourglass-half" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Unassigned Active</div><div className="ad-stat__value">{unassigned.length}</div></div>
                </div>
                <div className="ad-stat ad-stat--success">
                    <div className="ad-stat__icon"><i className="fa fa-check-circle" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Delivered Orders</div><div className="ad-stat__value">{adminOrders.filter(o => o.orderStatus === 'Delivered').length}</div></div>
                </div>
            </div>

            <div className="ad-card">
                <div className="ad-card__body ad-card__body--flush">
                    {loading && deliveryBoys.length === 0 ? (
                        <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading...</div>
                    ) : deliveryBoys.length === 0 ? (
                        <div className="ad-empty"><i className="fa fa-motorcycle" aria-hidden="true"></i><p>No delivery boys yet.</p></div>
                    ) : (
                        <div className="ad-table-wrap">
                            <table className="ad-table">
                                <thead>
                                    <tr>
                                        <th>Partner</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Assigned</th>
                                        <th>Out for Delivery</th>
                                        <th>Delivered</th>
                                        <th>Availability</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deliveryBoys.map(boy => {
                                        const s = stats(boy._id);
                                        const busy = toggling === boy._id;
                                        return (
                                            <tr key={boy._id}>
                                                <td>
                                                    <div className="ad-toolbar" style={{ justifyContent: 'flex-start' }}>
                                                        {boy.avatar ? <img src={boy.avatar} alt={boy.name} className="ad-avatar" /> : null}
                                                        <span className="ad-td-strong">{boy.name}</span>
                                                    </div>
                                                </td>
                                                <td>{boy.email}</td>
                                                <td>{boy.phone || '—'}</td>
                                                <td><span className="ad-td-strong">{s.assigned}</span></td>
                                                <td><span className={`ad-badge ${s.outForDelivery > 0 ? 'ad-badge--primary' : ''}`}>{s.outForDelivery}</span></td>
                                                <td><span className={`ad-badge ${s.delivered > 0 ? 'ad-badge--success' : ''}`}>{s.delivered}</span></td>
                                                <td>
                                                    <div className="ad-toolbar" style={{ justifyContent: 'flex-start' }}>
                                                        <span className={`ad-badge ${boy.availability === false ? 'ad-badge--danger' : 'ad-badge--success'}`}>
                                                            {boy.availability === false ? 'Unavailable' : 'Available'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="ad-btn ad-btn--ghost ad-btn--sm"
                                                            disabled={busy}
                                                            onClick={() => availabilityHandler(boy)}
                                                            title={boy.availability === false ? 'Mark available' : 'Mark unavailable'}
                                                        >
                                                            {busy ? <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> : <i className={`fa ${boy.availability === false ? 'fa-toggle-on' : 'fa-toggle-off'}`} aria-hidden="true"></i>}
                                                            {boy.availability === false ? ' Make available' : ' Make unavailable'}
                                                        </button>
                                                    </div>
                                                </td>
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
