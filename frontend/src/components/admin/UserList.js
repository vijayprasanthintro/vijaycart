import { Fragment, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { deleteUser, getUsers } from '../../actions/userActions';
import { adminOrders as adminOrdersAction } from '../../actions/orderActions';
import { clearError, clearUserDeleted } from '../../slices/userSlice';
import { toast } from 'react-toastify';

export default function UserList() {
    const { users = [], loading = true, error, isUserDeleted } = useSelector(state => state.userState);
    const { adminOrders = [] } = useSelector(state => state.orderState);
    const dispatch = useDispatch();

    const [query, setQuery] = useState('');
    const [role, setRole] = useState('');

    useEffect(() => {
        dispatch(getUsers);
        dispatch(adminOrdersAction());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast(error, { type: 'error', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearError()) });
            return;
        }
        if (isUserDeleted) {
            toast('User deleted successfully!', { type: 'success', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearUserDeleted()) });
            return;
        }
    }, [dispatch, error, isUserDeleted]);

    const orderCount = id => adminOrders.filter(o => String(o.user) === String(id)).length;

    const filtered = useMemo(() => {
        let list = users;
        if (role) list = list.filter(u => u.role === role);
        if (query.trim()) {
            const q = query.trim().toLowerCase();
            list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
        }
        return list;
    }, [users, query, role]);

    const deleteHandler = id => dispatch(deleteUser(id));

    const roleBadge = roleVal => (
        <span className={`ad-badge ${roleVal === 'admin' ? 'ad-badge--danger' : roleVal === 'deliveryboy' ? 'ad-badge--primary' : 'ad-badge--info'}`}>
            {roleVal === 'admin' ? <i className="fa fa-shield mr-1" aria-hidden="true"></i> : roleVal === 'deliveryboy' ? <i className="fa fa-motorcycle mr-1" aria-hidden="true"></i> : <i className="fa fa-user mr-1" aria-hidden="true"></i>}
            {roleVal}
        </span>
    );

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Users</h1>
                    <p>{users.length} accounts</p>
                </div>
            </div>

            <div className="ad-card">
                <div className="ad-card__head">
                    <div className="ad-toolbar">
                        <div className="ad-search">
                            <i className="fa fa-search" aria-hidden="true"></i>
                            <input placeholder="Search by name or email…" value={query} onChange={e => setQuery(e.target.value)} />
                        </div>
                        <select className="ad-filter" value={role} onChange={e => setRole(e.target.value)}>
                            <option value="">All roles</option>
                            <option value="admin">Admin</option>
                            <option value="deliveryboy">Delivery Boy</option>
                            <option value="user">User</option>
                        </select>
                    </div>
                </div>
                <div className="ad-card__body ad-card__body--flush">
                    {loading ? (
                        <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading users…</div>
                    ) : filtered.length === 0 ? (
                        <div className="ad-empty"><i className="fa fa-users" aria-hidden="true"></i><p>No users match your filters.</p></div>
                    ) : (
                        <div className="ad-table-wrap">
                            <table className="ad-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Orders</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(user => (
                                        <tr key={user._id}>
                                            <td>
                                                <div className="ad-toolbar" style={{ justifyContent: 'flex-start' }}>
                                                    {user.avatar ? <img src={user.avatar} alt={user.name} className="ad-avatar" /> : <span className="ad-avatar"><i className="fa fa-user" aria-hidden="true"></i></span>}
                                                    <span className="ad-td-strong">{user.name}</span>
                                                </div>
                                            </td>
                                            <td>{user.email}</td>
                                            <td>{roleBadge(user.role)}</td>
                                            <td><span className="ad-td-strong">{orderCount(user._id)}</span></td>
                                            <td><span className="ad-stat__label">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '—'}</span></td>
                                            <td>
                                                <div className="ad-toolbar">
                                                    <Link to={`/admin/user/${user._id}`} className="ad-btn ad-btn--ghost ad-btn--sm" title="Edit"><i className="fa fa-pencil" aria-hidden="true"></i></Link>
                                                    <button type="button" className="ad-btn ad-btn--danger ad-btn--sm ad-btn--icon" title="Delete" onClick={() => deleteHandler(user._id)}>
                                                        <i className="fa fa-trash" aria-hidden="true"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Fragment>
    );
}
