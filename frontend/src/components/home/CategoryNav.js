import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCategories } from '../../actions/categoryActions';
import { STOREFRONT_CATEGORIES } from '../../designs/storefrontContent';

// One curated list shared with the Design Studio preview and the quick-access
// cards, so the live navigation cannot drift from what the admin sees.
const NAV_CATEGORIES = STOREFRONT_CATEGORIES.map((category) => ({
  label: category.label,
  icon: category.icon,
  cls: category.cls,
  to: category.to,
  active: (pathname, query) => query === category.category,
  children: [],
}));

function CategoryDropdown({ cat, onClose }) {
  if (!cat.children || cat.children.length === 0) return null;

  return (
    <div className="vc-cn-dd" role="menu">
      <div className="vc-cn-dd__header">
        <span className="vc-cn-dd__header-label">{cat.label}</span>
      </div>
      {cat.children.map((child) => (
        <Link
          key={child.label}
          to={child.to}
          className="vc-cn-dd__item"
          role="menuitem"
          onClick={onClose}
        >
          <i className={`fa ${child.icon} vc-cn-dd__item-icon`} aria-hidden="true"></i>
          <span>{child.label}</span>
        </Link>
      ))}
    </div>
  );
}

export default function CategoryNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const categoriesFromStore = useSelector((state) => state.categoryState.categories);
  const publicCategories = useMemo(() => categoriesFromStore || [], [categoriesFromStore]);
  const queryParams = new URLSearchParams(location.search);
  const activeCategory = queryParams.get('category');

  useEffect(() => {
    dispatch(getCategories());
    const refresh = () => {
      if (document.visibilityState === 'visible') dispatch(getCategories());
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [dispatch]);

  // Admin-hidden/deleted categories must disappear from public navigation.
  // Until the public categories request resolves, show the full catalog so
  // there is no flicker of an empty bar.
  const visibleCategories = useMemo(() => {
    if (!publicCategories.length) return NAV_CATEGORIES;
    const hidden = new Set(publicCategories.filter((c) => c.active === false).map((c) => c.name.toLowerCase()));
    const groupIsHidden = (label) => {
      const l = label.toLowerCase();
      if (hidden.has(l)) return true;
      if (l === 'tv & appliances' && ['televisions', 'monitors'].every((n) => hidden.has(n))) return true;
      return false;
    };
    return NAV_CATEGORIES
      .filter((cat) => !groupIsHidden(cat.label))
      .map((cat) => ({
        ...cat,
        children: (cat.children || []).filter((child) => !hidden.has(child.label.toLowerCase()))
      }));
  }, [publicCategories]);
  const [mobileDropdown, setMobileDropdown] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [desktopScrollBtns, setDesktopScrollBtns] = useState({ left: false, right: false });
  const desktopScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);
  const hoverTimerRef = useRef(null);

  const isActive = useCallback((cat) => {
    if (cat.active) return cat.active(location.pathname, activeCategory);
    return activeCategory === decodeURIComponent(new URL(cat.to, window.location.origin).searchParams.get('category'));
  }, [location.pathname, activeCategory]);

  useEffect(() => {
    setMobileDropdown(null);
  }, [location.pathname, location.search]);

  const checkDesktopScroll = useCallback(() => {
    const el = desktopScrollRef.current;
    if (!el) return;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 2;
    setDesktopScrollBtns(prev => (prev.left === left && prev.right === right ? prev : { left, right }));
  }, []);

  useEffect(() => {
    const el = desktopScrollRef.current;
    if (!el) return;
    checkDesktopScroll();
    el.addEventListener('scroll', checkDesktopScroll, { passive: true });
    window.addEventListener('resize', checkDesktopScroll);
    return () => {
      el.removeEventListener('scroll', checkDesktopScroll);
      window.removeEventListener('resize', checkDesktopScroll);
    };
  }, [checkDesktopScroll]);

  const scrollDesktop = (dir) => {
    const el = desktopScrollRef.current;
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
          {desktopScrollBtns.left && (
            <button
              type="button"
              className="vc-cn__arrow vc-cn__arrow--left"
              onClick={() => scrollDesktop(-1)}
              aria-label="Scroll categories left"
            >
              <i className="fa fa-chevron-left" aria-hidden="true"></i>
            </button>
          )}

          <div className="vc-cn__scroll" ref={desktopScrollRef}>
            {visibleCategories.map((cat, idx) => {
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
                  {hasDropdown && isOpen && <CategoryDropdown cat={cat} onClose={() => setHoveredIdx(null)} />}
                </div>
              );
            })}
          </div>

          {desktopScrollBtns.right && (
            <button
              type="button"
              className="vc-cn__arrow vc-cn__arrow--right"
              onClick={() => scrollDesktop(1)}
              aria-label="Scroll categories right"
            >
              <i className="fa fa-chevron-right" aria-hidden="true"></i>
            </button>
          )}
        </div>
      </nav>

      {/* ===== MOBILE CATEGORY NAV ===== */}
      <nav className="vc-cn-m" aria-label="Category navigation">
        <div className="vc-cn-m__scroll" ref={mobileScrollRef}>
          {visibleCategories.map((cat) => {
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

        {mobileDropdown && (
          <div className="vc-cn-m__dropdown">
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
          </div>
        )}
      </nav>
    </>
  );
}
