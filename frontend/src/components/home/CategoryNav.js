import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { easeOutExpo } from '../../utils/motion';

const ddItemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: easeOutExpo } },
};

const NAV_CATEGORIES = [
  {
    label: 'Electronics',
    icon: 'fa-plug',
    cls: 'vc-cn-icon--electronics',
    to: '/search/all?category=Electronics',
    active: (p, q) => q === 'Electronics',
    children: [
      { label: 'Smartphones', icon: 'fa-mobile', to: '/search/all?category=Smartphones' },
      { label: 'Laptops', icon: 'fa-laptop', to: '/search/all?category=Laptops' },
      { label: 'Headphones', icon: 'fa-headphones', to: '/search/all?category=Headphones' },
      { label: 'Audio', icon: 'fa-volume-up', to: '/search/all?category=Audio' },
      { label: 'Tablets', icon: 'fa-tablet', to: '/search/all?category=Tablets' },
      { label: 'Gaming', icon: 'fa-gamepad', to: '/search/all?category=Gaming' },
      { label: 'Cameras', icon: 'fa-camera', to: '/search/all?category=Cameras' },
      { label: 'Wearables', icon: 'fa-clock-o', to: '/search/all?category=Wearables' },
      { label: 'Accessories', icon: 'fa-keyboard-o', to: '/search/all?category=Accessories' },
      { label: 'Drones', icon: 'fa-plane', to: '/search/all?category=Drones' },
      { label: 'Components', icon: 'fa-microchip', to: '/search/all?category=Components' },
    ],
  },
  {
    label: 'TVs & Appliances',
    icon: 'fa-television',
    cls: 'vc-cn-icon--appliances',
    to: '/search/all?category=Televisions',
    active: (p, q) => q === 'Televisions' || q === 'Monitors',
    children: [
      { label: 'Televisions', icon: 'fa-television', to: '/search/all?category=Televisions' },
      { label: 'Monitors', icon: 'fa-desktop', to: '/search/all?category=Monitors' },
    ],
  },
  {
    label: 'Men',
    icon: 'fa-male',
    cls: 'vc-cn-icon--men',
    to: '/search/all?category=Clothes%2FShoes',
    active: (p, q) => q === 'Clothes/Shoes',
    children: [
      { label: 'Clothing', icon: 'fa-tshirt', to: '/search/all?category=Clothes%2FShoes' },
      { label: 'Watches', icon: 'fa-clock-o', to: '/search/all?category=Accessories' },
    ],
  },
  {
    label: 'Women',
    icon: 'fa-female',
    cls: 'vc-cn-icon--women',
    to: '/search/all?category=Clothes%2FShoes',
    active: (p, q) => q === 'Clothes/Shoes',
    children: [
      { label: 'Clothing', icon: 'fa-tshirt', to: '/search/all?category=Clothes%2FShoes' },
      { label: 'Watches', icon: 'fa-clock-o', to: '/search/all?category=Accessories' },
    ],
  },
  {
    label: 'Baby & Kids',
    icon: 'fa-child',
    cls: 'vc-cn-icon--kids',
    to: '/search/all?category=Accessories',
    active: (p, q) => false,
    children: [],
  },
  {
    label: 'Home & Furniture',
    icon: 'fa-home',
    cls: 'vc-cn-icon--home',
    to: '/search/all?category=Home',
    active: (p, q) => q === 'Home',
    children: [
      { label: 'Home Décor', icon: 'fa-paint-brush', to: '/search/all?category=Home' },
      { label: 'Kitchen', icon: 'fa-cutlery', to: '/search/all?category=Home' },
    ],
  },
  {
    label: 'Sports',
    icon: 'fa-futbol-o',
    cls: 'vc-cn-icon--sports',
    to: '/search/all?category=Sports',
    active: (p, q) => q === 'Sports' || q === 'Outdoor',
    children: [
      { label: 'Sports', icon: 'fa-futbol-o', to: '/search/all?category=Sports' },
      { label: 'Outdoor', icon: 'fa-tree', to: '/search/all?category=Outdoor' },
    ],
  },
  {
    label: 'Books',
    icon: 'fa-book',
    cls: 'vc-cn-icon--books',
    to: '/search/all?category=Books',
    active: (p, q) => q === 'Books',
    children: [],
  },
  {
    label: 'Grocery',
    icon: 'fa-shopping-basket',
    cls: 'vc-cn-icon--grocery',
    to: '/search/all?category=Food',
    active: (p, q) => q === 'Food',
    children: [],
  },
  {
    label: 'Beauty/Health',
    icon: 'fa-heartbeat',
    cls: 'vc-cn-icon--beauty',
    to: '/search/all?category=Beauty%2FHealth',
    active: (p, q) => q === 'Beauty/Health',
    children: [],
  },
];

