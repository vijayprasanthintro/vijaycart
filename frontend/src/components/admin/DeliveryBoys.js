import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getDeliveryBoys, createDeliveryBoy, toggleAvailability, deleteDeliveryBoy, updateDeliveryBoy } from '../../actions/deliveryActions';
import { adminOrders as adminOrdersAction } from '../../actions/orderActions';

export default function DeliveryBoys() {
    const { deliveryBoys = [], loading } = useSelector(state => state.deliveryState);
    const { adminOrders = [] } = useSelector(state => state.orderState);
    const dispatch = useDispatch();

    const { user: authUser } = useSelector(state => state.authState);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toggling, setToggling] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [query, setQuery] = useState('');
    const [availabilityFilter, setAvailabilityFilter] = useState('all');
    const [form, setForm] = useState({ name: '', email: '', mobile: '', vehicleNumber: '' });

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
    const filteredBoys = deliveryBoys.filter(boy => {
        const q = query.trim().toLowerCase();
        const matchesQuery = !q || [boy.name, boy.email, boy.phone, boy.mobile, boy.vehicleNumber].some(v => String(v || '').toLowerCase().includes(q));
        const matchesAvailability = availabilityFilter === 'all'
            || (availabilityFilter === 'available' && boy.availability !== false)
            || (availabilityFilter === 'unavailable' && boy.availability === false);
        return matchesQuery && matchesAvailability;
    });

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

    const deleteHandler = async (boy) => {
        if (!boy?._id || deletingId) return;
        if (authUser?._id === boy._id) {
            toast.error('You cannot delete your own account', { position: toast.POSITION.BOTTOM_CENTER });
            return;
        }
        if (!window.confirm(`Delete delivery boy ${boy.name}? This action cannot be undone.`)) return;
        setDeletingId(boy._id);
        const result = await dispatch(deleteDeliveryBoy(boy._id));
        setDeletingId(null);
        if (result.success) {
            toast.success(result.message || 'Delivery boy deleted successfully', { position: toast.POSITION.BOTTOM_CENTER });
        } else {
            toast.error(result.error || 'Failed to delete delivery boy', { position: toast.POSITION.BOTTOM_CENTER });
        }
    };

    const changeHandler = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const editHandler = (boy) => {
        setEditingId(boy._id);
        setForm({
            name: boy.name || '',
            email: boy.email || '',
            mobile: boy.mobile || boy.phone || '',
            vehicleNumber: boy.vehicleNumber || ''
        });
        setShowForm(true);
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm({ name: '', email: '', mobile: '', vehicleNumber: '' });
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.mobile) {
            toast.error('Please fill name, email and mobile number', { position: toast.POSITION.BOTTOM_CENTER });
            return;
        }
        setSubmitting(true);
        const res = editingId
            ? await dispatch(updateDeliveryBoy(editingId, form))
            : await createDeliveryBoy(form)(dispatch);
        setSubmitting(false);
        if (res.success) {
            toast.success(editingId ? 'Delivery boy updated successfully!' : 'Delivery boy added successfully!', { position: toast.POSITION.BOTTOM_CENTER });
            cancelForm();
            dispatch(getDeliveryBoys());
        } else {
            toast.error(res.error || (editingId ? 'Failed to update delivery boy' : 'Failed to add delivery boy'), { position: toast.POSITION.BOTTOM_CENTER });
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
                    <button className="ad-btn ad-btn--primary" onClick={() => { if (showForm && !editingId) { cancelForm(); } else { setEditingId(null); setForm({ name: '', email: '', mobile: '', vehicleNumber: '' }); setShowForm(s => !s || !!editingId); } }}>
                        <i className="fa fa-plus" aria-hidden="true"></i> Add Delivery Boy
                    </button>
                    <Link to="/admin/delivery" className="ad-btn ad-btn--primary"><i className="fa fa-motorcycle" aria-hidden="true"></i> Assign Orders</Link>
                </div>
            </div>

            {showForm && (
                <div className="ad-card" style={{ marginBottom: '1rem' }}>
                    <div className="ad-card__head"><h3 className="ad-card__title"><i className={`fa ${editingId ? 'fa-pencil' : 'fa-user-plus'}`} aria-hidden="true"></i> {editingId ? 'Edit Delivery Boy' : 'New Delivery Boy'}</h3></div>
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
                                <span className="ad-label">Mobile Number</span>
                                <input type="tel" name="mobile" inputMode="numeric" maxLength="10" value={form.mobile} onChange={changeHandler} placeholder="10-digit mobile number" />
                            </div>
                            <div className="ad-list-item" style={{ padding: '0.45rem 0' }}>
                                <span className="ad-label">Vehicle Number <em className="form-optional">(optional)</em></span>
                                <input type="text" name="vehicleNumber" value={form.vehicleNumber} onChange={changeHandler} placeholder="e.g. MH 12 AB 1234" />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="submit" className="ad-btn ad-btn--primary" disabled={submitting}>
                                    {submitting ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Delivery Boy' : 'Add Delivery Boy')}
                                </button>
                                {editingId && (
                                    <button type="button" className="ad-btn ad-btn--ghost" onClick={cancelForm}>Cancel</button>
                                )}
                            </div>
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
                <div className="ad-card__head">
                    <div className="ad-toolbar">
                        <div className="ad-search">
                            <i className="fa fa-search" aria-hidden="true"></i>
                            <input placeholder="Search by name, email, phone…" value={query} onChange={e => setQuery(e.target.value)} />
                        </div>
                        <select className="ad-select" style={{ width: 'auto', minWidth: 180 }} value={availabilityFilter} onChange={e => setAvailabilityFilter(e.target.value)}>
                            <option value="all">All availability</option>
                            <option value="available">Available</option>
                            <option value="unavailable">Unavailable</option>
                        </select>
                    </div>
                </div>
                <div className="ad-card__body ad-card__body--flush">
                    {loading && deliveryBoys.length === 0 ? (
                        <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading...</div>
                    ) : filteredBoys.length === 0 ? (
                        <div className="ad-empty"><i className="fa fa-motorcycle" aria-hidden="true"></i><p>{deliveryBoys.length === 0 ? 'No delivery boys yet.' : 'No delivery boys match your search/filter.'}</p></div>
                    ) : (
                        <div className="ad-table-wrap">
                            <table className="ad-table">
                                <thead>
                                    <tr>
                                        <th>Partner</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th className="ad-td-num">Assigned</th>
                                        <th className="ad-td-num">Out for Delivery</th>
                                        <th className="ad-td-num">Delivered</th>
                                        <th>Availability</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBoys.map(boy => {
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
                                                <td className="ad-td-num"><span className="ad-td-strong">{s.assigned}</span></td>
                                                <td className="ad-td-num"><span className={`ad-badge ${s.outForDelivery > 0 ? 'ad-badge--primary' : ''}`}>{s.outForDelivery}</span></td>
                                                <td className="ad-td-num"><span className={`ad-badge ${s.delivered > 0 ? 'ad-badge--success' : ''}`}>{s.delivered}</span></td>
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
                                                <td>
                                                    <div className="ad-toolbar" style={{ justifyContent: 'flex-start' }}>
                                                        <button
                                                            type="button"
                                                            className="ad-btn ad-btn--ghost ad-btn--sm ad-btn--icon"
                                                            title="Edit delivery boy"
                                                            onClick={() => editHandler(boy)}
                                                        >
                                                            <i className="fa fa-pencil" aria-hidden="true"></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="ad-btn ad-btn--danger ad-btn--sm ad-btn--icon"
                                                            title="Delete delivery boy"
                                                            disabled={deletingId === boy._id}
                                                            onClick={() => deleteHandler(boy)}
                                                        >
                                                            <i className={`fa ${deletingId === boy._id ? 'fa-spinner fa-spin' : 'fa-trash'}`} aria-hidden="true"></i>
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
