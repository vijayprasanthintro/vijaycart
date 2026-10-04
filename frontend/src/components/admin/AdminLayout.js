import { useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../actions/userActions';
import { clearAuthError } from '../../actions/userActions';
import { getSettings } from '../../actions/settingActions';
import { getAnalytics } from '../../actions/analyticsActions';
import './admin.css';

const NAV = [
    {
        group: 'Overview',
        items: [
            { to: '/admin/dashboard', icon: 'fa-tachometer', label: 'Dashboard', perm: 'dashboard' }
        ]
    },
    {
        group: 'Management',
        items: [
            { to: '/admin/orders', icon: 'fa-shopping-basket', label: 'Orders', perm: 'orders' },
            { to: '/admin/products', icon: 'fa-cube', label: 'Products', perm: 'products' },
            { to: '/admin/categories', icon: 'fa-th-large', label: 'Categories', perm: 'categories' },
            { to: '/admin/coupons', icon: 'fa-ticket', label: 'Coupons', perm: 'coupons' },
            { to: '/admin/banners', icon: 'fa-image', label: 'Banners', perm: 'banners' },
            { to: '/admin/users', icon: 'fa-users', label: 'Users', perm: 'users' },
            { to: '/admin/pincodes', icon: 'fa-map-marker', label: 'Pincode & COD', perm: 'pincodes' }
        ]
    },
    {
        group: 'Delivery',
        items: [
            { to: '/admin/delivery', icon: 'fa-truck', label: 'Assign Delivery', perm: 'delivery' },
            { to: '/admin/delivery-boys', icon: 'fa-motorcycle', label: 'Delivery Boys', perm: 'delivery' }
        ]
    },
    {
        group: 'Sellers',
        items: [
            { to: '/admin/seller-applications', icon: 'fa-briefcase', label: 'Seller Applications', perm: 'sellers' }
        ]
    },
    {
        group: 'Insights',
        items: [
            { to: '/admin/analytics', icon: 'fa-line-chart', label: 'Analytics', perm: 'analytics' },
            { to: '/admin/revenue', icon: 'fa-rupee', label: 'Revenue', perm: 'revenue' },
            { to: '/admin/inventory', icon: 'fa-industry', label: 'Inventory', perm: 'inventory' },
            { to: '/admin/reviews', icon: 'fa-star', label: 'Reviews', perm: 'reviews' },
            { to: '/admin/reports', icon: 'fa-file-excel-o', label: 'Reports & Exports', perm: 'reports' }
        ]
    },
    {
        group: 'System',
        items: [
            { to: '/admin/settings', icon: 'fa-cog', label: 'Settings', perm: 'settings' },
            { to: '/admin/permissions', icon: 'fa-shield', label: 'Permissions', perm: 'permissions' }
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
    '/admin/seller-applications': { title: 'Seller Applications', sub: 'Review "Become a Seller" requests' },
    '/admin/analytics': { title: 'Analytics', sub: 'Orders, revenue & customer insights' },
    '/admin/revenue': { title: 'Revenue', sub: 'Earnings & payment insights' },
    '/admin/inventory': { title: 'Inventory', sub: 'Stock levels & alerts' },
    '/admin/reviews': { title: 'Reviews', sub: 'Customer feedback & ratings' },
    '/admin/banners': { title: 'Banners', sub: 'Homepage promotional banners' },
    '/admin/settings': { title: 'Settings', sub: 'Store configuration' },
    '/admin/permissions': { title: 'Permissions', sub: 'Roles & access control' },
    '/admin/reports': { title: 'Reports & Exports', sub: 'Download Orders, Products, Customers, Inventory & Revenue' },
    '/admin/pincodes': { title: 'Pincode & COD', sub: 'Serviceable pincodes & COD availability' }
};

// Quick global jump — maps a keyword to the most relevant admin section.
const SEARCH_ROUTES = [
    { re: /order|deliver|ship|payment|cod/i, to: '/admin/orders', label: 'Orders', icon: 'fa-shopping-basket' },
    { re: /product|catalog|item|price/i, to: '/admin/products', label: 'Products', icon: 'fa-cube' },
    { re: /user|customer|account|admin/i, to: '/admin/users', label: 'Users', icon: 'fa-users' },
    { re: /coupon|promo|discount|code/i, to: '/admin/coupons', label: 'Coupons', icon: 'fa-ticket' },
    { re: /review|rating|feedback/i, to: '/admin/reviews', label: 'Reviews', icon: 'fa-star' },
    { re: /banner|hero|carousel|slide|promo/i, to: '/admin/banners', label: 'Banners', icon: 'fa-image' },
    { re: /inventory|stock|warehouse/i, to: '/admin/inventory', label: 'Inventory', icon: 'fa-industry' },
    { re: /analytic|traffic|trend|sales/i, to: '/admin/analytics', label: 'Analytics', icon: 'fa-line-chart' },
    { re: /revenue|earning|money|profit/i, to: '/admin/revenue', label: 'Revenue', icon: 'fa-rupee' },
    { re: /categor|collection/i, to: '/admin/categories', label: 'Categories', icon: 'fa-th-large' },
    { re: /setting|config|permission|role/i, to: '/admin/settings', label: 'Settings', icon: 'fa-cog' },
    { re: /boy|rider|partner/i, to: '/admin/delivery-boys', label: 'Delivery Boys', icon: 'fa-motorcycle' },
    { re: /seller|become a seller|application|store/i, to: '/admin/seller-applications', label: 'Seller Applications', icon: 'fa-briefcase' },
    { re: /report|export|csv|excel|download/i, to: '/admin/reports', label: 'Reports & Exports', icon: 'fa-file-excel-o' },
    { re: /pincode|postal|zip|cod|serviceable/i, to: '/admin/pincodes', label: 'Pincode & COD', icon: 'fa-map-marker' }
];

// Build real notifications from the live analytics aggregate. Only non-zero
// items are shown so the bell badge always reflects actual store activity.
const buildNotifications = (a = {}) => {
    const statusCounts = a.statusCounts || {};
    const pending = statusCounts['Pending'] || 0;
    const low = a.lowStock || 0;
    const oos = a.outOfStock || 0;
    const returns = a.returnRequests || 0;
    const list = [];
    if (pending) list.push({ icon: 'fa-shopping-basket', tone: 'ad-stat--info', title: `${pending} order${pending === 1 ? '' : 's'} pending confirmation`, time: 'Live' });
    if (low) list.push({ icon: 'fa-exclamation-triangle', tone: 'ad-stat--warning', title: `${low} product${low === 1 ? '' : 's'} running low on stock`, time: 'Live' });
    if (oos) list.push({ icon: 'fa-cube', tone: 'ad-stat--danger', title: `${oos} product${oos === 1 ? '' : 's'} out of stock`, time: 'Live' });
    if (returns) list.push({ icon: 'fa-refresh', tone: 'ad-stat--danger', title: `${returns} return request${returns === 1 ? '' : 's'} received`, time: 'Live' });
    return list;
};

// Group + title for the current route (exact match, then detail-page prefix).
const findNav = path => {
    const exact = (g, item) => item.to === path;
    for (const g of NAV) for (const item of g.items) if (exact(g, item)) return { group: g.group, title: (TITLES[item.to] || {}).title || item.label, sub: (TITLES[item.to] || {}).sub || '' };
    for (const g of NAV) for (const item of g.items) {
        if (item.to !== '/admin/dashboard' && path.startsWith(item.to + '/')) return { group: g.group, title: (TITLES[item.to] || {}).title || item.label, sub: (TITLES[item.to] || {}).sub || '' };
    }
    return { group: '', title: (TITLES[path] || {}).title || 'Admin', sub: (TITLES[path] || {}).sub || '' };
};

export default function AdminLayout() {
    const { user } = useSelector(state => state.authState);
    const { settings } = useSelector(state => state.settingState);
    const { analytics } = useSelector(state => state.analyticsState);
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
        dispatch(getSettings());
        dispatch(getAnalytics());
    }, [dispatch]);

    // Enforce the admin permission matrix on the sidebar: modules toggled off
    // for the admin role are hidden from the menu. No saved matrix yet = show
    // everything (default open) so nothing breaks before the first save.
    const adminPerms = settings?.permissions?.admin || null;
    const visibleNav = adminPerms
        ? NAV
            .map(group => ({ ...group, items: group.items.filter(i => adminPerms[i.perm] !== false) }))
            .filter(group => group.items.length > 0)
        : NAV;

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

    const nav = findNav(location.pathname);
    const notifications = buildNotifications(analytics);
    const firstName = (user?.name || 'Admin').split(' ')[0];

    return (
        <div className={`ad-layout ${navOpen ? 'ad-layout--nav-open' : ''} ${collapsed ? 'ad-layout--collapsed' : ''}`} data-theme={theme}>
            <div className="ad-sidebar-overlay" onClick={() => setNavOpen(false)}></div>

            <aside className="ad-sidebar">
                <div className="ad-sidebar__brand">
                    <span className="ad-sidebar__brand-logo"><i className="fa fa-shopping-bag" aria-hidden="true"></i></span>
                    <span className="ad-sidebar__brand-word">Vijay<span>Cart</span> Admin</span>
                    <span className="ad-sidebar__brand-pro">PRO</span>
                </div>
                <nav className="ad-sidebar__nav">
                    {visibleNav.map(group => (
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
                <div className="ad-sidebar__user">
                    <span className="ad-sidebar__user-avatar">
                        {user?.avatar ? <img src={user.avatar} alt={user?.name || 'Admin'} /> : <i className="fa fa-user" aria-hidden="true"></i>}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="ad-sidebar__user-name">{user?.name || 'Administrator'}</div>
                        <div className="ad-sidebar__user-role">Store Admin · VijayCart</div>
                    </div>
                </div>
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
                        <div className="ad-topbar__title">{nav.title}</div>
                        <nav className="ad-crumb" aria-label="Breadcrumb">
                            <span>Home</span>
                            {nav.group && <><i className="fa fa-angle-right" aria-hidden="true"></i><span>{nav.group}</span></>}
                            <i className="fa fa-angle-right" aria-hidden="true"></i>
                            <b>{nav.title}</b>
                        </nav>
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
                                {notifications.length > 0 && <span className="ad-iconbtn__badge">{notifications.length}</span>}
                            </button>
                            {notifOpen && (
                                <div className="ad-dropdown ad-dropdown--notif">
                                    <div className="ad-dropdown__head">
                                        <b>Notifications</b>
                                        <span>{notifications.length > 0 ? `${notifications.length} update${notifications.length === 1 ? '' : 's'}` : 'All clear'}</span>
                                    </div>
                                    {notifications.length === 0 && (
                                        <div className="ad-dropdown__empty"><i className="fa fa-check-circle" aria-hidden="true"></i> No pending alerts right now.</div>
                                    )}
                                    {notifications.map((n, i) => (
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
