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
export const getDeliveryDate = (seed = '', days = null) => {
  const d = new Date();
  d.setDate(d.getDate() + (Number(days) > 0 ? Number(days) : getDelivery({ _id: String(seed || 'delivery') }).days));
  return d;
};

export const getDeliveryLabel = (seed = '', days = null) =>
  getDeliveryDate(seed, days).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

export const getDeliveryDay = (seed = '', days = null) =>
  getDeliveryDate(seed, days).toLocaleDateString('en-US', { weekday: 'long' });

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

// Category-aware fallbacks. A broken/missing image never borrows another
// product's picture — it falls back to a neutral illustration for its own
// category instead.
const PLACEHOLDERS = {
    chocolate: '/images/placeholders/chocolate.svg',
    headphones: '/images/placeholders/headphones.svg',
    mobile: '/images/placeholders/mobile.svg',
    laptop: '/images/placeholders/laptop.svg',
    shoes: '/images/placeholders/shoes.svg'
};

export const fallbackForProduct = (product = {}) => {
    const text = `${product.name || product.title || ''} ${product.category || ''}`.toLowerCase();
    if (/kitkat|chocolate|sweet|candy/.test(text)) return PLACEHOLDERS.chocolate;
    if (/headphone|earphone|airpod|audio|speaker/.test(text)) return PLACEHOLDERS.headphones;
    if (/mobile|phone|smartphone|iphone|galaxy/.test(text)) return PLACEHOLDERS.mobile;
    if (/laptop|macbook|notebook|computer/.test(text)) return PLACEHOLDERS.laptop;
    if (/shoe|sneaker|footwear|slipper/.test(text)) return PLACEHOLDERS.shoes;
    return IMAGE_FALLBACK;
};

export const resolveProductImage = (src) => {
  if (!src) return IMAGE_FALLBACK;
  const s = String(src);
  if (/^https?:\/\//i.test(s)) {
    //Legacy admin uploads baked in whatever host the backend ran on at the
    //time. Uploaded files always live under /uploads on the API origin, so
    //re-point them at the configured API base instead of a stale hostname.
    try {
      const parsed = new URL(s);
      if (parsed.pathname.startsWith('/uploads/')) {
        return API_BASE_URL.replace(/\/+$/, '') + parsed.pathname;
      }
    } catch (e) {
      /* not a parseable URL — fall through and use it as-is */
    }
    return s;
  }
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
  el.src = el.dataset.fallback || fallbackForProduct({ name: el.alt, category: el.dataset.category });
};

// First image of a product (card/thumbnail usage), resolved + fallback.
export const productImage = (product = {}) =>
  resolveProductImage(product && product.images && product.images[0] ? product.images[0].image : fallbackForProduct(product));

// -------- Gallery / review media --------
// Every image shown for a product comes from that product's own `images`
// array. There is no shared/random image pool any more: topping galleries up
// with unrelated photos made different products display the same pictures,
// which is exactly the bug this helper used to cause.

const hashId = (s = '') => {
  let h = 0;
  const str = String(s);
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

// Resolved, de-duplicated list of the product's own images (primary first).
export const productImages = (product = {}) => {
  const out = [];
  const seen = new Set();
  (product.images || []).forEach((img) => {
    const raw = img && img.image ? img.image : img;
    if (!raw) return;
    const resolved = resolveProductImage(raw);
    if (!resolved || seen.has(resolved)) return;
    seen.add(resolved);
    out.push(resolved);
  });
  return out;
};

// Gallery for the product detail page: the product's own images only. When a
// product has no images we return one placeholder so the gallery layout stays
// intact instead of collapsing.
export const getGalleryImages = (product = {}) => {
  const own = productImages(product);
  return own.length ? own : [fallbackForProduct(product)];
};

// Review photos: only images genuinely attached to the review. Demo reviews
// have none, so they render without a photo strip (no borrowed product shots).
export const getReviewImages = (review = {}, product = {}, max = 8) => {
  const raw = Array.isArray(review.images) ? review.images : [];
  const out = [];
  const seen = new Set();
  raw.forEach((img) => {
    const src = img && img.image ? img.image : img;
    if (!src) return;
    const resolved = resolveProductImage(src);
    if (!resolved || seen.has(resolved)) return;
    seen.add(resolved);
    out.push(resolved);
  });
  return out.slice(0, max);
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