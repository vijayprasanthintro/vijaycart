import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Pagination from 'react-js-pagination';
import Slider from "rc-slider";
import Tooltip from 'rc-tooltip';
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import MetaData from "../layouts/MetaData";
import Product from "./Product";
import { ProductRowSkeleton } from "../layouts/Skeletons";
import { getDiscountFor } from "../../utils/productHelper";

const PAGE_SIZE = 8;
const PRICE_MIN = 1;
const PRICE_MAX = 60000;

const CATEGORY_GROUPS = [
  { id: 'electronics', label: 'Electronics', icon: 'fa-plug', sub: ['Electronics', 'Smartphones', 'Laptops', 'Tablets', 'Headphones', 'Audio', 'Cameras', 'Monitors', 'Televisions', 'Gaming', 'Drones', 'Wearables', 'Components', 'Accessories'] },
  { id: 'tv', label: 'TVs & Appliances', icon: 'fa-television', sub: ['Televisions', 'Monitors'] },
  { id: 'men', label: 'Men', icon: 'fa-male', sub: ['Clothes/Shoes'] },
  { id: 'women', label: 'Women', icon: 'fa-female', sub: ['Clothes/Shoes'] },
  { id: 'kids', label: 'Baby & Kids', icon: 'fa-child', sub: ['Clothes/Shoes', 'Accessories'] },
  { id: 'home', label: 'Home & Furniture', icon: 'fa-home', sub: ['Home', 'Food'] },
  { id: 'sports', label: 'Sports & Outdoor', icon: 'fa-bicycle', sub: ['Sports', 'Outdoor'] },
  { id: 'books', label: 'Books', icon: 'fa-book', sub: ['Books'] },
  { id: 'grocery', label: 'Grocery', icon: 'fa-shopping-basket', sub: ['Food'] },
  { id: 'beauty', label: 'Beauty & Health', icon: 'fa-heartbeat', sub: ['Beauty/Health'] },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'popular', label: 'Popularity' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Customer Rating' },
  { value: 'newest', label: 'Newest First' },
  { value: 'discount', label: 'Discount' },
];

const DISCOUNT_OPTIONS = [10, 20, 30];
const RATING_OPTIONS = [4, 3, 2, 1];

function resolveCategoryParam(value) {
  if (!value) return { group: null, sub: null };
  const group = CATEGORY_GROUPS.find(g =>
    g.label.toLowerCase() === String(value).toLowerCase() || g.sub.includes(value)
  );
  if (!group) return { group: null, sub: value };
  const sub = group.sub.includes(value) && group.label.toLowerCase() !== String(value).toLowerCase() ? value : null;
  return { group: group.id, sub };
}

