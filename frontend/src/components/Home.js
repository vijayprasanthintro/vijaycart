import { Fragment, useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getProducts } from "../actions/productActions";
import { getCategories } from "../actions/categoryActions";
import MetaData from "./layouts/MetaData";
import { Link } from 'react-router-dom';
import ThemeHero from "./home/ThemeHero";
import QuickAccess from "./home/QuickAccess";
import PersonalizedSection from "./home/PersonalizedSection";
import ProductCarousel from "./home/ProductCarousel";
import SectionHeader from "./home/SectionHeader";
import ProductRow from "./home/ProductRow";
import { STOREFRONT_CATEGORIES } from "../designs/storefrontContent";
import { buildHomeFeed } from "../utils/homeFeed";
import { SectionTitleSkeleton, ProductRowSkeleton } from "./layouts/Skeletons";
const FLASH_KEY = 'vijaycart_flash_ends';

// Enough for all homepage sections after de-duplication, without rendering an
// oversized catalog in one view.
const FULL_CATALOG_LIMIT = 48;
const HOME_GRID_LIMIT = 24;
const EMPTY_PRODUCTS = [];

function useFlashTimer() {
  const [timer, setTimer] = useState({ h: '05', m: '47', s: '30' });
  useEffect(() => {
    let deadline = Number(localStorage.getItem(FLASH_KEY));
    if (!deadline || deadline < Date.now()) {
      deadline = Date.now() + (5 * 3600 + 47 * 60 + 30) * 1000;
      localStorage.setItem(FLASH_KEY, String(deadline));
    }
    const tick = () => {
      const diff = Math.max(0, deadline - Date.now());
      setTimer({
        h: String(Math.floor(diff / 3600000)).padStart(2, '0'),
        m: String(Math.floor(diff / 60000) % 60).padStart(2, '0'),
        s: String(Math.floor(diff / 1000) % 60).padStart(2, '0'),
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return timer;
}

function useRecentlyViewed() {
  const [recent, setRecent] = useState([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('vijaycart_recent');
      setRecent(raw ? JSON.parse(raw) : []);
    } catch { /* ignore */ }
  }, []);
  return recent;
}

// Owns its own timer so ticking once per second only re-renders this tiny
// component instead of the whole Home page (which used to re-render all the
// product carousels every second).
function DealsTimer() {
  const timer = useFlashTimer();
  return (
    <div className="flash-timer" aria-label="Deals ending in">
      {[{ v: timer.h, l: 'Hrs' }, { v: timer.m, l: 'Min' }, { v: timer.s, l: 'Sec' }].map((t, i) => (
        <Fragment key={t.l}>
          {i > 0 && <span className="flash-colon">:</span>}
          <span className="countdown-box">
            <span className="countdown-val">{t.v}</span>
            <span className="countdown-label">{t.l}</span>
          </span>
        </Fragment>
      ))}
    </div>
  );
}

export default function Home() {
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.productsState.loading);
  const error = useSelector((state) => state.productsState.error);
  const products = useSelector((state) => state.productsState.products) || EMPTY_PRODUCTS;
  const settings = useSelector((state) => state.settingState.settings) || {};
  const categoriesFromStore = useSelector((state) => state.categoryState.categories);
  const publicCategories = useMemo(() => categoriesFromStore || [], [categoriesFromStore]);
  const recentlyViewed = useRecentlyViewed();

  useEffect(() => {
    dispatch(getCategories());
    // Admin category changes in another tab should show up as soon as the
    // storefront regains focus, without requiring a manual refresh.
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

  const visibleQuickAccess = useMemo(() => {
    if (!publicCategories.length) return STOREFRONT_CATEGORIES;
    const hidden = new Set(publicCategories.filter((c) => c.active === false).map((c) => c.name.toLowerCase()));
    return STOREFRONT_CATEGORIES.filter((q) => !hidden.has((q.category || '').toLowerCase()));
  }, [publicCategories]);

  const retry = useCallback(() => {
    dispatch(getProducts(null, null, null, null, 1, FULL_CATALOG_LIMIT));
  }, [dispatch]);

  useEffect(() => {
    if (error) return;
    dispatch(getProducts(null, null, null, null, 1, FULL_CATALOG_LIMIT));
  }, [error, dispatch]);

  const allProducts = products;
  const anyProduct = allProducts.length > 0;

  // One shared feed build so every section gets its own ranking and the page
  // never repeats the same products across rows (see utils/homeFeed.js).
  const feed = useMemo(() => buildHomeFeed(allProducts), [allProducts]);

  // Active tab for the "Top Categories" product grid. Falls back to the first
  // tab until the user picks one.
  const [activeTopCat, setActiveTopCat] = useState('');
  const activeTopCategory = feed.topCategories.find((t) => t.category === activeTopCat) || feed.topCategories[0] || null;

  const carouselLoading = loading && !anyProduct;

  return (
    <Fragment>
      <MetaData title={settings.metaTitle || 'Buy Best Products'} description={settings.metaDescription || ''} />

      {/* Theme hero — the same component and tokens used by the Design Studio
          preview, always rendered immediately and never gated behind the
          products request. */}
      <ThemeHero />

      {/* Shared category cards — identical markup/styles in preview and live */}
      <QuickAccess categories={visibleQuickAccess} />

      {loading && !anyProduct ? (
        <Fragment>
          <SectionTitleSkeleton />
          <ProductRowSkeleton count={4} />
          <SectionTitleSkeleton />
          <ProductRowSkeleton count={4} />
        </Fragment>
      ) : (
        <Fragment>
          {/* Personalized section */}
          {anyProduct && <PersonalizedSection products={allProducts} />}

          {/* Deals of the Day */}
          <ProductCarousel
            className="flash-deals-wrap"
            title={
              <span className="d-flex align-items-center flex-wrap gap-3">
                <span><i className="fa fa-bolt mr-2" style={{ color: '#ff3f6c' }} aria-hidden="true"></i>Deals of the <span className="section-accent">Day</span></span>
                <DealsTimer />
              </span>
            }
            viewAll="/search/all"
            products={feed.deals}
            loading={carouselLoading}
            error={error}
            onRetry={retry}
            emptyText="Fresh deals are on the way. Check back soon!"
          />

          {/* Best Sellers */}
          <ProductCarousel
            title={<span>Best <span className="section-accent">Sellers</span></span>}
            subtitle="Highly rated, top picked"
            viewAll="/search/all?ratings=4"
            products={feed.bestSellers}
            loading={carouselLoading}
            error={error}
            onRetry={retry}
            emptyText="Best sellers will appear here soon."
          />

          {/* Trending Products */}
          <ProductCarousel
            title={<span>Trending <span className="section-accent">Products</span></span>}
            subtitle="What everyone's loving right now"
            viewAll="/search/all"
            products={feed.trending}
            loading={carouselLoading}
            error={error}
            onRetry={retry}
            emptyText="Trending products will appear here soon."
          />

          {/* Electronics Deals */}
          <ProductCarousel
            title={<span>Electronics <span className="section-accent">Deals</span></span>}
            subtitle="Gadgets at their best prices"
            viewAll="/search/all?category=Electronics"
            products={feed.electronics}
            loading={carouselLoading}
            error={error}
            onRetry={retry}
            emptyText="No electronics products yet."
          />

          {/* Fashion / Lifestyle Collection */}
          <ProductCarousel
            title={<span>Fashion &amp; <span className="section-accent">Lifestyle</span></span>}
            subtitle="Styles for every occasion"
            viewAll="/search/all?category=Accessories"
            products={feed.fashion}
            loading={carouselLoading}
            error={error}
            onRetry={retry}
            emptyText="No fashion products yet."
          />

          {/* Promo banner */}
          <section className="promo-banner">
            <div className="promo-inner">
              <span className="promo-kicker">Limited time offer</span>
              <h2 className="promo-title">Mega Shopping Days</h2>
              <p className="promo-sub mb-0">Flat 30% off sitewide on mobiles, laptops and more. Grab your favourites before the timer runs out.</p>
              <Link to="/search/all" className="promo-cta">Shop the Sale <i className="fa fa-arrow-right" aria-hidden="true"></i></Link>
            </div>
          </section>

          {/* Recommended For You */}
          <ProductCarousel
            title={<span>Recommended <span className="section-accent">For You</span></span>}
            subtitle="Picked just for you"
            viewAll="/search/all"
            products={feed.recommended}
            loading={carouselLoading}
            error={error}
            onRetry={retry}
            emptyText="No recommendations yet."
          />

          {/* New Arrivals */}
          <ProductCarousel
            title={<span>New <span className="section-accent">Arrivals</span></span>}
            subtitle="Freshly added to the catalogue"
            viewAll="/search/all"
            products={feed.newArrivals}
            loading={carouselLoading}
            error={error}
            onRetry={retry}
            emptyText="New arrivals will show up here soon."
          />

          {/* Recently Viewed */}
          {recentlyViewed.length > 0 && (
            <ProductCarousel
              title={<span>Recently <span className="section-accent">Viewed</span></span>}
              subtitle="Continue where you left off"
              viewAll="/search/all"
              products={recentlyViewed.slice(0, 10)}
              emptyText="Products you view will show up here."
            />
          )}

          {/* Top Categories */}
          {feed.topCategories.length > 0 && (
            <section className="section">
              <SectionHeader
                title={<span>Top <span className="section-accent">Categories</span></span>}
                subtitle="Best-rated picks in the biggest categories"
                viewAll="/search/all"
              />
              <div className="category-tabs" role="tablist">
                {feed.topCategories.map((t) => (
                  <button
                    key={t.category}
                    type="button"
                    role="tab"
                    aria-selected={activeTopCategory && activeTopCategory.category === t.category}
                    className={`category-tab${activeTopCategory && activeTopCategory.category === t.category ? ' active' : ''}`}
                    onClick={() => setActiveTopCat(t.category)}
                  >
                    {t.category}
                  </button>
                ))}
              </div>
              {activeTopCategory && (
                <ProductRow products={activeTopCategory.products.slice(0, HOME_GRID_LIMIT)} col={3} />
              )}
            </section>
          )}

          {/* More Products */}
          {feed.moreProducts.length > 0 && (
            <section className="section">
              <SectionHeader
                title={<span>More <span className="section-accent">Products</span></span>}
                viewAll="/search/all"
              />
              <ProductRow products={feed.moreProducts.slice(0, HOME_GRID_LIMIT)} col={3} />
            </section>
          )}

          {!loading && !anyProduct && !error && (
            <div className="empty-state mt-4">
              <div className="empty-icon"><i className="fa fa-inbox" aria-hidden="true"></i></div>
              <h2 className="empty-title">No Products Found</h2>
              <p className="empty-sub">We couldn't find any products right now. Please check back in a moment.</p>
              <Link to="/search/all" className="empty-cta">Browse Products</Link>
            </div>
          )}
        </Fragment>
      )}
    </Fragment>
  );
}
