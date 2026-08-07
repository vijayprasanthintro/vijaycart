// Compute display pricing for a product. Stored `mrp` / `discount` (seeded or
// set by admins) are preferred; older products without them fall back to a
// stable deterministic discount so cards still look premium.
import { API_BASE_URL } from '../apiConfig';

export const getDiscountFor = (id = '', fallback = 18) => {
  if (!id) return fallback;
  let hash = 0;
  const str = String(id);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return 8 + ((Math.abs(hash) % 32)); // 8% - 39%
}

export const getPricing = (product = {}) => {
  const price = Number(product.price) || 0;
  let mrp = Number(product.mrp) || 0;
  let discount = Number(product.discount) || 0;
  if (mrp > price) {
    if (!discount) discount = Math.round((1 - price / mrp) * 100);
  } else if (discount > 0) {
    mrp = Math.round((price / (1 - discount / 100)) * 100) / 100;
  } else {
    discount = getDiscountFor(product._id);
    mrp = Math.round((price / (1 - discount / 100)) * 100) / 100;
  }
  return {
    price,
    mrp,
    discount,
    saved: Math.round((mrp - price) * 100) / 100
  };
}

export const formatMoney = (value) => {
  const num = Number(value || 0);
  const rounded = Math.abs(num) < 0.005 ? 0 : num;
  return '₹' + rounded.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const roundRating = (rating) => {
  const r = Number(rating) || 0;
  return Math.max(Math.min(r, 5), 0);
}

export const isInStock = (product = {}) => Number(product.stock) > 0;

// Pick a badge label deterministically for product cards
export const getBadge = (product = {}) => {
  const discount = getPricing(product).discount;
  if (discount >= 28) return 'Best Seller';
  if (discount >= 20) return 'Trending';
  return 'New';
}

// Deterministic delivery estimate shown on product cards
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getDelivery = (product = {}) => {
  let hash = 0;
  const str = String(product._id || '');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  const daysAhead = 2 + (Math.abs(hash) % 4); // 2 - 5 days
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return {
    free: true,
    by: DAYS[d.getDay()],
    days: daysAhead,
  };
}

// Estimated delivery label for checkout / orders, e.g. "Friday, Aug 7".
export const getDeliveryDate = (seed = '') => {
  const est = getDelivery({ _id: String(seed || 'delivery') });
  const d = new Date();
  d.setDate(d.getDate() + est.days);
  return d;
};

export const getDeliveryLabel = (seed = '') =>
  getDeliveryDate(seed).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

export const getDeliveryDay = (seed = '') =>
  getDeliveryDate(seed).toLocaleDateString('en-US', { weekday: 'long' });

// -------- Image URL resolution & fallback --------
// Product images are stored in MongoDB as paths relative to the frontend
// (`/images/products/...`), relative to the backend uploads dir (`/uploads/...`),
// or occasionally as absolute URLs. Absolute URLs bake in a hostname (e.g.
// http://127.0.0.1:8000) that breaks on any other deployment, so we resolve
// every source to something the current origin can actually serve:
//   - absolute http(s)      -> used as-is
//   - /uploads/...          -> prefixed with the API base (REACT_APP_API_URL)
//   - /images/... (or any)  -> served by the frontend itself, used as-is
export const IMAGE_FALLBACK = '/images/placeholder.svg';

export const resolveProductImage = (src) => {
  if (!src) return IMAGE_FALLBACK;
  const s = String(src);
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/uploads/')) {
    const base = API_BASE_URL.replace(/\/+$/, '');
    return base + s;
  }
  return s;
};

// Reusable onError handler for <img> tags: swaps a broken source for the
// placeholder exactly once (the dataset guard stops a replace loop).
export const imgOnError = (e) => {
  const el = e.currentTarget;
  if (!el || el.dataset.fb) return;
  el.dataset.fb = '1';
  el.src = IMAGE_FALLBACK;
};

// First image of a product (card/thumbnail usage), resolved + fallback.
export const productImage = (product = {}) =>
  resolveProductImage(product && product.images && product.images[0] ? product.images[0].image : '');

// -------- Gallery / review demo media --------
// Most seeded products now ship with 3-4 real photos, so multi-image galleries
// start from the product's own images and are topped up from the shared public
// image pool below. The product's own images always come first and are never
// duplicated.

