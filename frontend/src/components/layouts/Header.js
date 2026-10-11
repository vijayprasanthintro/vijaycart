import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '../../actions/userActions';
import { useWishlist } from '../../context/WishlistContext';
import { Dropdown, Image } from 'react-bootstrap';
import SearchSuggest from './SearchSuggest';

export default function Header() {
  const { isAuthenticated, user } = useSelector((state) => state.authState);
  const { items } = useSelector((state) => state.cartState);
  const { settings } = useSelector((state) => state.settingState);
  const { count: wishlistCount } = useWishlist();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const storeName = (settings && settings.storeName && settings.storeName.trim()) || 'VijayCart';
  const storeTagline = (settings && settings.storeTagline && settings.storeTagline.trim()) || 'Marketplace';
  const supportEmail = (settings && settings.supportEmail && settings.supportEmail.trim()) || 'help@vijaycart.com';
  const supportPhone = (settings && settings.supportPhone && settings.supportPhone.trim()) || '+91 8220477466';
  const announcement = (settings && settings.announcement && settings.announcement.trim()) || '';
  const waitlistBanner = settings && settings.enableWaitlist === true
    ? ((settings.waitlistMessage && settings.waitlistMessage.trim()) || "We're launching soon — sign up for early access!")
    : '';

  const brandName = () => {
    if (storeName.toLowerCase() === 'vijaycart') {
      return (<><span>Vijay</span><span>Cart</span></>);
    }
    const idx = storeName.toLowerCase().lastIndexOf('cart');
    if (idx > 0) {
      return (<><span>{storeName.slice(0, idx)}</span><span>{storeName.slice(idx)}</span></>);
    }
    return storeName;
  };

  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  const cartCount = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileSearchOpen]);

  const logoutHandler = async () => {
    // Calls the backend /logout (clears the httpOnly cookie server-side) and
    // then dispatches logoutSuccess internally. Without the cookie being
    // cleared, a page refresh would restore the old session.
    await dispatch(logout());
    navigate('/');
  };

  const accountMenu = (
    <Dropdown.Menu align="end">
      {user?.role === 'admin' && (
        <Dropdown.Item onClick={() => navigate('/admin/dashboard')}>
          <i className="fa fa-tachometer mr-2" aria-hidden="true"></i>Admin Dashboard
        </Dropdown.Item>
      )}
      <Dropdown.Item onClick={() => navigate('/myprofile')}>
        <i className="fa fa-user mr-2" aria-hidden="true"></i>My Profile
      </Dropdown.Item>
      <Dropdown.Item onClick={() => navigate('/orders')}>
        <i className="fa fa-list-alt mr-2" aria-hidden="true"></i>My Orders
      </Dropdown.Item>
      <Dropdown.Item onClick={() => navigate('/wishlist')}>
        <i className="fa fa-heart-o mr-2" aria-hidden="true"></i>Wishlist
      </Dropdown.Item>
      <Dropdown.Item onClick={() => navigate('/myprofile/update')}>
        <i className="fa fa-cog mr-2" aria-hidden="true"></i>Account Settings
      </Dropdown.Item>
      <Dropdown.Divider />
      <Dropdown.Item onClick={logoutHandler} className="text-danger">
        <i className="fa fa-sign-out mr-2" aria-hidden="true"></i>Logout
      </Dropdown.Item>
    </Dropdown.Menu>
  );

  const accountToggle = (
    <Dropdown.Toggle variant="default" id="dropdown-basic" className="vc-nav-toggle">
      {isAuthenticated && user?.avatar ? (
        <Image width="28" height="28" src={user.avatar} roundedCircle className="vc-nav-avatar" />
      ) : (
        <i className="fa fa-user" aria-hidden="true"></i>
      )}
      <span className="vc-nav-btn-text">{isAuthenticated ? (user?.name?.split(' ')[0] || 'Account') : 'Login'}</span>
      <i className="fa fa-angle-down vc-nav-chevron" aria-hidden="true"></i>
    </Dropdown.Toggle>
  );

  return (
    <>
      {/* Store announcements / waitlist banner (from admin Settings) */}
      {(announcement || waitlistBanner) && (
        <div className={`vc-announcement${waitlistBanner && !announcement ? ' vc-announcement--waitlist' : ''}`}>
          <span>{announcement || waitlistBanner}</span>
        </div>
      )}

      {/* ==================== DESKTOP HEADER ==================== */}
      <motion.header
        className={`vc-hd ${scrolled ? 'vc-hd--scrolled' : ''}`}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="container vc-hd__inner">
          {/* Brand */}
          <Link to="/" className="vc-hd__brand">
            <span className="vc-hd__brand-icon">
              <i className="fa fa-shopping-bag" aria-hidden="true"></i>
            </span>
            <span className="vc-hd__brand-text">
              <span className="vc-hd__brand-name">{brandName()}</span>
              <span className="vc-hd__brand-tagline">{storeTagline}</span>
            </span>
          </Link>

          {/* Desktop Search */}
          <SearchSuggest variant="desktop" />

          {/* Desktop Nav Actions */}
          <nav className="vc-hd__nav" aria-label="Main navigation">

            {isAuthenticated ? (
              <Dropdown className="vc-hd__item vc-hd__item--dropdown">
                {accountToggle}
                {accountMenu}
              </Dropdown>
            ) : (
              <Link to="/login" className="vc-hd__item vc-hd__item--link vc-nav-login">
                Login
              </Link>
            )}

            <Link to="/seller" className="vc-hd__item vc-hd__item--link vc-seller-link d-none d-lg-flex">
              Become a Seller
            </Link>

            <div className="vc-hd__item vc-hd__item--more" ref={moreRef}>
              <button
                type="button"
                className="vc-hd__item-btn"
                onClick={() => setMoreOpen(!moreOpen)}
                aria-expanded={moreOpen}
                aria-haspopup="true"
              >
                <i className="fa fa-ellipsis-v" aria-hidden="true"></i>
                <span className="vc-nav-btn-text d-none d-xl-inline">More</span>
                <i className="fa fa-angle-down vc-nav-chevron d-none d-xl-inline" aria-hidden="true"></i>
              </button>
              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    className="vc-hd__dropdown"
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link to="/search/all" className="vc-hd__dropdown-item" onClick={() => setMoreOpen(false)}>
                      <i className="fa fa-percent" aria-hidden="true"></i>All Offers
                    </Link>
                    <Link to="/wishlist" className="vc-hd__dropdown-item" onClick={() => setMoreOpen(false)}>
                      <i className="fa fa-heart-o" aria-hidden="true"></i>Wishlist
                    </Link>
                    <Link to="/seller" className="vc-hd__dropdown-item" onClick={() => setMoreOpen(false)}>
                      <i className="fa fa-briefcase" aria-hidden="true"></i>Become a Seller
                    </Link>
                    <Link to="/search/all?ratings=4" className="vc-hd__dropdown-item" onClick={() => setMoreOpen(false)}>
                      <i className="fa fa-fire" aria-hidden="true"></i>Top Deals
                    </Link>
                    <div className="vc-hd__dropdown-divider"></div>
                    <div className="vc-hd__dropdown-heading">Customer Service</div>
                    <a href={`mailto:${supportEmail}`} className="vc-hd__dropdown-item" onClick={() => setMoreOpen(false)}>
                      <i className="fa fa-envelope" aria-hidden="true"></i>{supportEmail}
                    </a>
                    <a href={`tel:${supportPhone.replace(/[^+\d]/g, '')}`} className="vc-hd__dropdown-item" onClick={() => setMoreOpen(false)}>
                      <i className="fa fa-phone" aria-hidden="true"></i>{supportPhone}
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/orders" className="vc-hd__item vc-hd__item--icon" aria-label="Orders">
              <i className="fa fa-archive" aria-hidden="true"></i>
              <span className="vc-nav-btn-text d-none d-xl-inline">Orders</span>
            </Link>

            <Link to="/wishlist" className="vc-hd__item vc-hd__item--icon" aria-label="Wishlist">
              <i className="fa fa-heart-o" aria-hidden="true"></i>
              {wishlistCount > 0 && <span className="vc-hd__badge">{wishlistCount > 9 ? '9+' : wishlistCount}</span>}
              <span className="vc-nav-btn-text d-none d-xl-inline">Wishlist</span>
            </Link>

            <Link to="/cart" className="vc-hd__item vc-hd__item--icon" aria-label="Cart">
              <i className="fa fa-shopping-cart" aria-hidden="true"></i>
              {cartCount > 0 && <span className="vc-hd__badge">{cartCount > 9 ? '9+' : cartCount}</span>}
              <span className="vc-nav-btn-text d-none d-xl-inline">Cart</span>
            </Link>

          </nav>
        </div>
      </motion.header>

      {/* ==================== MOBILE HEADER ==================== */}
      <header className={`vc-mhd ${scrolled ? 'vc-mhd--scrolled' : ''}`}>

        {/* Row 1: brand only — cart/wishlist/profile live in the bottom nav */}
        <div className="vc-mhd__row">
          <Link to="/" className="vc-mhd__brand" aria-label="VijayCart Home">
            <span className="vc-mhd__brand-icon">
              <i className="fa fa-shopping-bag" aria-hidden="true"></i>
            </span>
            <span className="vc-mhd__brand-name">{brandName()}</span>
          </Link>
        </div>

        {/* Row 2: search bar (tap to expand) */}
        <div className="vc-mhd__search-row">
          <button
            type="button"
            className="vc-mhd__search-bar"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Search products"
          >
            <i className="fa fa-search vc-mhd__search-icon" aria-hidden="true"></i>
            <span className="vc-mhd__search-placeholder">Search for Products, Brands and More</span>
          </button>
        </div>
      </header>

      {/* ==================== MOBILE SEARCH OVERLAY ==================== */}
      {mobileSearchOpen && (
        <div className="vc-ms-overlay">
          <SearchSuggest variant="mobile" onDone={() => setMobileSearchOpen(false)} />
        </div>
      )}
    </>
  );
}
