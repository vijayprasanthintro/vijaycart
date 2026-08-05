import { memo, useRef, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Product from '../product/Product';
import { ProductRowSkeleton } from '../layouts/Skeletons';

export default memo(function ProductCarousel({
  title,
  subtitle,
  viewAll,
  products = [],
  loading = false,
  error = '',
  onRetry,
  emptyText = 'No products found in this collection.',
  emptyCta = '/search/all',
  col = 3,
  scrollBy = 340,
  className = '',
}) {
  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, products]);

  useEffect(() => {
    checkScroll();
  }, [checkScroll, products]);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * scrollBy, behavior: 'smooth' });
  };

  const showControls = !loading && !error && products.length > 0;

  return (
    <section className={`section ${className}`}>
      <div className="section-head">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-sub mt-1">{subtitle}</p>}
        </div>
        <div className="d-flex align-items-center">
          {viewAll && <Link to={viewAll} className="view-all-link">View All <i className="fa fa-arrow-right" aria-hidden="true"></i></Link>}
          {showControls && (
            <div className="d-flex ml-3">
              <button
                type="button"
                className="scroll-btn"
                onClick={() => scroll(-1)}
                disabled={!canLeft}
                aria-label="Scroll left"
              >
                <i className="fa fa-chevron-left" aria-hidden="true"></i>
              </button>
              <button
                type="button"
                className="scroll-btn"
                onClick={() => scroll(1)}
                disabled={!canRight}
                aria-label="Scroll right"
              >
                <i className="fa fa-chevron-right" aria-hidden="true"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <ProductRowSkeleton count={4} />
      ) : error ? (
        <div className="section-state">
          <div className="section-state__icon"><i className="fa fa-cloud-upload" aria-hidden="true"></i></div>
          <h3 className="section-state__title">Something went wrong</h3>
          <p className="section-state__sub">{error}</p>
          {onRetry && (
            <button type="button" className="empty-cta" onClick={onRetry}>
              <i className="fa fa-refresh mr-1" aria-hidden="true"></i> Try Again
            </button>
          )}
        </div>
      ) : products.length === 0 ? (
        <div className="section-state">
          <div className="section-state__icon"><i className="fa fa-inbox" aria-hidden="true"></i></div>
          <h3 className="section-state__title">No products yet</h3>
          <p className="section-state__sub">{emptyText}</p>
          {emptyCta && (
            <Link to={emptyCta} className="empty-cta">Browse Products <i className="fa fa-arrow-right" aria-hidden="true"></i></Link>
          )}
        </div>
      ) : (
        <div className="product-scroll">
          <div className="product-scroll-track" ref={trackRef}>
            {products.map(product => <Product key={product._id} product={product} col={col} />)}
          </div>
        </div>
      )}
    </section>
  );
})
