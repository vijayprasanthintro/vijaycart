import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function BottomNavigation() {
  const { isAuthenticated } = useSelector((state) => state.authState);
  const { items } = useSelector((state) => state.cartState);
  const location = useLocation();

  const cartCount = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

  const accountPath = isAuthenticated ? '/myprofile' : '/login';

  const itemsList = [
    { to: '/', icon: 'fa-home', label: 'Home', end: true },
    { to: '/search/all', icon: 'fa-play-circle', label: 'Play' },
    { to: '/search/all?ratings=4', icon: 'fa-tags', label: 'Top Deals' },
    { to: accountPath, icon: 'fa-user', label: 'Account' },
    { to: '/cart', icon: 'fa-shopping-cart', label: 'Cart', badge: cartCount },
  ];

  const onSearch = location.pathname.startsWith('/search/all');
  const onSearchWithRatings = onSearch && new URLSearchParams(location.search).get('ratings');

  const isItemActive = (item) => {
    if (item.to === '/') return location.pathname === '/';
    if (item.to === '/search/all') return onSearch && !onSearchWithRatings;
    if (item.to.includes('ratings')) return onSearch && Boolean(onSearchWithRatings);
    return location.pathname.startsWith(item.to.split('?')[0]);
  };

  return (
    <nav className="bottom-nav" aria-label="Bottom navigation">
      {itemsList.map((item) => {
        const active = isItemActive(item);
        return (
          <Link
            key={item.label}
            to={item.to}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="bottom-nav-icon">
              <i className={`fa ${item.icon}`} aria-hidden="true"></i>
            </span>
            <span className="bottom-nav-label">{item.label}</span>
            {item.badge > 0 && <span className="bottom-nav-badge">{item.badge > 9 ? '9+' : item.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