export default function ProductSearch() {
  const { keyword } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const actualKeyword = !keyword || keyword === 'all' ? '' : keyword;

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [group, setGroup] = useState(null);
  const [sub, setSub] = useState(null);
  const [brands, setBrands] = useState([]);
  const [price, setPrice] = useState([PRICE_MIN, PRICE_MAX]);
  const [priceCommitted, setPriceCommitted] = useState([PRICE_MIN, PRICE_MAX]);
  const [rating, setRating] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [excludeOOS, setExcludeOOS] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const resolved = resolveCategoryParam(params.get('category'));
    setGroup(resolved.group);
    setSub(resolved.sub);
    const urlRating = Number(params.get('ratings')) || 0;
    if (urlRating) setRating(urlRating);
    setCurrentPage(1);
  }, [location.search]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      // Fetch the whole catalogue in one request; the backend honours `limit`.
      // Keyword matching (name/brand/category) happens client-side so results
      // are consistent regardless of which backend is deployed.
      const res = await axios.get('/api/v1/products?limit=200');
      setAllProducts(res.data.products || []);
    } catch (err) {
      setPageError(err?.response?.data?.message || 'Failed to load products. Please try again.');
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const activeGroup = group ? CATEGORY_GROUPS.find(g => g.id === group) : null;
  const groupSubs = activeGroup ? activeGroup.sub : null;

  const brandOptions = useMemo(() => {
    const counts = {};
    allProducts.forEach(p => { if (p.seller) counts[p.seller] = (counts[p.seller] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allProducts]);

  const kw = actualKeyword.trim().toLowerCase();

  const filtered = useMemo(() => allProducts.filter(p => {
    // Match keyword against product name, brand (seller) and category.
    if (kw && !(
      p.name.toLowerCase().includes(kw) ||
      (p.seller || '').toLowerCase().includes(kw) ||
      (p.category || '').toLowerCase().includes(kw)
    )) return false;
    if (sub && p.category !== sub) return false;
    if (!sub && groupSubs && !groupSubs.includes(p.category)) return false;
    if (brands.length && !brands.includes(p.seller)) return false;
    if (p.price < priceCommitted[0] || p.price > priceCommitted[1]) return false;
    if (rating && Number(p.ratings) < rating) return false;
    if (discount && getDiscountFor(p._id) < discount) return false;
    if (excludeOOS && Number(p.stock) <= 0) return false;
    return true;
  }), [allProducts, kw, sub, groupSubs, brands, priceCommitted, rating, discount, excludeOOS]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case 'popular': arr.sort((a, b) => (b.numOfReviews || 0) - (a.numOfReviews || 0)); break;
      case 'price-low': arr.sort((a, b) => a.price - b.price); break;
      case 'price-high': arr.sort((a, b) => b.price - a.price); break;
      case 'rating': arr.sort((a, b) => Number(b.ratings || 0) - Number(a.ratings || 0)); break;
      case 'newest': arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); break;
      case 'discount': arr.sort((a, b) => getDiscountFor(b._id) - getDiscountFor(a._id)); break;
      default: break;
    }
    return arr;
  }, [filtered, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filtered, sortBy]);

  const totalResults = sorted.length;
  const pageCount = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const effectivePage = Math.min(currentPage, pageCount);
  const pagedProducts = sorted.slice((effectivePage - 1) * PAGE_SIZE, effectivePage * PAGE_SIZE);

  const pageTitle = sub || (keyword ? `Search results for "${keyword}"` : (activeGroup ? activeGroup.label : 'All Products'));
  const activeSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Relevance';
  const filterCount = [
    Boolean(group || sub),
    brands.length > 0,
    priceCommitted[0] > PRICE_MIN || priceCommitted[1] < PRICE_MAX,
    rating > 0,
    discount > 0,
    excludeOOS,
  ].filter(Boolean).length;

  const selectCategory = (gid, subVal) => {
    const g = CATEGORY_GROUPS.find(x => x.id === gid);
    if (!g) return;
    setGroup(gid);
    setSub(subVal || null);
    navigate(`/search/${actualKeyword || 'all'}?category=${encodeURIComponent(subVal || g.label)}`);
  };

  const clearCategory = () => {
    setGroup(null);
    setSub(null);
    navigate(`/search/${actualKeyword || 'all'}`);
  };

  const clearAllFilters = () => {
    setBrands([]);
    setPrice([PRICE_MIN, PRICE_MAX]);
    setPriceCommitted([PRICE_MIN, PRICE_MAX]);
    setRating(0);
    setDiscount(0);
    setExcludeOOS(false);
    setSortBy('relevance');
    setGroup(null);
    setSub(null);
    navigate(`/search/${actualKeyword || 'all'}`);
  };

  const toggleBrand = (name) => setBrands(prev => prev.includes(name) ? prev.filter(b => b !== name) : [...prev, name]);

  const renderPriceSlider = () => (
    <div className="ls-price-slider" onMouseUp={() => setPriceCommitted(price)} onTouchEnd={() => setPriceCommitted(price)}>
      <Slider
        range
        min={PRICE_MIN}
        max={PRICE_MAX}
        value={price}
        onChange={(p) => setPrice(p)}
        marks={{ [PRICE_MIN]: `₹${PRICE_MIN}`, [PRICE_MAX]: `₹${PRICE_MAX.toLocaleString('en-IN')}` }}
        handleRender={(renderProps) => (
          <Tooltip overlay={`₹${Number(renderProps.props['aria-valuenow']).toLocaleString('en-IN')}`}>
            <div {...renderProps.props}></div>
          </Tooltip>
        )}
      />
    </div>
  );

  const renderFilterBody = () => (
    <Fragment>
      <section className="ls-fgroup">
        <h4 className="ls-fgroup-title">Category</h4>
        <div className="ls-cat-list">
          {CATEGORY_GROUPS.map(g => (
            <div key={g.id}>
              <button
                type="button"
                className={`ls-cat-row ${group === g.id ? 'active' : ''}`}
                onClick={() => (group === g.id && !sub) ? clearCategory() : selectCategory(g.id, null)}
              >
                <span><i className={`fa ${g.icon}`} aria-hidden="true"></i> {g.label}</span>
                <i className="fa fa-chevron-right" aria-hidden="true"></i>
              </button>
              {group === g.id && (
                <div className="ls-sub-list">
                  {g.sub.filter(s => s !== g.label).map(s => (
                    <button
                      key={s}
                      type="button"
                      className={`ls-sub-link ${sub === s ? 'active' : ''}`}
                      onClick={() => sub === s ? clearCategory() : selectCategory(g.id, s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="ls-fgroup">
        <h4 className="ls-fgroup-title">Brand</h4>
        {brandOptions.length === 0 ? (
          <p className="ls-fgroup-empty">No brands in results</p>
        ) : brandOptions.map(([name, count]) => (
          <label key={name} className="ls-check">
            <input type="checkbox" checked={brands.includes(name)} onChange={() => toggleBrand(name)} />
            <span className="ls-check-mark"><i className="fa fa-check" aria-hidden="true"></i></span>
            <span className="ls-check-label">{name} <em>({count})</em></span>
          </label>
        ))}
      </section>

      <section className="ls-fgroup">
        <h4 className="ls-fgroup-title">Price</h4>
        {renderPriceSlider()}
        <div className="ls-price-range">
          <span>₹{price[0].toLocaleString('en-IN')}</span>
          <span>₹{price[1].toLocaleString('en-IN')}</span>
        </div>
      </section>

      <section className="ls-fgroup">
        <h4 className="ls-fgroup-title">Customer Ratings</h4>
        {RATING_OPTIONS.map(s => (
          <button key={s} type="button" className={`ls-opt ${rating === s ? 'active' : ''}`} onClick={() => setRating(rating === s ? 0 : s)}>
            <span className="ls-stars">{'★'.repeat(s)}</span> &amp; above
          </button>
        ))}
      </section>

      <section className="ls-fgroup">
        <h4 className="ls-fgroup-title">Discount</h4>
        {DISCOUNT_OPTIONS.map(d => (
          <button key={d} type="button" className={`ls-opt ${discount === d ? 'active' : ''}`} onClick={() => setDiscount(discount === d ? 0 : d)}>
            {d}% or more
          </button>
        ))}
      </section>

      <section className="ls-fgroup">
        <h4 className="ls-fgroup-title">Availability</h4>
        <label className="ls-check">
          <input type="checkbox" checked={excludeOOS} onChange={(e) => setExcludeOOS(e.target.checked)} />
          <span className="ls-check-mark"><i className="fa fa-check" aria-hidden="true"></i></span>
          <span className="ls-check-label">Exclude out of stock</span>
        </label>
      </section>
    </Fragment>
  );

  const crumbs = [{ label: 'Home', to: '/' }];
  if (activeGroup) crumbs.push({ label: activeGroup.label, to: `/search/${actualKeyword || 'all'}?category=${encodeURIComponent(activeGroup.label)}` });
  if (sub) crumbs.push({ label: sub });
  if (keyword) crumbs.push({ label: `"${keyword}"` });
  if (crumbs.length === 1) crumbs.push({ label: 'All Products' });

  return (
    <Fragment>
      <MetaData title={pageTitle} />

      <div className="container ls-page">
        <nav className="ls-breadcrumb" aria-label="breadcrumb">
          {crumbs.map((c, i) => (
            <Fragment key={i}>
              {i > 0 && <span className="ls-crumb-sep">›</span>}
              {i === crumbs.length - 1 ? (
                <span className="ls-crumb-current">{c.label}</span>
              ) : (
                <Link to={c.to}>{c.label}</Link>
              )}
            </Fragment>
          ))}
        </nav>

        <div className="ls-layout">
          <aside className="ls-sidebar d-none d-lg-block">
            <div className="ls-sidebar-sticky">
              <div className="ls-sidebar-head">
                <span className="ls-filter-title">Filters</span>
                {filterCount > 0 && (
                  <button type="button" className="ls-clear-all" onClick={clearAllFilters}>Clear All</button>
                )}
              </div>
              {renderFilterBody()}
            </div>
          </aside>

          <main className="ls-main">
            <div className="ls-head">
              <div>
                <h1 className="ls-title">{pageTitle}</h1>
                <span className="ls-count">{totalResults} product{totalResults === 1 ? '' : 's'} found</span>
              </div>
              <div className="ls-sort d-none d-md-flex">
                <span className="ls-sort-label">Sort by</span>
                <select
                  className="ls-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort products"
                >
                  {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <ProductRowSkeleton count={4} />
            ) : pageError ? (
              <div className="section-state">
                <div className="section-state__icon"><i className="fa fa-cloud-upload" aria-hidden="true"></i></div>
                <h3 className="section-state__title">Something went wrong</h3>
                <p className="section-state__sub">{pageError}</p>
                <button type="button" className="empty-cta" onClick={loadProducts}>
                  <i className="fa fa-refresh mr-1" aria-hidden="true"></i> Try Again
                </button>
              </div>
            ) : totalResults === 0 ? (
              <div className="section-state">
                <div className="section-state__icon"><i className="fa fa-search" aria-hidden="true"></i></div>
                <h3 className="section-state__title">No Products Found</h3>
                <p className="section-state__sub">We couldn't find anything matching your search. Try different keywords or clear some filters.</p>
                <Link to="/search/all" className="empty-cta"><i className="fa fa-refresh mr-1" aria-hidden="true"></i> View All Products</Link>
              </div>
            ) : (
              <Fragment>
                <div className="row">
                  {pagedProducts.map(product => (
                    <Product key={product._id} product={product} col={4} />
                  ))}
                </div>

                {totalResults > PAGE_SIZE && (
                  <div className="d-flex justify-content-center mt-5">
                    <Pagination
                      activePage={effectivePage}
                      onChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      totalItemsCount={totalResults}
                      itemsCountPerPage={PAGE_SIZE}
                      nextPageText={'Next'}
                      prevPageText={'Prev'}
                      firstPageText={'First'}
                      lastPageText={'Last'}
                      itemClass={'page-item'}
                      linkClass={'page-link'}
                    />
                  </div>
                )}
              </Fragment>
            )}
          </main>
        </div>
      </div>

      <div className="ls-mbar d-lg-none">
        <button type="button" className="ls-mbtn ls-mbtn-filter" onClick={() => setShowFilterSheet(true)}>
          <i className="fa fa-sliders" aria-hidden="true"></i> Filter
          {filterCount > 0 && <span className="ls-mbadge">{filterCount}</span>}
        </button>
        <button type="button" className="ls-mbtn ls-mbtn-sort" onClick={() => setShowSortSheet(true)}>
          <i className="fa fa-sort-amount-desc" aria-hidden="true"></i> Sort: {activeSortLabel}
        </button>
      </div>

      {showFilterSheet && (
        <div className="ls-sheet" role="dialog" aria-label="Filters">
          <div className="ls-sheet-head">
            <h2 className="ls-sheet-title">Filters</h2>
            <button type="button" className="ls-sheet-close" onClick={() => setShowFilterSheet(false)} aria-label="Close filters">&times;</button>
          </div>
          {renderFilterBody()}
          <button type="button" className="ls-sheet-apply" onClick={() => setShowFilterSheet(false)}>Apply Filters</button>
        </div>
      )}

      {showSortSheet && (
        <div className="ls-sheet" role="dialog" aria-label="Sort products">
          <div className="ls-sheet-head">
            <h2 className="ls-sheet-title">Sort By</h2>
            <button type="button" className="ls-sheet-close" onClick={() => setShowSortSheet(false)} aria-label="Close sort">&times;</button>
          </div>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`ls-opt ls-opt-block ${sortBy === opt.value ? 'active' : ''}`}
              onClick={() => { setSortBy(opt.value); setShowSortSheet(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </Fragment>
  );
}