// Only files that actually ship in `frontend/public/images/products` are listed.
// Referencing anything else 404s, so the gallery/review demo images are built
// exclusively from files that exist.
const PRODUCT_IMAGE_POOL = [
  '/images/products/audio-buds-1.jpg',
  '/images/products/audio-buds-2.jpg',
  '/images/products/audio-buds-3.jpg',
  '/images/products/audio-buds-4.jpg',
  '/images/products/baby-clothes-1.jpg',
  '/images/products/baby-clothes-2.jpg',
  '/images/products/baby-clothes-3.jpg',
  '/images/products/baby-clothes-4.jpg',
  '/images/products/backpack-1.jpg',
  '/images/products/backpack-2.jpg',
  '/images/products/backpack-3.jpg',
  '/images/products/backpack-4.jpg',
  '/images/products/bed-1.jpg',
  '/images/products/bed-2.jpg',
  '/images/products/bed-3.jpg',
  '/images/products/bed-4.jpg',
  '/images/products/book-1.jpg',
  '/images/products/book-2.jpg',
  '/images/products/book-3.jpg',
  '/images/products/book-4.jpg',
  '/images/products/coffee-1.jpg',
  '/images/products/coffee-2.jpg',
  '/images/products/coffee-3.jpg',
  '/images/products/coffee-4.jpg',
  '/images/products/coffee-table-1.jpg',
  '/images/products/coffee-table-2.jpg',
  '/images/products/coffee-table-3.jpeg',
  '/images/products/coffee-table-4.jpg',
  '/images/products/cookware-1.jpg',
  '/images/products/cookware-2.jpg',
  '/images/products/cookware-3.jpg',
  '/images/products/cookware-4.jpg',
  '/images/products/dinner-set-1.jpg',
  '/images/products/dinner-set-2.jpg',
  '/images/products/dinner-set-3.jpg',
  '/images/products/dinner-set-4.jpeg',
  '/images/products/drone-1.JPG',
  '/images/products/drone-2.JPG',
  '/images/products/drone-3.jpg',
  '/images/products/drone-4.jpg',
  '/images/products/dry-fruits-1.jpg',
  '/images/products/dry-fruits-2.jpg',
  '/images/products/dry-fruits-3.jpg',
  '/images/products/dry-fruits-4.jpg',
  '/images/products/dslr-camera-1.jpg',
  '/images/products/dslr-camera-2.jpg',
  '/images/products/dslr-camera-3.jpg',
  '/images/products/dslr-camera-4.jpg',
  '/images/products/encyclopedia-1.jpg',
  '/images/products/encyclopedia-2.jpg',
  '/images/products/encyclopedia-3.jpg',
  '/images/products/encyclopedia-4.jpg',
  '/images/products/face-cream-1.jpg',
  '/images/products/face-cream-2.jpg',
  '/images/products/face-cream-3.jpg',
  '/images/products/face-cream-4.jpg',
  '/images/products/game-controller-1.jpg',
  '/images/products/game-controller-2.jpg',
  '/images/products/game-controller-3.jpg',
  '/images/products/game-controller-4.jpg',
  '/images/products/green-tea-1.jpg',
  '/images/products/green-tea-2.jpg',
  '/images/products/green-tea-3.jpg',
  '/images/products/green-tea-4.jpg',
  '/images/products/hair-oil-1.jpg',
  '/images/products/hair-oil-2.jpg',
  '/images/products/hair-oil-3.jpg',
  '/images/products/hair-oil-4.jpg',
  '/images/products/handbag-1.jpg',
  '/images/products/handbag-2.jpg',
  '/images/products/handbag-3.jpg',
  '/images/products/handbag-4.jpg',
  '/images/products/headphones-1.jpg',
  '/images/products/headphones-2.jpg',
  '/images/products/headphones-3.jpg',
  '/images/products/headphones-4.jpg',
  '/images/products/heels-1.jpg',
  '/images/products/heels-2.jpg',
  '/images/products/heels-3.jpg',
  '/images/products/heels-4.jpg',
  '/images/products/hiking-boots-1.jpg',
  '/images/products/hiking-boots-2.jpg',
  '/images/products/hiking-boots-3.jpg',
  '/images/products/hiking-boots-4.jpg',
  '/images/products/honey-1.jpg',
  '/images/products/honey-2.jpg',
  '/images/products/honey-3.jpg',
  '/images/products/honey-4.jpg',
  '/images/products/jeans-1.jpg',
  '/images/products/jeans-2.jpg',
  '/images/products/jeans-3.jpg',
  '/images/products/jeans-4.jpg',
  '/images/products/keyboard-1.jpg',
  '/images/products/keyboard-2.jpg',
  '/images/products/keyboard-3.jpg',
  '/images/products/keyboard-4.jpg',
  '/images/products/kids-book-1.jpg',
  '/images/products/kids-book-2.jpg',
  '/images/products/kids-book-3.jpg',
  '/images/products/kids-book-4.jpg',
  '/images/products/kids-shoes-1.jpg',
  '/images/products/kids-shoes-2.jpg',
  '/images/products/kids-shoes-3.jpg',
  '/images/products/kids-shoes-4.jpg',
  '/images/products/kids-tshirt-1.jpg',
  '/images/products/kids-tshirt-2.png',
  '/images/products/kids-tshirt-3.jpg',
  '/images/products/kids-tshirt-4.jpg',
  '/images/products/laptop-1.jpeg',
  '/images/products/laptop-2.jpg',
  '/images/products/laptop-3.jpg',
  '/images/products/laptop-4.jpg',
  '/images/products/men-shirt-1.jpg',
  '/images/products/men-shirt-2.jpg',
  '/images/products/men-shirt-3.jpg',
  '/images/products/men-shirt-4.jpg',
  '/images/products/money-book-1.jpg',
  '/images/products/money-book-2.jpg',
  '/images/products/money-book-3.jpg',
  '/images/products/money-book-4.jpg',
  '/images/products/monitor-1.jpg',
  '/images/products/monitor-2.jpg',
  '/images/products/monitor-3.png',
  '/images/products/monitor-4.jpg',
  '/images/products/mountain-bike-1.jpg',
  '/images/products/mountain-bike-2.jpg',
  '/images/products/mountain-bike-3.jpg',
  '/images/products/mountain-bike-4.jpg',
  '/images/products/mouse-1.jpg',
  '/images/products/mouse-2.jpg',
  '/images/products/mouse-3.jpg',
  '/images/products/mouse-4.jpg',
  '/images/products/novel-1.jpg',
  '/images/products/novel-2.jpg',
  '/images/products/novel-3.jpg',
  '/images/products/novel-4.png',
  '/images/products/olive-oil-1.jpg',
  '/images/products/olive-oil-2.jpg',
  '/images/products/olive-oil-3.jpg',
  '/images/products/olive-oil-4.jpg',
  '/images/products/powerbank-1.jpg',
  '/images/products/powerbank-2.jpg',
  '/images/products/powerbank-3.jpg',
  '/images/products/powerbank-4.jpg',
  '/images/products/protein-1.jpg',
  '/images/products/protein-2.jpg',
  '/images/products/protein-3.jpg',
  '/images/products/rice-1.jpg',
  '/images/products/rice-2.jpg',
  '/images/products/rice-3.jpg',
  '/images/products/rice-4.jpg',
  '/images/products/running-shoes-1.jpg',
  '/images/products/running-shoes-2.jpg',
  '/images/products/running-shoes-3.jpg',
  '/images/products/running-shoes-4.jpg',
  '/images/products/serum-1.jpg',
  '/images/products/serum-2.jpg',
  '/images/products/serum-3.jpg',
  '/images/products/sleeping-bag-1.JPG',
  '/images/products/sleeping-bag-2.jpg',
  '/images/products/sleeping-bag-3.JPG',
  '/images/products/sleeping-bag-4.jpg',
  '/images/products/smartband-1.jpg',
  '/images/products/smartband-2.jpg',
  '/images/products/smartband-3.jpg',
  '/images/products/smartband-4.jpg',
  '/images/products/smartphone-1.jpg',
  '/images/products/smartphone-2.jpg',
  '/images/products/smartphone-3.jpg',
  '/images/products/smartphone-4.png',
  '/images/products/smart-tv-1.jpg',
  '/images/products/smart-tv-2.jpg',
  '/images/products/smart-tv-3.jpg',
  '/images/products/smart-tv-4.jpg',
  '/images/products/sofa-1.jpg',
  '/images/products/sofa-2.jpg',
  '/images/products/sofa-3.jpg',
  '/images/products/sofa-4.jpg',
  '/images/products/speaker-1.jpeg',
  '/images/products/speaker-2.jpg',
  '/images/products/speaker-3.jpg',
  '/images/products/speaker-4.jpg',
  '/images/products/sunscreen-1.jpg',
  '/images/products/sunscreen-2.jpg',
  '/images/products/sunscreen-3.jpg',
  '/images/products/sunscreen-4.jpg',
  '/images/products/table-lamp-1.jpg',
  '/images/products/table-lamp-2.jpg',
  '/images/products/table-lamp-3.jpg',
  '/images/products/table-lamp-4.jpg',
  '/images/products/tablet-1.jpg',
  '/images/products/tablet-2.jpeg',
  '/images/products/tablet-3.jpg',
  '/images/products/tablet-4.jpg',
  '/images/products/tent-1.jpg',
  '/images/products/tent-2.jpg',
  '/images/products/tent-3.jpg',
  '/images/products/tent-4.jpg',
  '/images/products/vitamins-1.jpg',
  '/images/products/vitamins-2.jpg',
  '/images/products/vitamins-3.jpg',
  '/images/products/vitamins-4.jpg',
  '/images/products/women-dress-1.jpg',
  '/images/products/women-dress-2.jpg',
  '/images/products/women-dress-3.jpg',
  '/images/products/women-dress-4.jpg',
  '/images/products/yoga-mat-1.jpg',
  '/images/products/yoga-mat-2.jpg',
  '/images/products/yoga-mat-3.JPG',
  '/images/products/yoga-mat-4.jpg',
];

