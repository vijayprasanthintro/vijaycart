import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { getSellerApplications, updateSellerApplication } from '../../actions/sellerActions';
import { clearSellerState } from '../../slices/sellerSlice';

const STATUS_META = {
    pending: { label: 'Pending', badge: 'ad-badge--warning' },
    approved: { label: 'Approved', badge: 'ad-badge--success' },
    rejected: { label: 'Rejected', badge: 'ad-badge--danger' }
};

export default function SellerApplications() {
    const { applications = [], loading, error, isUpdated } = useSelector(state => state.sellerState);
    const dispatch = useDispatch();

    const [busyId, setBusyId] = useState(null);
    const [reviewing, setReviewing] = useState(null);
    const [note, setNote] = useState('');

    useEffect(() => {
        dispatch(getSellerApplications());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast.error(error, { position: toast.POSITION.BOTTOM_CENTER });
            dispatch(clearSellerState());
        }
        if (isUpdated) {
            toast.success('Application updated', { position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearSellerState()) });
        }
    }, [error, isUpdated, dispatch]);

    const decide = async (app, status) => {
        setBusyId(app._id);
        await dispatch(updateSellerApplication(app._id, { status, adminNote: note.trim() }));
        setBusyId(null);
        setReviewing(null);
        setNote('');
    };

    const pending = applications.filter(a => a.status === 'pending');
    const counts = {
        pending: pending.length,
        approved: applications.filter(a => a.status === 'approved').length,
        rejected: applications.filter(a => a.status === 'rejected').length
    };

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Seller Applications</h1>
                    <p>{pending.length} pending &middot; {counts.approved} approved &middot; {counts.rejected} rejected</p>
                </div>
            </div>

            <div className="ad-stat-grid">
                <div className="ad-stat ad-stat--warning">
                    <div className="ad-stat__icon"><i className="fa fa-clock-o" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Pending Review</div><div className="ad-stat__value">{counts.pending}</div></div>
                </div>
                <div className="ad-stat ad-stat--success">
                    <div className="ad-stat__icon"><i className="fa fa-check-circle" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Approved Sellers</div><div className="ad-stat__value">{counts.approved}</div></div>
                </div>
                <div className="ad-stat ad-stat--danger">
                    <div className="ad-stat__icon"><i className="fa fa-times-circle" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Rejected</div><div className="ad-stat__value">{counts.rejected}</div></div>
                </div>
            </div>

            <div className="ad-card">
                <div className="ad-card__body ad-card__body--flush">
                    {loading && applications.length === 0 ? (
                        <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading...</div>
                    ) : applications.length === 0 ? (
                        <div className="ad-empty"><i className="fa fa-briefcase" aria-hidden="true"></i><p>No seller applications yet.</p></div>
                    ) : (
                        <div className="ad-table-wrap">
                            <table className="ad-table">
                                <thead>
                                    <tr>
                                        <th>Applicant</th>
                                        <th>Store</th>
                                        <th>Contact</th>
                                        <th>GSTIN</th>
                                        <th>Submitted</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.map(app => {
                                        const meta = STATUS_META[app.status] || STATUS_META.pending;
                                        const busy = busyId === app._id;
                                        return (
                                            <tr key={app._id}>
                                                <td>
                                                    <div className="ad-td-strong">{app.user?.name || '—'}</div>
                                                    <div className="ad-td-sub">{app.user?.email || '—'}</div>
                                                </td>
                                                <td>
                                                    <div className="ad-td-strong">{app.storeName}</div>
                                                    <div className="ad-td-sub">{app.storeCategory} &middot; {app.storeCity}</div>
                                                </td>
                                                <td>{app.storePhone || app.user?.mobile || '—'}</td>
                                                <td>{app.gstin || '—'}</td>
                                                <td>{new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                                <td><span className={`ad-badge ${meta.badge}`}>{meta.label}</span></td>
                                                <td>
                                                    {app.status === 'pending' ? (
                                                        <div className="ad-toolbar" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                                                            <button type="button" className="ad-btn ad-btn--primary ad-btn--sm" disabled={busy} onClick={() => decide(app, 'approved')}>
                                                                {busy ? <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> : <i className="fa fa-check" aria-hidden="true"></i>} Approve
                                                            </button>
                                                            <button type="button" className="ad-btn ad-btn--danger ad-btn--sm" disabled={busy} onClick={() => decide(app, 'rejected')}>
                                                                <i className="fa fa-times" aria-hidden="true"></i> Reject
                                                            </button>
                                                            <button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={() => { setReviewing(reviewing === app._id ? null : app._id); setNote(app.adminNote || ''); }}>
                                                                <i className="fa fa-pencil" aria-hidden="true"></i> Note
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="ad-td-sub">{app.adminNote || '—'}</span>
                                                    )}
                                                    {reviewing === app._id && (
                                                        <div style={{ marginTop: '0.5rem' }}>
                                                            <input
                                                                type="text"
                                                                className="ad-input"
                                                                value={note}
                                                                onChange={e => setNote(e.target.value)}
                                                                maxLength="300"
                                                                placeholder="Reason / note for the applicant (saved on approve or reject)"
                                                                style={{ padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid var(--ad-border)', background: 'var(--ad-surface-2)', color: 'var(--ad-text)', width: '100%' }}
                                                            />
                                                        </div>
                                                    )}
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
