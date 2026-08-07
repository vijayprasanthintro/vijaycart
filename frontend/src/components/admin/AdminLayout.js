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
    '/admin/analytics': { title: 'Analytics', sub: 'Traffic, orders & trends' },
    '/admin/revenue': { title: 'Revenue', sub: 'Earnings & payment insights' },
    '/admin/inventory': { title: 'Inventory', sub: 'Stock levels & alerts' },
    '/admin/reviews': { title: 'Reviews', sub: 'Customer feedback & ratings' },
    '/admin/settings': { title: 'Settings', sub: 'Store configuration' },
    '/admin/permissions': { title: 'Permissions', sub: 'Roles & access control' }
};

export default function AdminLayout() {
    const { user } = useSelector(state => state.authState);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const [theme, setTheme] = useState(() => localStorage.getItem('vc-admin-theme') || 'light');
    const [navOpen, setNavOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('vc-admin-theme', theme);
    }, [theme]);

    useEffect(() => {
        setNavOpen(false);
    }, [location.pathname]);

    const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

    const logoutHandler = () => {
        dispatch(logout());
        dispatch(clearAuthError());
        navigate('/login');
    };

    const page = TITLES[location.pathname] || { title: 'Admin', sub: '' };
    const firstName = (user?.name || 'Admin').split(' ')[0];

    return (
        <div className={`ad-layout ${navOpen ? 'ad-layout--nav-open' : ''}`} data-theme={theme}>
            <div className="ad-sidebar-overlay" onClick={() => setNavOpen(false)}></div>

            <aside className="ad-sidebar">
                <div className="ad-sidebar__brand">
                    <i className="fa fa-shopping-bag" aria-hidden="true"></i>
                    <span>Vijay<span>Cart</span> Admin</span>
                </div>
                <nav className="ad-sidebar__nav">
                    {NAV.map(group => (
                        <div key={group.group}>
                            <div className="ad-sidebar__group-title">{group.group}</div>
                            {group.items.map(item => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) => `ad-sidebar__item ${isActive ? 'ad-sidebar__item--active' : ''}`}
                                >
                                    <i className={`fa ${item.icon}`} aria-hidden="true"></i>
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>
                <div className="ad-sidebar__foot">
                    <Link to="/"><i className="fa fa-globe" aria-hidden="true"></i> View Store</Link>
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
                        <label className="ad-theme-switch" title="Toggle dark mode">
                            <i className={`fa fa-moon-o ad-switch-icon`} aria-hidden="true"></i>
                            <button type="button" role="switch" aria-checked={theme === 'dark'} className="ad-switch" onClick={toggleTheme} aria-label="Toggle dark mode"></button>
                            <i className={`fa fa-sun-o ad-switch-icon`} aria-hidden="true"></i>
                        </label>
                        <div className="ad-topuser">
                            <div className="ad-topuser__avatar">
                                {user?.avatar ? <img src={user.avatar} alt={user.name} /> : <i className="fa fa-user" aria-hidden="true"></i>}
                            </div>
                            <div>
                                <div className="ad-topuser__name">{firstName}</div>
                                <div className="ad-topuser__role">Administrator</div>
                            </div>
                            <button type="button" className="ad-topuser__logout" onClick={logoutHandler}>
                                <i className="fa fa-sign-out mr-1" aria-hidden="true"></i><span>Logout</span>
                            </button>
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
