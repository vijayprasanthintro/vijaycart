import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { userOrders as userOrdersAction } from '../../actions/orderActions';
import { logout } from '../../actions/userActions';
import { useWishlist } from '../../context/WishlistContext';
import { formatMoney } from '../../utils/productHelper';
import { toast } from 'react-toastify';
import MetaData from '../layouts/MetaData';
import Loader from '../layouts/Loader';

const fmtDate = (d) => {
    try { return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return ''; }
};

const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export default function Profile () {
    const { user, loading } = useSelector(state => state.authState);
    const { userOrders = [] } = useSelector(state => state.orderState);
    const { count: wishlistCount } = useWishlist();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [addrCount, setAddrCount] = useState(0);
    const [avatarFailed, setAvatarFailed] = useState(false);

    useEffect(() => {
        try {
            const list = JSON.parse(localStorage.getItem('vijaycart_addresses')) || [];
            setAddrCount(list.length);
        } catch { setAddrCount(0); }
    }, []);

    useEffect(() => {
        setAvatarFailed(false);
    }, [user?._id]);

    useEffect(() => {
        dispatch(userOrdersAction())
    }, [dispatch])

    const logoutHandler = async () => {
        await dispatch(logout());
        toast('Logged out successfully', { type: 'success', position: toast.POSITION.BOTTOM_CENTER });
        navigate('/');
    };

    if (loading || !user) {
        return <Loader />;
    }

    const showInitials = !user.avatar || avatarFailed;

    const stats = [
        { icon: 'fa-shopping-bag', value: userOrders.length, label: 'Orders' },
        { icon: 'fa-heart', value: wishlistCount, label: 'Wishlist' },
        { icon: 'fa-location-dot', value: addrCount, label: 'Addresses' },
    ];

    const tiles = [
        { to: '/myprofile/update', icon: 'fa-user-circle', label: 'Personal Information', sub: 'Name, email & avatar' },
        { to: '/myprofile/update/password', icon: 'fa-lock', label: 'Account Settings', sub: 'Change your password' },
        { to: '/shipping', icon: 'fa-location-dot', label: 'Delivery Addresses', sub: `${addrCount} saved address${addrCount === 1 ? '' : 'es'}` },
        { to: '/orders', icon: 'fa-shopping-bag', label: 'My Orders', sub: 'Track, cancel & re-order' },
        { to: '/wishlist', icon: 'fa-heart', label: 'Wishlist', sub: `${wishlistCount} saved item${wishlistCount === 1 ? '' : 's'}` },
        { to: '/search/all', icon: 'fa-fire', label: 'Shop Deals', sub: 'Explore offers' },
    ];

    const recentOrders = userOrders.slice(0, 2);

    return (
        <Fragment>
            <MetaData title="My Profile" />
            <div className="pr-page">
                <div className="pr-head">
                    <div className="pr-avatar">
                        {showInitials ? (
                            <span className="pr-avatar-initials">{getInitials(user.name)}</span>
                        ) : (
                            <img src={user.avatar} alt={user.name} onError={() => setAvatarFailed(true)} />
                        )}
                    </div>
                    <div className="pr-head-info">
                        <h1 className="pr-name">{user.name}</h1>
                        <div className="pr-subline">
                            <span className="pr-email"><i className="fa fa-envelope" aria-hidden="true"></i>{user.email}</span>
                            <span className="pr-role">{user.role}</span>
                        </div>
                        <p className="pr-since"><i className="fa fa-calendar-o mr-1" aria-hidden="true"></i>Member since {user.createdAt ? fmtDate(user.createdAt) : '—'}</p>
                    </div>
                    <button type="button" className="mo-btn danger" onClick={logoutHandler}>
                        <i className="fa fa-sign-out mr-1" aria-hidden="true"></i>Logout
                    </button>
                </div>

                <div className="pr-stats">
                    {stats.map(stat => (
                        <div className="pr-stat" key={stat.label}>
                            <div className="pr-stat-icon"><i className={`fa ${stat.icon}`} aria-hidden="true"></i></div>
                            <div>
                                <div className="pr-stat-value">{stat.value}</div>
                                <div className="pr-stat-label">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pr-section-title">Account</div>
                <div className="dash-tiles">
                    {tiles.map(tile => (
                        <Link key={tile.to} to={tile.to} className="dash-tile">
                            <i className={`fa ${tile.icon}`} aria-hidden="true"></i>
                            <span>{tile.label}</span>
                            <small className="text-muted">{tile.sub}</small>
                        </Link>
                    ))}
                </div>

                {recentOrders.length > 0 && (
                    <Fragment>
                        <div className="pr-section-title">Recent Orders</div>
                        <div className="mo-list">
                            {recentOrders.map(order => (
                                <div className="mo-card" key={order._id}>
                                    <div className="mo-card-top">
                                        <div>
                                            <div className="mo-order-id"><i className="fa fa-hashtag mr-1" aria-hidden="true"></i>Order #{order._id}</div>
                                            <div className="mo-date">Placed on {fmtDate(order.createdAt)}</div>
                                        </div>
                                        <span className={`mo-status ${(order.orderStatus || '').toLowerCase().includes('cancel') ? 'cancelled' : (order.orderStatus || '').toLowerCase().includes('deliver') ? 'delivered' : (order.orderStatus || '').toLowerCase().includes('ship') ? 'shipped' : 'processing'}`}>{order.orderStatus}</span>
                                    </div>
                                    <div className="mo-card-mid">
                                        <div className="mo-summary-line">
                                            <span>{order.orderItems.reduce((a, it) => a + it.quantity, 0)} item{order.orderItems.reduce((a, it) => a + it.quantity, 0) === 1 ? '' : 's'}</span>
                                            <b>{formatMoney(order.totalPrice)}</b>
                                        </div>
                                    </div>
                                    <div className="mo-actions">
                                        <Link to={`/order/${order._id}`} className="mo-btn primary"><i className="fa fa-eye mr-1" aria-hidden="true"></i>View Details</Link>
                                        <Link to="/orders" className="mo-btn">View All Orders</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Fragment>
                )}
            </div>
        </Fragment>
    )
}
