import { Helmet } from "react-helmet-async"

const SITE_URL = process.env.REACT_APP_SITE_URL || 'https://vijaycart.com';
const SITE_NAME = 'VijayCart';
const DEFAULT_DESCRIPTION = 'Shop mobiles, laptops, electronics and more with Cash on Delivery, UPI, cards and free shipping across India.';
const DEFAULT_IMAGE = '/images/logo.png';

// Resolve a site-relative path (or absolute URL) against the canonical origin
// so Open Graph / Twitter / canonical tags always carry a full URL.
const absoluteUrl = (path) => {
  if (!path) return `${SITE_URL}/`;
  if (/^https?:\/\//i.test(path)) return path;
  return SITE_URL + (path.startsWith('/') ? path : `/${path}`);
};

export default function MetaData({
  title,
  description,
  path,
  image,
  type = 'website',
  jsonLd,
  noindex = false,
}) {
  const fullTitle = title ? `${title} - ${SITE_NAME}` : `${SITE_NAME} - Smart Shopping. Better Choices.`;
  const desc = description || DEFAULT_DESCRIPTION;
  const canonical = absoluteUrl(path || '/');
  const ogImage = absoluteUrl(image || DEFAULT_IMAGE);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
