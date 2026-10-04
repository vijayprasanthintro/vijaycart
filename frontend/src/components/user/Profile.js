import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { userOrders as userOrdersAction } from '../../actions/orderActions';
import { logout } from '../../actions/userActions';
import { fetchAddresses } from '../../actions/addressActions';
import { useWishlist } from '../../context/WishlistContext';
import { formatMoney } from '../../utils/productHelper';
import { toast } from 'react-toastify';
import MetaData from '../layouts/MetaData';
import Loader from '../layouts/Loader';
import { fadeUp, staggerContainer, easeOutExpo } from '../../utils/motion';

const MotionLink = motion(Link);

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
    const { items: savedAddresses, loaded: addressesLoaded } = useSelector(state => state.addressState);
    const { count: wishlistCount } = useWishlist();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [avatarFailed, setAvatarFailed] = useState(false);

    useEffect(() => {
        setAvatarFailed(false);
    }, [user?._id]);

    // Saved addresses live on the account — the count reflects the server list.
    useEffect(() => {
        if (!addressesLoaded) dispatch(fetchAddresses());
    }, [dispatch, addressesLoaded]);

    useEffect(() => {
        dispatch(userOrdersAction())
    }, [dispatch])

    const addrCount = savedAddresses.length;

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
        { icon: 'fa-map-marker', value: addrCount, label: 'Addresses' },
    ];

    const tiles = [
        { to: '/myprofile/update', icon: 'fa-user-circle', label: 'Personal Information', sub: 'Name, email, mobile & avatar' },
        { to: '/shipping', icon: 'fa-map-marker', label: 'Delivery Addresses', sub: `${addrCount} saved address${addrCount === 1 ? '' : 'es'}` },
        { to: '/orders', icon: 'fa-shopping-bag', label: 'My Orders', sub: 'Track, cancel & re-order' },
        { to: '/wishlist', icon: 'fa-heart', label: 'Wishlist', sub: `${wishlistCount} saved item${wishlistCount === 1 ? '' : 's'}` },
        { to: '/search/all', icon: 'fa-fire', label: 'Shop Deals', sub: 'Explore offers' },
    ];

    const recentOrders = userOrders.slice(0, 2);

    return (
        <Fragment>
            <MetaData title="My Profile" />
            <div className="pr-page">
                <motion.div
                    className="pr-head"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: easeOutExpo }}
                >
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
                            {user.mobile && <span className="pr-email"><i className="fa fa-mobile" aria-hidden="true"></i>{user.mobile}</span>}
                            <span className="pr-role">{user.role}</span>
                        </div>
                        <p className="pr-since"><i className="fa fa-calendar-o mr-1" aria-hidden="true"></i>Member since {user.createdAt ? fmtDate(user.createdAt) : '—'}</p>
                    </div>
                    <button type="button" className="mo-btn danger" onClick={logoutHandler}>
                        <i className="fa fa-sign-out mr-1" aria-hidden="true"></i>Logout
                    </button>
                </motion.div>

                <motion.div
                    className="pr-stats"
                    initial="hidden"
                    animate="show"
                    variants={staggerContainer(0.08, 0.15)}
                >
                    {stats.map(stat => (
                        <motion.div className="pr-stat" key={stat.label} variants={fadeUp}>
                            <div className="pr-stat-icon"><i className={`fa ${stat.icon}`} aria-hidden="true"></i></div>
                            <div>
                                <div className="pr-stat-value">{stat.value}</div>
                                <div className="pr-stat-label">{stat.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                <div className="pr-coins">
                    <div className="pr-coins-balance">
                        <span className="pr-coins-icon"><i className="fa fa-star" aria-hidden="true"></i></span>
                        <div>
                            <div className="pr-coins-label">VijayCoins Balance</div>
                            <b className="pr-coins-amt">{Math.floor(Number(user.vijayCoins) || 0)} <small>coins</small></b>
                            <div className="pr-coins-worth">Worth {formatMoney(Math.floor(Number(user.vijayCoins) || 0))} — redeemable at checkout</div>
                        </div>
                    </div>
                    {Array.isArray(user.coinHistory) && user.coinHistory.length > 0 && (
                        <div className="pr-coins-history">
                            <div className="pr-coins-history-title">Recent Activity</div>
                            <ul>
                                {user.coinHistory.slice(-6).reverse().map((entry, idx) => (
                                    <li key={`${entry.orderNumber || entry._id}-${idx}`}>
                                        <i className={`fa ${entry.type === 'earned' ? 'fa-arrow-down pr-coin-earned' : 'fa-arrow-up pr-coin-redeemed'}`} aria-hidden="true"></i>
                                        <span className="pr-coin-note">{entry.note}</span>
                                        <b className={entry.type === 'earned' ? 'pr-coin-earned' : 'pr-coin-redeemed'}>
                                            {entry.type === 'earned' ? '+' : '\u2212'}{Math.abs(Number(entry.amount) || 0)}
                                        </b>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="pr-section-title">Account</div>
                <motion.div
                    className="dash-tiles"
                    initial="hidden"
                    animate="show"
                    variants={staggerContainer(0.06, 0.1)}
                >
                    {tiles.map(tile => (
                        <MotionLink key={tile.to} to={tile.to} className="dash-tile" variants={fadeUp}>
                            <i className={`fa ${tile.icon}`} aria-hidden="true"></i>
                            <span>{tile.label}</span>
                            <small className="text-muted">{tile.sub}</small>
                        </MotionLink>
                    ))}
                </motion.div>

                {recentOrders.length > 0 && (
                    <Fragment>
                        <div className="pr-section-title">Recent Orders</div>
                        <motion.div
                            className="mo-list"
                            initial="hidden"
                            animate="show"
                            variants={staggerContainer(0.1, 0.15)}
                        >
                            {recentOrders.map(order => {
                        const status = String(order.orderStatus || '');
                        const statusClass = status.toLowerCase().includes('cancel') ? 'cancelled'
                            : status.toLowerCase().includes('out for delivery') ? 'shipped'
                            : /(^|\s)delivered($|\s)/i.test(status) ? 'delivered'
                            : status.toLowerCase().includes('ship') ? 'shipped'
                            : 'processing';
                        return (
                            <motion.div className="mo-card" key={order._id} variants={fadeUp}>
                                <div className="mo-card-top">
                                    <div>
                                        <div className="mo-order-id"><i className="fa fa-hashtag mr-1" aria-hidden="true"></i>Order #{order._id}</div>
                                        <div className="mo-date">Placed on {fmtDate(order.createdAt)}</div>
                                    </div>
                                    <span className={`mo-status ${statusClass}`}>{order.orderStatus}</span>
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
                            </motion.div>
                        );
                    })}
                        </motion.div>
                    </Fragment>
                )}
            </div>
        </Fragment>
    )
}
