import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const EASE = [0.16, 1, 0.3, 1];

const SLIDES = [
  {
    img: '/images/products/smartphone-1.jpg',
    alt: 'Mega Sale — Up to 70% off on top brands',
    to: '/search/all',
    kicker: 'Mega Sale',
    title: 'Up to 70% Off',
    subtitle: 'Top brands, biggest discounts',
    cta: 'Shop Now',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
    accent: '#ff6b35',
  },
  {
    img: '/images/products/smart-tv-1.jpg',
    alt: 'Electronics Fest — Laptops, phones & more',
    to: '/search/all?category=Electronics',
    kicker: 'Electronics Fest',
    title: 'Gadgets Galore',
    subtitle: 'Laptops, phones, tablets & accessories',
    cta: 'Explore Deals',
    gradient: 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 40%, #415a77 100%)',
    accent: '#00b4d8',
  },
  {
    img: '/images/products/women-dress-1.jpg',
    alt: 'Fashion Picks — Styles for every occasion',
    to: '/search/all?category=Clothes/Shoes',
    kicker: 'Fashion Week',
    title: 'New Arrivals',
    subtitle: 'Fresh styles for every occasion',
    cta: 'View Collection',
    gradient: 'linear-gradient(135deg, #2d1b69 0%, #4a1942 40%, #6b2fa0 100%)',
    accent: '#ff3f6c',
  },
  {
    img: '/images/products/sofa-1.jpg',
    alt: 'Home & Lifestyle — Smart living essentials',
    to: '/search/all?category=Home',
    kicker: 'Home Living',
    title: 'Smart Home',
    subtitle: 'Upgrade your space, elevate your life',
    cta: 'Shop Home',
    gradient: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 40%, #40916c 100%)',
    accent: '#95d5b2',
  },
];

const TRANSITION_MS = 500;
const AUTO_ADVANCE_MS = 5000;

function HeroSkeleton() {
  return (
    <div className="vc-hero" aria-busy="true" aria-label="Loading banner">
      <div className="vc-hero__track">
        <div className="vc-hero__slide vc-hero__slide--skeleton">
          <div className="skeleton sk-banner" />
        </div>
      </div>
    </div>
  );
}

function HeroFallback() {
  return (
    <div className="vc-hero vc-hero--fallback">
      <Link to="/search/all" className="vc-hero__fallback-link" aria-label="Browse all products">
        <div className="vc-hero__fallback-inner">
          <span className="vc-hero__fallback-kicker">VijayCart</span>
          <h2 className="vc-hero__fallback-title">Discover Amazing Deals</h2>
          <p className="vc-hero__fallback-sub">Browse thousands of products across all categories</p>
          <span className="vc-hero__fallback-cta">
            Shop Now <i className="fa fa-arrow-right" aria-hidden="true"></i>
          </span>
        </div>
      </Link>
    </div>
  );
}

export default function HeroBanner() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(null);
  const touchTimerRef = useRef(null);

  const goTo = useCallback((next) => {
    if (transitioning) return;
    setTransitioning(true);
    setIndex(next);
    setProgress(0);
    setTimeout(() => setTransitioning(false), TRANSITION_MS);
  }, [transitioning]);

  const next = useCallback(() => goTo((index + 1) % SLIDES.length), [goTo, index]);
  const prev = useCallback(() => goTo((index - 1 + SLIDES.length) % SLIDES.length), [goTo, index]);

  // Auto-advance with progress
  useEffect(() => {
    if (paused || transitioning) return;
    setProgress(0);
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / AUTO_ADVANCE_MS) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        next();
      } else {
        progressRef.current = requestAnimationFrame(tick);
      }
    };
    progressRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(progressRef.current);
  }, [next, paused, transitioning, index]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  const onTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 50) {
      diff < 0 ? next() : prev();
    }
    setTouchStart(null);
  };

  // Pause auto-advance on hover / touch
  const handlePause = () => setPaused(true);
  const handleResume = () => {
    clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => setPaused(false), 300);
  };

  if (!SLIDES || SLIDES.length === 0) return <HeroFallback />;

  return (
    <div
      className="vc-hero"
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onTouchStart={(e) => { handlePause(); onTouchStart(e); }}
      onTouchEnd={(e) => { onTouchEnd(e); handleResume(); }}
      aria-label="Promotional banners"
      role="region"
    >
      <div className="vc-hero__stage">
        {/* Slides */}
        <div
          className="vc-hero__track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {SLIDES.map((s, i) => (
            <Link
              to={s.to}
              key={i}
              className={`vc-hero__slide ${i === index ? 'vc-hero__slide--active' : ''}`}
              aria-label={s.alt}
              tabIndex={i === index ? 0 : -1}
            >
              <div className="vc-hero__bg" style={{ background: s.gradient }}>
                <img
                  src={s.img}
                  alt=""
                  className="vc-hero__img"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                />
                <div className="vc-hero__overlay" />
              </div>
              <div className="vc-hero__content">
                <motion.span
                  className="vc-hero__kicker"
                  style={{ color: s.accent }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={i === index ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                  transition={{ duration: 0.45, ease: EASE, delay: i === index ? 0.05 : 0 }}
                >
                  {s.kicker}
                </motion.span>
                <motion.h2
                  className="vc-hero__title"
                  initial={{ opacity: 0, y: 22 }}
                  animate={i === index ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
                  transition={{ duration: 0.5, ease: EASE, delay: i === index ? 0.15 : 0 }}
                >
                  {s.title}
                </motion.h2>
                <motion.p
                  className="vc-hero__subtitle"
                  initial={{ opacity: 0, y: 22 }}
                  animate={i === index ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
                  transition={{ duration: 0.5, ease: EASE, delay: i === index ? 0.25 : 0 }}
                >
                  {s.subtitle}
                </motion.p>
                <motion.span
                  className="vc-hero__cta"
                  style={{ background: s.accent }}
                  initial={{ opacity: 0, y: 18 }}
                  animate={i === index ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
                  transition={{ duration: 0.45, ease: EASE, delay: i === index ? 0.35 : 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {s.cta} <i className="fa fa-arrow-right" aria-hidden="true"></i>
                </motion.span>
              </div>
            </Link>
          ))}
        </div>

        {/* Arrows */}
        <button
          type="button"
          className="vc-hero__arrow vc-hero__arrow--left"
          onClick={(e) => { e.preventDefault(); prev(); }}
          aria-label="Previous slide"
        >
          <i className="fa fa-chevron-left" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          className="vc-hero__arrow vc-hero__arrow--right"
          onClick={(e) => { e.preventDefault(); next(); }}
          aria-label="Next slide"
        >
          <i className="fa fa-chevron-right" aria-hidden="true"></i>
        </button>
      </div>

      {/* Progress dots */}
      <div className="vc-hero__dots" role="tablist" aria-label="Slide navigation">
        {SLIDES.map((s, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Slide ${i + 1}: ${s.kicker}`}
            className={`vc-hero__dot ${i === index ? 'vc-hero__dot--active' : ''}`}
            onClick={() => goTo(i)}
          >
            {i === index && (
              <span
                className="vc-hero__dot-progress"
                style={{ width: `${progress}%` }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export { HeroSkeleton, HeroFallback };
