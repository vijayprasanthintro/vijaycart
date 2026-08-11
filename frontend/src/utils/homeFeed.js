// Homepage feed builder.
//
// WHY: the old Home page sliced the same full catalogue for every carousel
// (deals >= 26% discount, trending >= 18%, bestSellers ratings >= 4, ...) so
// most sections resolved to the same "first N" products and the homepage
// repeated identical rows. This module gives every section its own ranking and
// shares one `displayedIds` set across the whole build, so each section
// prefers products that have not been shown anywhere else on the page.
//
// Usage:
//   import { buildHomeFeed, getDealsOfTheDay, ... } from '../utils/homeFeed';
//   const feed = buildHomeFeed(products);

import { getPricing } from './productHelper';

export const TECH_CATEGORIES = [
  'Laptops', 'Smartphones', 'Televisions', 'Audio', 'Headphones', 'Cameras',
  'Gaming', 'Drones', 'Wearables', 'Monitors', 'Components', 'Tablets',
];

export const FASHION_CATEGORIES = ['Clothes/Shoes', 'Accessories', 'Sports', 'Outdoor'];
export const LIFESTYLE_CATEGORIES = ['Home', 'Food', 'Beauty/Health', 'Books'];

const SORT_DIR_DESC = -1;

// Deterministic tiebreak so ordering never depends on Mongo's insertion order.
const byId = (a, b) => String(a._id).localeCompare(String(b._id));

// Stable multi-key sort. Pass `key` and optional `tieKey`; both default to
// descending. Returns a new array (never mutates the input).
function sortBy(list, key, tieKey) {
  return [...list].sort((a, b) => {
    const av = key(a);
    const bv = key(b);
    if (av !== bv) return (av > bv ? 1 : -1) * SORT_DIR_DESC;
    if (tieKey) {
      const at = tieKey(a);
      const bt = tieKey(b);
      if (at !== bt) return (at > bt ? 1 : -1) * SORT_DIR_DESC;
    }
    return byId(a, b);
  });
}

const ratingOf = (p) => Number(p.ratings) || 0;
const reviewsOf = (p) => Number(p.numOfReviews) || 0;
const discountOf = (p) => getPricing(p).discount;
const createdAtOf = (p) => new Date(p.createdAt || 0).getTime();

// -------- Pure section getters (reusable, no shared state) --------

// Highest discounts / special offers.
export const getDealsOfTheDay = (products, n = 8) =>
  sortBy(products, discountOf, ratingOf).slice(0, n);

// Most reviewed first (proxy for sales volume), best rated as tiebreak.
export const getBestSellers = (products, n = 8) =>
  sortBy(products, reviewsOf, ratingOf).slice(0, n);

// Highest rated, most reviewed as tiebreak.
export const getTrendingProducts = (products, n = 8) =>
  sortBy(products, ratingOf, reviewsOf).slice(0, n);

// Electronics only, best deals first.
export const getElectronicsDeals = (products, n = 8) =>
  sortBy(products.filter((p) => TECH_CATEGORIES.includes(p.category)), discountOf, ratingOf).slice(0, n);

// Fashion & lifestyle, highest rated first.
export const getFashionProducts = (products, n = 6) =>
  sortBy(products.filter((p) => FASHION_CATEGORIES.includes(p.category)), ratingOf, reviewsOf).slice(0, n);

// Well-rated picks personalised by rating (never the raw first-N slice).
export const getRecommendedProducts = (products, n = 8) =>
  sortBy(
    products.filter((p) => ratingOf(p) >= 4),
    ratingOf,
    reviewsOf
  ).slice(0, n);

// Newly added products (createdAt desc, staggered by the seeder).
export const getNewArrivals = (products, n = 8) =>
  sortBy(products, createdAtOf, ratingOf).slice(0, n);

// Pick the categories with the most catalogue coverage.
export const getTopCategories = (products, n = 4) => {
  const counts = {};
  products.forEach((p) => { if (p.category) counts[p.category] = (counts[p.category] || 0) + 1; });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .slice(0, n)
    .map(([category]) => category);
};

// -------- Unique feed builder (one displayedIds set across every section) --------

export function buildHomeFeed(allProducts, opts = {}) {
  const {
    dealsCount = 8,
    electronicsCount = 8,
    fashionCount = 6,
    bestSellersCount = 8,
    trendingCount = 8,
    recommendedCount = 8,
    newArrivalsCount = 8,
    topCategoriesCount = 4,
    topCategoryItems = 6,
    moreProductsCount = 12,
  } = opts;

  const products = allProducts || [];
  const used = new Set();

  // Takes the ranked candidate list and returns `n` products, preferring ones
  // not yet shown anywhere on the page. Falls back to reusing only when the
  // fresh pool is smaller than the requested count.
  const pick = (candidates, n) => {
    if (n <= 0) return [];
    const fresh = candidates.filter((p) => !used.has(p._id));
    const pool = fresh.length >= n
      ? fresh
      : [...fresh, ...candidates.filter((p) => used.has(p._id))];
    const out = pool.slice(0, n);
    out.forEach((p) => used.add(p._id));
    return out;
  };

  const deals = pick(getDealsOfTheDay(products, dealsCount * 3), dealsCount);
  const electronics = pick(getElectronicsDeals(products, electronicsCount * 3), electronicsCount);
  const fashion = pick(getFashionProducts(products, fashionCount * 3), fashionCount);
  const bestSellers = pick(getBestSellers(products, bestSellersCount * 3), bestSellersCount);
  const trending = pick(getTrendingProducts(products, trendingCount * 3), trendingCount);
  const recommended = pick(getRecommendedProducts(products, recommendedCount * 3), recommendedCount);
  const newArrivals = pick(getNewArrivals(products, newArrivalsCount * 3), newArrivalsCount);

  // Top Categories: each tab shows products that genuinely belong to its
  // category, fresh-first.
  const topCategoryNames = getTopCategories(products, topCategoriesCount);
  const topCategories = topCategoryNames.map((category) => ({
    category,
    products: pick(
      sortBy(
        products.filter((p) => p.category === category),
        ratingOf,
        reviewsOf
      ),
      topCategoryItems
    ),
  }));

  // Everything left over becomes the final "More Products" grid.
  const leftovers = products.filter((p) => !used.has(p._id));
  const moreProducts = leftovers.slice(0, moreProductsCount);
  leftovers.slice(0, moreProductsCount).forEach((p) => used.add(p._id));

  return {
    deals,
    electronics,
    fashion,
    bestSellers,
    trending,
    recommended,
    newArrivals,
    topCategories,
    moreProducts,
    displayedIds: used,
  };
}