const hashId = (s = '') => {
  let h = 0;
  const str = String(s);
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export const getGalleryImages = (product = {}) => {
  const own = (product.images || []).map(i => (i && i.image ? resolveProductImage(i.image) : '')).filter(Boolean);
  const h = hashId(product._id || product.name || '');
  const target = Math.max(own.length, 5);
  const out = [];
  const seen = new Set();
  own.forEach(img => { if (!seen.has(img)) { seen.add(img); out.push(img); } });
  let step = 0;
  while (out.length < target && step < PRODUCT_IMAGE_POOL.length * 3) {
    const img = PRODUCT_IMAGE_POOL[(h + step * 13) % PRODUCT_IMAGE_POOL.length];
    if (!seen.has(img)) { seen.add(img); out.push(img); }
    step++;
  }
  return out.slice(0, 6);
};

export const getReviewImages = (review = {}, max = 8) => {
  const h = hashId(review._id || review.comment || '');
  const count = Math.min(max, 3 + (h % 6)); // 3..8 photos per review
  const out = [];
  const seen = new Set();
  let step = 0;
  while (out.length < count && step < PRODUCT_IMAGE_POOL.length * 3) {
    const img = resolveProductImage(PRODUCT_IMAGE_POOL[(h + step * 17) % PRODUCT_IMAGE_POOL.length]);
    if (!seen.has(img)) { seen.add(img); out.push(img); }
    step++;
  }
  return out;
};

export const getHelpfulBase = (review = {}) => 4 + (hashId(review._id || review.comment || '') % 90);

// -------- Demo reviews --------
// Seeded products carry ratings/numOfReviews but no review entries, so we
// synthesize deterministic review cards to keep the page Flipkart-like. Real
// reviews from the backend always take precedence (ProductDetail.js).

// Curated reviewer display names. Seeded reviews store a raw `userName` field
// that is occasionally a username or free text, so the UI never renders it
// directly — every review is shown under one of these fixed Indian names.
export const REVIEWER_NAMES = [
    'Kavin Kumar',
    'Kaviyarasan',
    'Pavitra',
    'Jayanthika',
    'Deva Prakash',
    'Dinesh',
    'Ilango',
    'Vishal',
    'Naveen Kumar',
    'Deepak',
    'Manikandan',
    'Gautam',
];

// Deterministic reviewer display name for any review. A stored displayName /
// userName is trusted only when it is one of the curated names; everything else
// (usernames, emails, free text) falls back to a stable pick from the list so
// no raw account identifier is ever shown.
export const getReviewerName = (review = {}) => {
    const raw = String((review && (review.displayName || review.userName)) || '').trim();
    if (raw && REVIEWER_NAMES.includes(raw)) return raw;
    return REVIEWER_NAMES[hashId(review._id || review.comment || '') % REVIEWER_NAMES.length];
};

const DEMO_NAMES = REVIEWER_NAMES;

const DEMO_COMMENTS = [
  'Value for money. The build quality surprised me for this price range.',
  'Great product! Delivery was quick and packaging was neat.',
  'Using it for a week now and everything works as advertised.',
  'Better than expected. Would definitely recommend to friends.',
  'Solid buy. The color and finish look exactly like the pictures.',
  'Decent performance overall, good enough for daily use.',
  'I compared a few options before buying and this one won easily.',
  'Packaging was nice and the seller shipped it quickly. Happy so far.',
  'Works great, exactly what the description promised.',
  'Good quality and fast delivery. Five stars from me.',
];

export const getDemoReviews = (product = {}) => {
  const h = hashId(product._id || product.name || '');
  const count = 4 + (h % 3); // 4..6 reviews
  return Array.from({ length: count }, (_, i) => {
    const id = `demo-${product._id || 'p'}-${i}`;
    const comment = DEMO_COMMENTS[(h + i * 5) % DEMO_COMMENTS.length];
    return {
      _id: id,
      user: { name: DEMO_NAMES[(h + i * 3) % DEMO_NAMES.length] },
      rating: String(3 + ((h + i * 2) % 3)), // 3..5 stars
      comment,
    };
  });
};