function CategoryDropdown({ cat, onClose }) {
  if (!cat.children || cat.children.length === 0) return null;

  return (
    <motion.div
      className="vc-cn-dd"
      role="menu"
      initial="hidden"
      animate="show"
      exit="hidden"
      variants={{
        hidden: { opacity: 0, y: 8, scale: 0.98 },
        show: { opacity: 1, y: 0, scale: 1, transition: { staggerChildren: 0.04, delayChildren: 0.03 } },
      }}
    >
      <motion.div className="vc-cn-dd__header" variants={ddItemVariants}>
        <span className="vc-cn-dd__header-label">{cat.label}</span>
      </motion.div>
      {cat.children.map((child) => (
        <motion.div key={child.label} variants={ddItemVariants}>
          <Link
            to={child.to}
            className="vc-cn-dd__item"
            role="menuitem"
            onClick={onClose}
          >
            <i className={`fa ${child.icon} vc-cn-dd__item-icon`} aria-hidden="true"></i>
            <span>{child.label}</span>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function CategoryNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const activeCategory = queryParams.get('category');
  const [mobileDropdown, setMobileDropdown] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [scrollBtns, setScrollBtns] = useState({ left: false, right: false });
  const scrollRef = useRef(null);
  const hoverTimerRef = useRef(null);

  const isActive = useCallback((cat) => {
    if (cat.active) return cat.active(location.pathname, activeCategory);
    return activeCategory === decodeURIComponent(new URL(cat.to, window.location.origin).searchParams.get('category'));
  }, [location.pathname, activeCategory]);

  useEffect(() => {
    setMobileDropdown(null);
  }, [location.pathname, location.search]);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollBtns({ left: el.scrollLeft > 2, right: el.scrollLeft < el.scrollWidth - el.clientWidth - 2 });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => { el.removeEventListener('scroll', checkScroll); window.removeEventListener('resize', checkScroll); };
  }, [checkScroll]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  const handleHoverEnter = (idx) => {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setHoveredIdx(idx), 80);
  };

  const handleHoverLeave = () => {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setHoveredIdx(null), 120);
  };

  useEffect(() => () => clearTimeout(hoverTimerRef.current), []);

  return (
    <>
      {/* ===== DESKTOP CATEGORY NAV ===== */}
      <nav className="vc-cn" aria-label="Category navigation">
        <div className="vc-cn__inner">
          {scrollBtns.left && (
            <button
              type="button"
              className="vc-cn__arrow vc-cn__arrow--left"
              onClick={() => scroll(-1)}
              aria-label="Scroll categories left"
            >
              <i className="fa fa-chevron-left" aria-hidden="true"></i>
            </button>
          )}

          <div className="vc-cn__scroll" ref={scrollRef}>
            {NAV_CATEGORIES.map((cat, idx) => {
              const active = isActive(cat);
              const hasDropdown = cat.children && cat.children.length > 0;
              const isOpen = hoveredIdx === idx;

              return (
                <div
                  key={cat.label}
                  className={`vc-cn__item ${active ? 'vc-cn__item--active' : ''} ${hasDropdown ? 'vc-cn__item--dropdown' : ''}`}
                  onMouseEnter={() => hasDropdown && handleHoverEnter(idx)}
                  onMouseLeave={handleHoverLeave}
                >
                  <Link
                    to={cat.to}
                    className="vc-cn__link"
                    aria-current={active ? 'page' : undefined}
                    tabIndex={0}
                  >
                    <span className={`vc-cn__icon ${cat.cls}`}>
                      <i className={`fa ${cat.icon}`} aria-hidden="true"></i>
                    </span>
                    <span className="vc-cn__label">{cat.label}</span>
                    {hasDropdown && (
                      <i className={`fa fa-angle-down vc-cn__chevron ${isOpen ? 'vc-cn__chevron--open' : ''}`} aria-hidden="true"></i>
                    )}
                  </Link>
                  {hasDropdown && (
                    <AnimatePresence>
                      {isOpen && <CategoryDropdown cat={cat} onClose={() => setHoveredIdx(null)} />}
                    </AnimatePresence>
                  )}
                </div>
              );
            })}
          </div>

          {scrollBtns.right && (
            <button
              type="button"
              className="vc-cn__arrow vc-cn__arrow--right"
              onClick={() => scroll(1)}
              aria-label="Scroll categories right"
            >
              <i className="fa fa-chevron-right" aria-hidden="true"></i>
            </button>
          )}
        </div>
      </nav>

      {/* ===== MOBILE CATEGORY NAV ===== */}
      <nav className="vc-cn-m" aria-label="Category navigation">
        <div className="vc-cn-m__scroll" ref={scrollRef}>
          {NAV_CATEGORIES.map((cat) => {
            const active = isActive(cat);
            const hasDropdown = cat.children && cat.children.length > 0;
            return (
              <button
                key={cat.label}
                type="button"
                className={`vc-cn-m__chip ${active ? 'vc-cn-m__chip--active' : ''}`}
                onClick={() => {
                  if (hasDropdown) {
                    setMobileDropdown(mobileDropdown === cat.label ? null : cat.label);
                  } else {
                    navigate(cat.to);
                    setMobileDropdown(null);
                  }
                }}
              >
                <span className={`vc-cn__icon ${cat.cls}`}>
                  <i className={`fa ${cat.icon}`} aria-hidden="true"></i>
                </span>
                <span className="vc-cn-m__label">{cat.label}</span>
                {hasDropdown && (
                  <i className={`fa fa-angle-down vc-cn-m__chevron ${mobileDropdown === cat.label ? 'vc-cn-m__chevron--open' : ''}`} aria-hidden="true"></i>
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {mobileDropdown && (
            <motion.div
              className="vc-cn-m__dropdown"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: easeOutExpo }}
            >
              {NAV_CATEGORIES.find((c) => c.label === mobileDropdown)?.children.map((child) => (
                <Link
                  key={child.label}
                  to={child.to}
                  className="vc-cn-m__dd-item"
                  onClick={() => setMobileDropdown(null)}
                >
                  <i className={`fa ${child.icon} vc-cn-m__dd-icon`} aria-hidden="true"></i>
                  <span>{child.label}</span>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
