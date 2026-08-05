import { Fragment, useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getProducts } from "../actions/productActions";
import MetaData from "./layouts/MetaData";
import Product from "./product/Product";
import { Link } from 'react-router-dom';
import HeroBanner from "./home/HeroBanner";
import PersonalizedSection from "./home/PersonalizedSection";
import ProductCarousel from "./home/ProductCarousel";
import { getDiscountFor } from "../utils/productHelper";
import { SectionTitleSkeleton, ProductRowSkeleton } from "./layouts/Skeletons";
const FLASH_KEY = 'vijaycart_flash_ends';

const SHOP_CATEGORIES = [
  { name: 'Smartphones', icon: 'fa-mobile', count: 'Up to 40% off' },
  { name: 'Electronics', icon: 'fa-plug', count: 'Daily deals' },
  { name: 'Laptops', icon: 'fa-laptop', count: 'Top brands' },
  { name: 'Headphones', icon: 'fa-headphones', count: 'Studio sound' },
  { name: 'Beauty/Health', icon: 'fa-heartbeat', count: 'Self care' },
  { name: 'Sports', icon: 'fa-futbol-o', count: 'Active wear' },
  { name: 'Home', icon: 'fa-home', count: 'Smart living' },
  { name: 'Accessories', icon: 'fa-clock-o', count: 'Everyday carry' },
  { name: 'Books', icon: 'fa-book', count: 'Read more' },
  { name: 'Cameras', icon: 'fa-camera', count: 'Capture life' },
];

const QUICK_ACCESS = [
  { name: 'Offers', icon: 'fa-percent', cls: 'cat-icon-appliances', to: '/search/all' },
  { name: 'Mobiles & Acc', icon: 'fa-mobile', cls: 'cat-icon-mobile', to: '/search/all?category=Smartphones' },
  { name: 'Fashion', icon: 'fa-tshirt', cls: 'cat-icon-fashion', to: '/search/all?category=Clothes%2FShoes' },
  { name: 'Electronics', icon: 'fa-plug', cls: 'cat-icon-electronics', to: '/search/all?category=Electronics' },
  { name: 'Grocery', icon: 'fa-shopping-basket', cls: 'cat-icon-grocery', to: '/search/all?category=Food' },
  { name: 'Home', icon: 'fa-home', cls: 'cat-icon-home', to: '/search/all?category=Home' },
  { name: 'Beauty', icon: 'fa-heartbeat', cls: 'cat-icon-beauty', to: '/search/all?category=Beauty%2FHealth' },
  { name: 'Sports', icon: 'fa-futbol-o', cls: 'cat-icon-sports', to: '/search/all?category=Sports' },
];

const TECH_CATEGORIES = ['Laptops', 'Smartphones', 'Televisions', 'Audio', 'Headphones', 'Cameras', 'Gaming', 'Drones', 'Wearables', 'Monitors', 'Components', 'Tablets'];
const FASHION_CATEGORIES = ['Accessories', 'Sports', 'Outdoor', 'Wearables'];

const FULL_CATALOG_LIMIT = 200;

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
  const { loading, error, products } = useSelector((state) => state.productsState);
  const recentlyViewed = useRecentlyViewed();

  const retry = useCallback(() => {
    dispatch(getProducts(null, null, null, null, 1, FULL_CATALOG_LIMIT));
  }, [dispatch]);

  useEffect(() => {
    if (error) return;
    dispatch(getProducts(null, null, null, null, 1, FULL_CATALOG_LIMIT));
  }, [error, dispatch]);

  const allProducts = useMemo(() => products || [], [products]);
  const anyProduct = allProducts.length > 0;

  // Memoize derived slices so their array identity is stable across renders.
  // This lets ProductCarousel/Product skip re-rendering (and avoids tearing
  // down/rebuilding scroll listeners every render).
  const dealsOfTheDay = useMemo(() => allProducts.filter(p => getDiscountFor(p._id) >= 26).slice(0, 10), [allProducts]);
  const trending = useMemo(() => allProducts.filter(p => getDiscountFor(p._id) >= 18).slice(0, 10), [allProducts]);
  const bestSellers = useMemo(() => allProducts.filter(p => Number(p.ratings) >= 4).slice(0, 10), [allProducts]);
  const electronics = useMemo(() => allProducts.filter(p => TECH_CATEGORIES.includes(p.category)).slice(0, 10), [allProducts]);
  const fashion = useMemo(() => allProducts.filter(p => FASHION_CATEGORIES.includes(p.category)).slice(0, 10), [allProducts]);
  const recommended = useMemo(() => allProducts.slice(0, 10), [allProducts]);
  const moreProducts = useMemo(() => allProducts.slice(0, 24), [allProducts]);

  const carouselLoading = loading && !anyProduct;

  return (
    <Fragment>
      <MetaData title={'Buy Best Products'} />

      {/* Hero carousel — always rendered immediately, never gated behind the
          products API request. Gating it meant the banner was swapped for a
          skeleton while products loaded (or forever if the request failed),
          hiding it on mobile. */}
      <div className="hero-section">
        <HeroBanner />
      </div>

      {/* Quick access promo cards */}
      <section className="quick-access">
        {QUICK_ACCESS.map((q) => (
          <Link key={q.name} to={q.to} className="quick-access-item">
            <span className={`quick-access-icon ${q.cls}`}><i className={`fa ${q.icon}`} aria-hidden="true"></i></span>
            <span className="quick-access-label">{q.name}</span>
          </Link>
        ))}
      </section>

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

          {/* Shop by Category */}
          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Shop by <span className="section-accent">Category</span></h2>
            </div>
            <div className="category-grid">
              {SHOP_CATEGORIES.map(cat => (
                <Link key={cat.name} to={`/search/all?category=${encodeURIComponent(cat.name)}`} className="category-card">
                  <span className="cat-card-icon"><i className={`fa ${cat.icon}`} aria-hidden="true"></i></span>
                  <span className="cat-card-name">{cat.name}</span>
                  <span className="cat-card-count">{cat.count}</span>
                </Link>
              ))}
            </div>
          </section>

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
            products={dealsOfTheDay}
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
            products={bestSellers}
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
            products={trending}
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
            products={electronics}
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
            products={fashion}
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
            products={recommended}
            loading={carouselLoading}
            error={error}
            onRetry={retry}
            emptyText="No recommendations yet."
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

          {/* More Products */}
          {moreProducts.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2 className="section-title">More <span className="section-accent">Products</span></h2>
                <Link to="/search/all" className="view-all-link">View All <i className="fa fa-arrow-right" aria-hidden="true"></i></Link>
              </div>
              <div className="row">
                {moreProducts.map(product => <Product key={product._id} product={product} col={3} />)}
              </div>
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
