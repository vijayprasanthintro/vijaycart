import { useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../actions/userActions';
import { clearAuthError } from '../../actions/userActions';
import './admin.css';

const NAV = [
    {
        group: 'Overview',
        items: [
            { to: '/admin/dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' }
        ]
    },
    {
        group: 'Management',
        items: [
            { to: '/admin/orders', icon: 'fa-shopping-basket', label: 'Orders' },
            { to: '/admin/delivery', icon: 'fa-truck', label: 'Assign Delivery' },
            { to: '/admin/products', icon: 'fa-box', label: 'Products' },
            { to: '/admin/categories', icon: 'fa-th-large', label: 'Categories' },
            { to: '/admin/coupons', icon: 'fa-ticket', label: 'Coupons' },
            { to: '/admin/delivery-boys', icon: 'fa-motorcycle', label: 'Delivery Boys' },
            { to: '/admin/users', icon: 'fa-users', label: 'Users' }
        ]
    },
    {
        group: 'Insights',
        items: [
            { to: '/admin/analytics', icon: 'fa-chart-line', label: 'Analytics' },
            { to: '/admin/revenue', icon: 'fa-indian-rupee', label: 'Revenue' },
            { to: '/admin/inventory', icon: 'fa-warehouse', label: 'Inventory' },
            { to: '/admin/reviews', icon: 'fa-star', label: 'Reviews' }
        ]
    },
    {
        group: 'System',
        items: [
            { to: '/admin/settings', icon: 'fa-cog', label: 'Settings' },
            { to: '/admin/permissions', icon: 'fa-shield-alt', label: 'Permissions' }
        ]
    }
];

const TITLES = {
    '/admin/dashboard': { title: 'Dashboard', sub: 'Store overview & key metrics' },
    '/admin/orders': { title: 'Orders', sub: 'Manage customer orders & delivery' },
    '/admin/products': { title: 'Products', sub: 'Catalogue & pricing' },
    '/admin/categories': { title: 'Categories', sub: 'Organize your catalogue' },
    '/admin/coupons': { title: 'Coupons', sub: 'Discounts & promotions' },
    '/admin/delivery-boys': { title: 'Delivery Boys', sub: 'Delivery partners & assignments' },
    '/admin/delivery': { title: 'Assign Delivery', sub: 'Map orders to delivery partners' },
    '/admin/users': { title: 'Users', sub: 'Customers & accounts' },
    '/admin/analytics': { title: 'Analytics', sub: 'Orders, revenue & customer insights' },
    '/admin/revenue': { title: 'Revenue', sub: 'Earnings & payment insights' },
    '/admin/inventory': { title: 'Inventory', sub: 'Stock levels & alerts' },
    '/admin/reviews': { title: 'Reviews', sub: 'Customer feedback & ratings' },
    '/admin/settings': { title: 'Settings', sub: 'Store configuration' },
    '/admin/permissions': { title: 'Permissions', sub: 'Roles & access control' }
};

// Quick global jump — maps a keyword to the most relevant admin section.
const SEARCH_ROUTES = [
    { re: /order|deliver|ship|payment|cod/i, to: '/admin/orders', label: 'Orders', icon: 'fa-shopping-basket' },
    { re: /product|catalog|item|price/i, to: '/admin/products', label: 'Products', icon: 'fa-box' },
    { re: /user|customer|account|admin/i, to: '/admin/users', label: 'Users', icon: 'fa-users' },
    { re: /coupon|promo|discount|code/i, to: '/admin/coupons', label: 'Coupons', icon: 'fa-ticket' },
    { re: /review|rating|feedback/i, to: '/admin/reviews', label: 'Reviews', icon: 'fa-star' },
    { re: /inventory|stock|warehouse/i, to: '/admin/inventory', label: 'Inventory', icon: 'fa-warehouse' },
    { re: /analytic|traffic|trend|sales/i, to: '/admin/analytics', label: 'Analytics', icon: 'fa-chart-line' },
    { re: /revenue|earning|money|profit/i, to: '/admin/revenue', label: 'Revenue', icon: 'fa-indian-rupee' },
    { re: /categor|collection/i, to: '/admin/categories', label: 'Categories', icon: 'fa-th-large' },
    { re: /setting|config|permission|role/i, to: '/admin/settings', label: 'Settings', icon: 'fa-cog' },
    { re: /boy|rider|partner/i, to: '/admin/delivery-boys', label: 'Delivery Boys', icon: 'fa-motorcycle' }
];

const NOTIFICATIONS = [
    { icon: 'fa-shopping-basket', tone: 'ad-stat--info', title: 'New order placed', time: '2 min ago' },
    { icon: 'fa-exclamation-triangle', tone: 'ad-stat--warning', title: '5 products running low on stock', time: '24 min ago' },
    { icon: 'fa-star', tone: 'ad-stat--violet', title: 'New product review submitted', time: '1 hr ago' },
    { icon: 'fa-refresh', tone: 'ad-stat--danger', title: 'Return request received', time: '3 hrs ago' }
];

export default function AdminLayout() {
    const { user } = useSelector(state => state.authState);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const [theme, setTheme] = useState(() => localStorage.getItem('vc-admin-theme') || 'light');
    const [navOpen, setNavOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem('vc-admin-sidebar-collapsed') === '1');
    const [query, setQuery] = useState('');
    const [notifOpen, setNotifOpen] = useState(false);
    const [userMenu, setUserMenu] = useState(false);

    useEffect(() => {
        localStorage.setItem('vc-admin-theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('vc-admin-sidebar-collapsed', collapsed ? '1' : '0');
    }, [collapsed]);

    useEffect(() => {
        setNavOpen(false);
        setQuery('');
        setNotifOpen(false);
        setUserMenu(false);
    }, [location.pathname]);

    const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));
    const toggleCollapsed = () => setCollapsed(c => !c);

    const logoutHandler = () => {
        dispatch(logout());
        dispatch(clearAuthError());
        navigate('/login');
    };

    const results = query.trim()
        ? SEARCH_ROUTES.filter(r => r.re.test(query.trim()))
        : [];

    const submitSearch = e => {
        e.preventDefault();
        const q = query.trim();
        if (!q) return;
        const match = SEARCH_ROUTES.find(r => r.re.test(q));
        if (match) navigate(match.to);
    };

    const page = TITLES[location.pathname] || { title: 'Admin', sub: '' };
    const firstName = (user?.name || 'Admin').split(' ')[0];

    return (
        <div className={`ad-layout ${navOpen ? 'ad-layout--nav-open' : ''} ${collapsed ? 'ad-layout--collapsed' : ''}`} data-theme={theme}>
            <div className="ad-sidebar-overlay" onClick={() => setNavOpen(false)}></div>

            <aside className="ad-sidebar">
                <div className="ad-sidebar__brand">
                    <span className="ad-sidebar__brand-logo"><i className="fa fa-shopping-bag" aria-hidden="true"></i></span>
                    <span className="ad-sidebar__brand-word">Vijay<span>Cart</span> Admin</span>
                </div>
                <nav className="ad-sidebar__nav">
                    {NAV.map(group => (
                        <div key={group.group}>
                            <div className="ad-sidebar__group-title">{group.group}</div>
                            {group.items.map(item => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    title={collapsed ? item.label : undefined}
                                    className={({ isActive }) => `ad-sidebar__item ${isActive ? 'ad-sidebar__item--active' : ''}`}
                                >
                                    <i className={`fa ${item.icon}`} aria-hidden="true"></i>
                                    <span className="ad-sidebar__label">{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>
                <div className="ad-sidebar__foot">
                    <Link to="/"><i className="fa fa-globe" aria-hidden="true"></i><span>View Store</span></Link>
                    <button type="button" className="ad-sidebar__collapse" onClick={toggleCollapsed} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                        <i className={`fa ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`} aria-hidden="true"></i>
                        <span>Collapse</span>
                    </button>
                </div>
            </aside>

            <div className="ad-main">
                <header className="ad-topbar">
                    <button type="button" className="ad-topbar__menu" onClick={() => setNavOpen(true)} aria-label="Open menu">
                        <i className="fa fa-bars" aria-hidden="true"></i>
                    </button>
                    <div>
                        <div className="ad-topbar__title">{page.title}</div>
                        <div className="ad-topbar__sub">{page.sub}</div>
                    </div>
                    <div className="ad-topbar__spacer"></div>
                    <div className="ad-topbar__actions">
                        <div className="ad-search">
                            <i className="fa fa-search" aria-hidden="true"></i>
                            <input
                                placeholder="Search admin…"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') submitSearch(e); }}
                                aria-label="Search admin"
                            />
                            {query.trim() && (
                                <div className="ad-search-results">
                                    <div className="ad-search-results__head">Jump to section</div>
                                    {results.length === 0 ? (
                                        <button type="button" className="ad-search-results__item" onClick={submitSearch}>
                                            <i className="fa fa-search" aria-hidden="true"></i> Go to Orders
                                        </button>
                                    ) : (
                                        results.slice(0, 5).map(r => (
                                            <button type="button" className="ad-search-results__item" key={r.to} onClick={() => navigate(r.to)}>
                                                <i className={`fa ${r.icon}`} aria-hidden="true"></i>
                                                {r.label}
                                                <i className="fa fa-arrow-right" aria-hidden="true"></i>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ position: 'relative' }}>
                            <button
                                type="button"
                                className="ad-iconbtn ad-iconbtn--notif"
                                title="Notifications"
                                aria-label="Notifications"
                                onClick={() => { setNotifOpen(o => !o); setUserMenu(false); }}
                            >
                                <i className="fa fa-bell-o" aria-hidden="true"></i>
                                <span className="ad-iconbtn__badge">{NOTIFICATIONS.length}</span>
                            </button>
                            {notifOpen && (
                                <div className="ad-dropdown ad-dropdown--notif">
                                    <div className="ad-dropdown__head">
                                        <b>Notifications</b>
                                        <span>{NOTIFICATIONS.length} unread updates</span>
                                    </div>
                                    {NOTIFICATIONS.map((n, i) => (
                                        <div className="ad-dropdown__notif" key={i}>
                                            <i className={`fa ${n.icon} ${n.tone}`} aria-hidden="true"></i>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <b>{n.title}</b>
                                                <span>{n.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <label className="ad-theme-switch" title="Toggle dark mode">
                            <i className="fa fa-moon-o ad-switch-icon" aria-hidden="true"></i>
                            <button type="button" role="switch" aria-checked={theme === 'dark'} className="ad-switch" onClick={toggleTheme} aria-label="Toggle dark mode"></button>
                            <i className="fa fa-sun-o ad-switch-icon" aria-hidden="true"></i>
                        </label>

                        <div className="ad-topuser">
                            <button type="button" className="ad-topuser__btn" onClick={() => { setUserMenu(o => !o); setNotifOpen(false); }}>
                                <span className="ad-topuser__avatar">
                                    {user?.avatar ? <img src={user.avatar} alt={user.name} /> : <i className="fa fa-user" aria-hidden="true"></i>}
                                </span>
                                <span>
                                    <span className="ad-topuser__name">{firstName}</span>
                                    <span className="ad-topuser__role">Administrator</span>
                                </span>
                                <i className="fa fa-chevron-down ad-topuser__caret" aria-hidden="true"></i>
                            </button>
                            {userMenu && (
                                <div className="ad-dropdown">
                                    <div className="ad-dropdown__head">
                                        <b>{user?.name || 'Admin'}</b>
                                        <span>{user?.email || 'Administrator'}</span>
                                    </div>
                                    <Link to="/" className="ad-dropdown__item"><i className="fa fa-globe" aria-hidden="true"></i> View Store</Link>
                                    <Link to="/admin/settings" className="ad-dropdown__item"><i className="fa fa-cog" aria-hidden="true"></i> Settings</Link>
                                    <button type="button" className="ad-dropdown__item ad-dropdown__item--danger" onClick={logoutHandler}>
                                        <i className="fa fa-sign-out" aria-hidden="true"></i> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="ad-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
