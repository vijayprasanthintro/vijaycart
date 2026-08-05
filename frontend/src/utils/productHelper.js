// Compute display pricing for a product. Stored `mrp` / `discount` (seeded or
// set by admins) are preferred; older products without them fall back to a
// stable deterministic discount so cards still look premium.
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

// -------- Gallery / review demo media --------
// Most seeded products carry a single image, so we build multi-image galleries
// and review photos deterministically from the shared public image pool. The
// product's own images always come first and are never duplicated.

// Only files that actually ship in `frontend/public/images/products` are listed
// (1-27 numeric plus the named SVGs). Referencing anything else 404s, so the
// gallery/review demo images are built exclusively from files that exist.
const NUMERIC_POOL = Array.from({ length: 27 }, (_, i) => `/images/products/${i + 1}.jpg`);
const NAMED_POOL = [
  '/images/products/accessories-mouse.svg',
  '/images/products/accessories-powerbank.svg',
  '/images/products/audio-buds.svg',
  '/images/products/beauty-cream.svg',
  '/images/products/beauty-hairoil.svg',
  '/images/products/beauty-protein.svg',
  '/images/products/beauty-serum.svg',
  '/images/products/beauty-sunscreen.svg',
  '/images/products/beauty-vitamin.svg',
  '/images/products/book-atomic.svg',
  '/images/products/book-kids.svg',
  '/images/products/book-midnight.svg',
  '/images/products/book-richdad.svg',
  '/images/products/book-science.svg',
  '/images/products/food-coffee.svg',
  '/images/products/food-dry-fruits.svg',
  '/images/products/food-honey.svg',
  '/images/products/food-olive-oil.svg',
  '/images/products/food-rice.svg',
  '/images/products/food-tea.svg',
  '/images/products/home-bed.svg',
  '/images/products/home-cookware.svg',
  '/images/products/home-dinner-set.svg',
  '/images/products/home-lamp.svg',
  '/images/products/home-sofa.svg',
  '/images/products/home-table.svg',
  '/images/products/kids-romper.svg',
  '/images/products/kids-sneakers.svg',
  '/images/products/kids-tshirt.svg',
  '/images/products/men-jeans.svg',
  '/images/products/men-shirt.svg',
  '/images/products/men-shoes.svg',
  '/images/products/outdoor-backpack.svg',
  '/images/products/outdoor-bike.svg',
  '/images/products/outdoor-boots.svg',
  '/images/products/outdoor-sleeping-bag.svg',
  '/images/products/outdoor-tent.svg',
  '/images/products/outdoor-yoga.svg',
  '/images/products/wearables-band.svg',
  '/images/products/women-dress.svg',
  '/images/products/women-handbag.svg',
  '/images/products/women-heels.svg',
];
const PRODUCT_IMAGE_POOL = [...NUMERIC_POOL, ...NAMED_POOL];

const hashId = (s = '') => {
  let h = 0;
  const str = String(s);
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export const getGalleryImages = (product = {}) => {
  const own = (product.images || []).map(i => i.image).filter(Boolean);
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
    const img = PRODUCT_IMAGE_POOL[(h + step * 17) % PRODUCT_IMAGE_POOL.length];
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

const DEMO_NAMES = ['Rahul Sharma', 'Priya Patel', 'Amit Verma', 'Sneha Kulkarni', 'Vikram Singh', 'Ananya Iyer', 'Mohammed Ali', 'Divya Nair'];

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