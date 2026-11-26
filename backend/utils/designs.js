/**
 * Central design catalog for the Website Design Studio.
 *
 * Every design is a complete set of design tokens (colors, type, shape,
 * spacing, motion) plus descriptive metadata. The same tokens are consumed by
 * the admin preview and by the live storefront through CSS custom properties,
 * so a design looks identical in preview and in production.
 *
 * This file is the single source of truth on the backend. It is intentionally
 * dependency-free so it can be imported by controllers, scripts and tests.
 */

const FONT_STACKS = {
    manrope: "'Manrope Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, 'Helvetica Neue', Arial, sans-serif",
    georgia: "Georgia, 'Times New Roman', 'Playfair Display', serif",
    grotesk: "'Trebuchet MS', 'Segoe UI', 'Manrope Variable', sans-serif",
    mono: "'SFMono-Regular', Consolas, 'Liberation Mono', 'Courier New', monospace"
};

const IMAGE_RATIOS = ['1 / 1', '4 / 3', '3 / 2', '16 / 10', '3 / 4'];
const BUTTON_STYLES = ['solid', 'gradient', 'outline', 'pill', 'glow'];
const CARD_STYLES = ['flat', 'elevated', 'outline', 'glass', 'soft'];

const COLOR_KEYS = [
    // Global
    'primary', 'secondary', 'accent', 'background', 'backgroundSecondary',
    'surface', 'cardBg', 'sectionBg', 'pageBg', 'headerBg', 'navBg', 'footerBg',
    // Typography
    'heading', 'headingSecondary', 'bodyText', 'description', 'muted', 'link',
    'linkHover', 'price', 'discountPrice', 'productTitle', 'productDescription',
    // Borders & boxes
    'categoryBorder', 'productCardBorder', 'productImageBorder', 'sectionBorder',
    'inputBorder', 'buttonBorder', 'activeBorder', 'hoverBorder', 'divider',
    // Buttons
    'primaryButtonBg', 'primaryButtonText', 'secondaryButtonBg', 'secondaryButtonText',
    'addToCartBg', 'addToCartText', 'buyNowBg', 'buyNowText', 'checkoutButtonBg',
    'checkoutButtonText', 'buttonHoverBg', 'buttonHoverText', 'buttonDisabledBg',
    'buttonDisabledText',
    // Navigation
    'navText', 'navHover', 'activeCategory', 'dropdownBg', 'dropdownText',
    'dropdownBorder', 'megaMenuBg', 'megaMenuHover', 'bottomNavBg', 'bottomNavIcon',
    // Products
    'bestsellerBadge', 'trendingBadge', 'discountBadge', 'stockAvailable',
    'ratingStar', 'productCardBg', 'wishlistIcon', 'productPrice', 'salePrice',
    // Social
    'socialFacebook', 'socialYoutube', 'socialTwitter', 'socialInstagram',
    'socialDefault', 'socialBg', 'socialHoverBg',
    // Special sections
    'heroText', 'megaShoppingDaysBg', 'megaShoppingDaysText', 'promoBadge',
    'offersSection', 'categoryBox', 'dealsSection', 'bestSellersSection',
    'trendingSection', 'footerSection',
    // Legacy / derived-friendly
    'textSoft', 'border', 'borderStrong', 'success', 'danger', 'warning',
    'footerText', 'footerLink', 'announcementBg', 'announcementText',
    'heroGradient', 'promoGradient', 'surfaceAlt', 'accentSoft', 'primarySoft',
    'secondarySoft', 'navBorder'
];

const RANGES = {
    radius: [0, 40],
    headerHeight: [52, 120],
    containerWidth: [1560, 1800],
    sectionSpacing: [16, 72],
    animationSpeed: [0.4, 2],
    animationIntensity: [0, 1],
    shadow: [0, 2],
    categoryBorderWidth: [0, 8],
    categoryRadius: [0, 40],
    categoryPadding: [4, 48],
    productCardBorderWidth: [0, 8],
    productCardRadius: [0, 40],
    productCardPadding: [8, 48]
};

const ENUMS = {
    buttonStyle: BUTTON_STYLES,
    cardStyle: CARD_STYLES,
    imageRatio: IMAGE_RATIOS,
    categoryBorderStyle: ['solid', 'dashed', 'dotted', 'double', 'none'],
    productCardBorderStyle: ['solid', 'dashed', 'dotted', 'double', 'none']
};

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/* ------------------------------------------------------------------ */
/* Colour helpers                                                      */
/* ------------------------------------------------------------------ */

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function expandHex(hex) {
    const value = String(hex || '').trim();
    if (!HEX_RE.test(value)) return null;
    if (value.length === 4) {
        return '#' + value.slice(1).split('').map((c) => c + c).join('');
    }
    if (value.length === 9) return value.slice(0, 7);
    return value;
}

function hexToRgb(hex) {
    const value = expandHex(hex);
    if (!value) return null;
    return {
        r: parseInt(value.slice(1, 3), 16),
        g: parseInt(value.slice(3, 5), 16),
        b: parseInt(value.slice(5, 7), 16)
    };
}

function rgbToHex({ r, g, b }) {
    const to = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
    return `#${to(r)}${to(g)}${to(b)}`;
}

/** Mix a hex colour towards another hex colour by `amount` (0..1). */
function mix(hex, targetHex, amount) {
    const a = hexToRgb(hex);
    const b = hexToRgb(targetHex);
    if (!a || !b) return hex;
    const t = clamp(Number(amount) || 0, 0, 1);
    return rgbToHex({
        r: a.r + (b.r - a.r) * t,
        g: a.g + (b.g - a.g) * t,
        b: a.b + (b.b - a.b) * t
    });
}

const shade = (hex, amount) => mix(hex, '#000000', amount);
const tint = (hex, amount) => mix(hex, '#ffffff', amount);

/* ------------------------------------------------------------------ */
/* Design definitions                                                  */
/* ------------------------------------------------------------------ */

const DESIGNS = [
    {
        id: 'emox-premium',
        name: 'Premium eMox Inspired',
        shortName: 'eMox Premium',
        category: 'Premium',
        tagline: 'Clean, confident marketplace',
        description: 'A bright, editorial marketplace layout with a professional navigation bar, large promotional hero, popular category circles and dense horizontal product cards.',
        tags: ['Clean', 'Marketplace', 'Blue', 'Conversion'],
        accentLabel: 'Bright blue + signal red',
        tokens: {
            primary: '#2563eb', primaryDark: '#1d4ed8', primarySoft: '#eaf1ff',
            secondary: '#f59e0b', secondaryDark: '#d97706', secondarySoft: '#fff4e0',
            accent: '#ef4444', accentSoft: '#ffecec',
            background: '#f4f6fb', surface: '#ffffff', surfaceAlt: '#f8fafc',
            text: '#0f172a', textSoft: '#334155', muted: '#64748b',
            border: '#e6ebf3', borderStrong: '#cfd8e6',
            success: '#16a34a', danger: '#dc2626', warning: '#f59e0b',
            navBg: 'linear-gradient(180deg, #ffffff 0%, #f7faff 100%)', navText: '#0f172a', navBorder: '#e6ebf3',
            footerBg: '#0b1220', footerText: '#e2e8f0', footerLink: '#94a3b8',
            announcementBg: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)', announcementText: '#ffffff',
            heroGradient: 'linear-gradient(120deg, #eaf1ff 0%, #dbeafe 45%, #f8fafc 100%)',
            promoGradient: 'linear-gradient(120deg, #1d4ed8 0%, #2563eb 48%, #7c3aed 100%)',
            headingFont: FONT_STACKS.manrope, bodyFont: FONT_STACKS.manrope, accentFont: FONT_STACKS.manrope,
            radius: 16, cardRadius: 16, buttonRadius: 12,
            cardStyle: 'elevated', buttonStyle: 'solid',
            shadow: '0 8px 24px rgba(15, 23, 42, 0.08)', shadowHover: '0 18px 40px rgba(37, 99, 235, 0.18)',
            containerWidth: 1640, headerHeight: 72, sectionSpacing: 40, imageRatio: '4 / 3', gridGap: 20,
            animationSpeed: 1, animationIntensity: 0.7, motion: 'smooth',
            density: 'comfortable', headingTransform: 'none', headingWeight: 800
        }
    },
    {
        id: 'luxury-black-gold',
        name: 'Luxury Black & Gold',
        shortName: 'Black & Gold',
        category: 'Luxury',
        tagline: 'Quiet opulence, editorial serif',
        description: 'A dramatic black canvas with champagne-gold detailing, elegant serif headlines, outlined product cards and slow, cinematic transitions.',
        tags: ['Dark', 'Gold', 'Serif', 'High-end'],
        accentLabel: 'Champagne gold on obsidian',
        tokens: {
            primary: '#d4af37', primaryDark: '#b8912a', primarySoft: '#2a2416',
            secondary: '#f5e6b8', secondaryDark: '#e6d090', secondarySoft: '#2a2416',
            accent: '#f7e7b0', accentSoft: '#2a2416',
            background: '#080808', surface: '#121212', surfaceAlt: '#191919',
            text: '#f4efe4', textSoft: '#c9c1b2', muted: '#8f8778',
            border: '#2a2620', borderStrong: '#3a342b',
            success: '#4ade80', danger: '#f87171', warning: '#fbbf24',
            navBg: 'linear-gradient(180deg, #0b0b0b 0%, #050505 100%)', navText: '#f4efe4', navBorder: '#2a2620',
            footerBg: '#050505', footerText: '#e8dfcd', footerLink: '#a99e88',
            announcementBg: 'linear-gradient(90deg, #0b0b0b 0%, #3a2f14 50%, #0b0b0b 100%)', announcementText: '#f0d98a',
            heroGradient: 'linear-gradient(120deg, #0a0a0a 0%, #1a1508 50%, #2a2109 100%)',
            promoGradient: 'linear-gradient(120deg, #141006 0%, #3a2f14 50%, #141006 100%)',
            headingFont: FONT_STACKS.georgia, bodyFont: FONT_STACKS.system, accentFont: FONT_STACKS.georgia,
            radius: 2, cardRadius: 3, buttonRadius: 2,
            cardStyle: 'outline', buttonStyle: 'gradient',
            shadow: '0 10px 30px rgba(0, 0, 0, 0.55)', shadowHover: '0 22px 50px rgba(212, 175, 55, 0.18)',
            containerWidth: 1580, headerHeight: 84, sectionSpacing: 52, imageRatio: '4 / 3', gridGap: 22,
            animationSpeed: 1.25, animationIntensity: 0.5, motion: 'luxury',
            density: 'spacious', headingTransform: 'uppercase', headingWeight: 500
        }
    },
    {
        id: 'modern-minimalist',
        name: 'Modern Minimalist',
        shortName: 'Minimalist',
        category: 'Minimal',
        tagline: 'Space is the luxury',
        description: 'Warm off-white surfaces, hairline borders, generous whitespace and restrained type. Products breathe and navigation stays out of the way.',
        tags: ['Light', 'Minimal', 'Spacious', 'Neutral'],
        accentLabel: 'Ink black with a terracotta accent',
        tokens: {
            primary: '#111111', primaryDark: '#000000', primarySoft: '#f0f0ee',
            secondary: '#6b7280', secondaryDark: '#4b5563', secondarySoft: '#f3f4f6',
            accent: '#c2410c', accentSoft: '#fff1e8',
            background: '#f7f7f5', surface: '#ffffff', surfaceAlt: '#f2f2ef',
            text: '#111111', textSoft: '#3f3f3f', muted: '#8a8a86',
            border: '#e6e6e1', borderStrong: '#d4d4cd',
            success: '#15803d', danger: '#b91c1c', warning: '#b45309',
            navBg: '#ffffff', navText: '#111111', navBorder: '#ecece7',
            footerBg: '#111111', footerText: '#f5f5f2', footerLink: '#b8b8b2',
            announcementBg: '#111111', announcementText: '#ffffff',
            heroGradient: 'linear-gradient(120deg, #f1f1ed 0%, #e8e8e2 100%)',
            promoGradient: 'linear-gradient(120deg, #e9e9e4 0%, #f7f7f5 100%)',
            headingFont: FONT_STACKS.system, bodyFont: FONT_STACKS.system, accentFont: FONT_STACKS.system,
            radius: 4, cardRadius: 2, buttonRadius: 2,
            cardStyle: 'flat', buttonStyle: 'outline',
            shadow: '0 1px 0 rgba(17, 17, 17, 0.06)', shadowHover: '0 10px 24px rgba(17, 17, 17, 0.08)',
            containerWidth: 1560, headerHeight: 76, sectionSpacing: 56, imageRatio: '1 / 1', gridGap: 28,
            animationSpeed: 1.1, animationIntensity: 0.3, motion: 'minimal',
            density: 'spacious', headingTransform: 'none', headingWeight: 600
        }
    },
    {
        id: 'premium-gradient',
        name: 'Premium Gradient',
        shortName: 'Gradient',
        category: 'Gradient',
        tagline: 'Colour, light and glass',
        description: 'A violet-to-pink gradient world with frosted glass cards, floating product tiles, animated buttons and a soft aurora background.',
        tags: ['Gradient', 'Glass', 'Vibrant', 'Animated'],
        accentLabel: 'Violet → pink → cyan',
        tokens: {
            primary: '#7c3aed', primaryDark: '#6d28d9', primarySoft: '#f0e9ff',
            secondary: '#ec4899', secondaryDark: '#db2777', secondarySoft: '#ffe8f4',
            accent: '#22d3ee', accentSoft: '#e0fbff',
            background: '#f6f2ff', surface: 'rgba(255, 255, 255, 0.78)', surfaceAlt: 'rgba(255, 255, 255, 0.55)',
            text: '#1e1b4b', textSoft: '#4c4680', muted: '#7a74a8',
            border: 'rgba(124, 58, 237, 0.18)', borderStrong: 'rgba(124, 58, 237, 0.3)',
            success: '#059669', danger: '#e11d48', warning: '#d97706',
            navBg: 'linear-gradient(120deg, rgba(124, 58, 237, 0.94) 0%, rgba(236, 72, 153, 0.9) 100%)', navText: '#ffffff', navBorder: 'rgba(255,255,255,0.18)',
            footerBg: '#1e1b4b', footerText: '#ede9fe', footerLink: '#c4b5fd',
            announcementBg: 'linear-gradient(90deg, #7c3aed 0%, #ec4899 50%, #22d3ee 100%)', announcementText: '#ffffff',
            heroGradient: 'linear-gradient(125deg, #7c3aed 0%, #a855f7 40%, #ec4899 100%)',
            promoGradient: 'linear-gradient(120deg, #22d3ee 0%, #7c3aed 55%, #ec4899 100%)',
            headingFont: FONT_STACKS.manrope, bodyFont: FONT_STACKS.manrope, accentFont: FONT_STACKS.manrope,
            radius: 24, cardRadius: 22, buttonRadius: 999,
            cardStyle: 'glass', buttonStyle: 'gradient',
            shadow: '0 18px 40px rgba(124, 58, 237, 0.16)', shadowHover: '0 26px 60px rgba(236, 72, 153, 0.28)',
            containerWidth: 1600, headerHeight: 78, sectionSpacing: 48, imageRatio: '4 / 3', gridGap: 22,
            animationSpeed: 0.95, animationIntensity: 0.9, motion: 'playful',
            density: 'comfortable', headingTransform: 'none', headingWeight: 800
        }
    },
    {
        id: 'flipkart-shopping',
        name: 'Flipkart-Inspired Shopping',
        shortName: 'Marketplace Pro',
        category: 'Marketplace',
        tagline: 'High-density deal machine',
        description: 'A blue-and-yellow shopping workhorse: dense category bar, promotional hero, compact product grids and fast, snappy interactions built for conversion.',
        tags: ['Marketplace', 'Dense', 'Blue', 'Deals'],
        accentLabel: 'Flipkart blue + deal yellow',
        tokens: {
            primary: '#2874f0', primaryDark: '#1f5fcc', primarySoft: '#e8f0fe',
            secondary: '#ffc107', secondaryDark: '#f5b500', secondarySoft: '#fff7e0',
            accent: '#fb641b', accentSoft: '#fff0e8',
            background: '#f1f3f6', surface: '#ffffff', surfaceAlt: '#f8fafc',
            text: '#172033', textSoft: '#3a4356', muted: '#6b7280',
            border: '#e5e7eb', borderStrong: '#d3d9e3',
            success: '#388e3c', danger: '#dc2626', warning: '#f59e0b',
            navBg: 'linear-gradient(180deg, #2874f0 0%, #1f5fcc 100%)', navText: '#ffffff', navBorder: '#1f5fcc',
            footerBg: '#172337', footerText: '#e2e8f0', footerLink: '#a9b7cc',
            announcementBg: '#2874f0', announcementText: '#ffffff',
            heroGradient: 'linear-gradient(120deg, #1f5fcc 0%, #2874f0 55%, #5b9bff 100%)',
            promoGradient: 'linear-gradient(120deg, #ffc107 0%, #ff9f1c 100%)',
            headingFont: FONT_STACKS.manrope, bodyFont: FONT_STACKS.manrope, accentFont: FONT_STACKS.manrope,
            radius: 6, cardRadius: 4, buttonRadius: 4,
            cardStyle: 'elevated', buttonStyle: 'solid',
            shadow: '0 1px 4px rgba(23, 32, 51, 0.08)', shadowHover: '0 8px 20px rgba(40, 116, 240, 0.18)',
            containerWidth: 1680, headerHeight: 64, sectionSpacing: 28, imageRatio: '1 / 1', gridGap: 14,
            animationSpeed: 0.8, animationIntensity: 0.6, motion: 'snappy',
            density: 'compact', headingTransform: 'none', headingWeight: 700
        }
    },
    {
        id: 'apple-premium',
        name: 'Apple-Inspired Premium',
        shortName: 'Apple Premium',
        category: 'Premium',
        tagline: 'Less, but better',
        description: 'Huge whitespace, translucent navigation, oversized typography and a calm monochrome palette that lets product photography lead.',
        tags: ['Minimal', 'Premium', 'Light', 'Product-first'],
        accentLabel: 'Graphite on soft silver',
        tokens: {
            primary: '#0071e3', primaryDark: '#0062c4', primarySoft: '#e8f2ff',
            secondary: '#86868b', secondaryDark: '#6e6e73', secondarySoft: '#f0f0f2',
            accent: '#2997ff', accentSoft: '#eaf5ff',
            background: '#f5f5f7', surface: '#ffffff', surfaceAlt: '#fbfbfd',
            text: '#1d1d1f', textSoft: '#424245', muted: '#86868b',
            border: '#e5e5ea', borderStrong: '#d2d2d7',
            success: '#1d9d55', danger: '#d70015', warning: '#b25000',
            navBg: 'rgba(251, 251, 253, 0.88)', navText: '#1d1d1f', navBorder: 'rgba(0, 0, 0, 0.08)',
            footerBg: '#f5f5f7', footerText: '#424245', footerLink: '#6e6e73',
            announcementBg: '#1d1d1f', announcementText: '#f5f5f7',
            heroGradient: 'linear-gradient(160deg, #ffffff 0%, #f0f0f4 55%, #e6e6ec 100%)',
            promoGradient: 'linear-gradient(140deg, #e9f2ff 0%, #f5f5f7 100%)',
            headingFont: FONT_STACKS.system, bodyFont: FONT_STACKS.system, accentFont: FONT_STACKS.system,
            radius: 20, cardRadius: 18, buttonRadius: 999,
            cardStyle: 'soft', buttonStyle: 'pill',
            shadow: '0 4px 20px rgba(0, 0, 0, 0.05)', shadowHover: '0 16px 40px rgba(0, 0, 0, 0.1)',
            containerWidth: 1560, headerHeight: 58, sectionSpacing: 64, imageRatio: '4 / 3', gridGap: 26,
            animationSpeed: 1.15, animationIntensity: 0.35, motion: 'minimal',
            density: 'spacious', headingTransform: 'none', headingWeight: 700
        }
    },
    {
        id: 'futuristic-tech',
        name: 'Futuristic Technology',
        shortName: 'Futuristic',
        category: 'Technology',
        tagline: 'Neon systems online',
        description: 'A deep-space navy interface with cyan and magenta neon, glowing card borders, animated grid lines and monospace technical accents.',
        tags: ['Dark', 'Neon', 'Tech', 'Glow'],
        accentLabel: 'Cyan + magenta on deep navy',
        tokens: {
            primary: '#00f0ff', primaryDark: '#00c4d4', primarySoft: '#062a33',
            secondary: '#ff2d95', secondaryDark: '#d81b7a', secondarySoft: '#2a0a1c',
            accent: '#7cffcb', accentSoft: '#062a24',
            background: '#050816', surface: '#0b1224', surfaceAlt: '#0e1730',
            text: '#e6f1ff', textSoft: '#a9bad8', muted: '#6b7fa3',
            border: '#1a2742', borderStrong: '#26385c',
            success: '#34d399', danger: '#fb7185', warning: '#fbbf24',
            navBg: 'linear-gradient(180deg, rgba(5, 8, 22, 0.98) 0%, rgba(5, 8, 22, 0.86) 100%)', navText: '#e6f1ff', navBorder: '#1a2742',
            footerBg: '#03060f', footerText: '#cfe0ff', footerLink: '#6b7fa3',
            announcementBg: 'linear-gradient(90deg, #00f0ff 0%, #7cffcb 100%)', announcementText: '#03131a',
            heroGradient: 'linear-gradient(120deg, #050816 0%, #0a1a3a 45%, #1a0b2e 100%)',
            promoGradient: 'linear-gradient(120deg, #00f0ff 0%, #ff2d95 100%)',
            headingFont: FONT_STACKS.grotesk, bodyFont: FONT_STACKS.system, accentFont: FONT_STACKS.mono,
            radius: 10, cardRadius: 12, buttonRadius: 8,
            cardStyle: 'glass', buttonStyle: 'glow',
            shadow: '0 0 0 1px rgba(0, 240, 255, 0.16), 0 12px 30px rgba(0, 0, 0, 0.5)', shadowHover: '0 0 28px rgba(0, 240, 255, 0.35), 0 18px 40px rgba(255, 45, 149, 0.18)',
            containerWidth: 1620, headerHeight: 72, sectionSpacing: 44, imageRatio: '16 / 10', gridGap: 20,
            animationSpeed: 0.9, animationIntensity: 1, motion: 'tech',
            density: 'comfortable', headingTransform: 'uppercase', headingWeight: 800
        }
    },
    {
        id: 'fashion-editorial',
        name: 'Modern Fashion Store',
        shortName: 'Fashion Editorial',
        category: 'Fashion',
        tagline: 'A magazine you can shop',
        description: 'A warm cream editorial canvas, oversized serif headlines, tall image-led product cards, gold rules and a runway-inspired hover treatment.',
        tags: ['Editorial', 'Fashion', 'Serif', 'Image-led'],
        accentLabel: 'Cream, ink and antique gold',
        tokens: {
            primary: '#111111', primaryDark: '#000000', primarySoft: '#f3efe8',
            secondary: '#c9a227', secondaryDark: '#a9861a', secondarySoft: '#faf3dc',
            accent: '#e11d48', accentSoft: '#ffe8ed',
            background: '#faf7f2', surface: '#ffffff', surfaceAlt: '#f5f0e8',
            text: '#1a1a1a', textSoft: '#4a4640', muted: '#8a8378',
            border: '#e9e2d6', borderStrong: '#d8cdbb',
            success: '#2f7d4f', danger: '#b91c1c', warning: '#a16207',
            navBg: '#ffffff', navText: '#1a1a1a', navBorder: '#e9e2d6',
            footerBg: '#0b1220', footerText: '#f7f2e9', footerLink: '#c9bfae',
            announcementBg: '#0b1220', announcementText: '#f7f2e9',
            heroGradient: 'linear-gradient(120deg, #f3ece1 0%, #e8ddca 60%, #d9c7ad 100%)',
            promoGradient: 'linear-gradient(120deg, #1a1a1a 0%, #3a3328 100%)',
            headingFont: FONT_STACKS.georgia, bodyFont: FONT_STACKS.system, accentFont: FONT_STACKS.georgia,
            radius: 20, cardRadius: 20, buttonRadius: 999,
            cardStyle: 'elevated', buttonStyle: 'solid',
            shadow: '0 8px 24px rgba(26, 26, 26, 0.06)', shadowHover: '0 18px 40px rgba(26, 26, 26, 0.12)',
            containerWidth: 1580, headerHeight: 88, sectionSpacing: 60, imageRatio: '3 / 4', gridGap: 24,
            animationSpeed: 1.2, animationIntensity: 0.55, motion: 'editorial',
            density: 'spacious', headingTransform: 'none', headingWeight: 500
        }
    },
    {
        id: 'colorful-marketplace',
        name: 'Colorful Marketplace',
        shortName: 'Colorful',
        category: 'Colorful',
        tagline: 'Shopping should feel joyful',
        description: 'A rose, amber and cyan festival of colour with rounded cards, playful badges, gradient buttons and energetic hover motion.',
        tags: ['Colorful', 'Playful', 'Rounded', 'Vibrant'],
        accentLabel: 'Rose, amber and cyan',
        tokens: {
            primary: '#f43f5e', primaryDark: '#e11d48', primarySoft: '#ffe8ed',
            secondary: '#f59e0b', secondaryDark: '#d97706', secondarySoft: '#fff4dd',
            accent: '#06b6d4', accentSoft: '#e0f9ff',
            background: '#fff8f5', surface: '#ffffff', surfaceAlt: '#fff1ec',
            text: '#2a1520', textSoft: '#5c4450', muted: '#947c88',
            border: '#ffe1d9', borderStrong: '#ffc9bb',
            success: '#0d9488', danger: '#dc2626', warning: '#d97706',
            navBg: 'linear-gradient(120deg, #f43f5e 0%, #fb7185 45%, #f59e0b 100%)', navText: '#ffffff', navBorder: 'rgba(255,255,255,0.2)',
            footerBg: '#2a1520', footerText: '#ffeef0', footerLink: '#ffc9d4',
            announcementBg: 'linear-gradient(90deg, #f43f5e 0%, #f59e0b 50%, #06b6d4 100%)', announcementText: '#ffffff',
            heroGradient: 'linear-gradient(120deg, #f43f5e 0%, #fb7185 40%, #f59e0b 100%)',
            promoGradient: 'linear-gradient(120deg, #06b6d4 0%, #f43f5e 55%, #f59e0b 100%)',
            headingFont: FONT_STACKS.manrope, bodyFont: FONT_STACKS.manrope, accentFont: FONT_STACKS.manrope,
            radius: 18, cardRadius: 18, buttonRadius: 999,
            cardStyle: 'elevated', buttonStyle: 'gradient',
            shadow: '0 10px 26px rgba(244, 63, 94, 0.14)', shadowHover: '0 20px 44px rgba(245, 158, 11, 0.26)',
            containerWidth: 1640, headerHeight: 72, sectionSpacing: 38, imageRatio: '4 / 3', gridGap: 18,
            animationSpeed: 0.85, animationIntensity: 0.95, motion: 'playful',
            density: 'comfortable', headingTransform: 'none', headingWeight: 800
        }
    },
    {
        id: 'ultra-glass',
        name: 'Ultra Premium Glass UI',
        shortName: 'Ultra Glass',
        category: 'Glass',
        tagline: 'Depth without weight',
        description: 'A deep teal night with frosted glass navigation, translucent cards, soft aurora gradients, floating elements and refined micro-interactions.',
        tags: ['Glass', 'Dark', 'Blur', 'Premium'],
        accentLabel: 'Ice blue, lavender and mint glass',
        tokens: {
            primary: '#38bdf8', primaryDark: '#0ea5e9', primarySoft: '#062a3a',
            secondary: '#a78bfa', secondaryDark: '#8b5cf6', secondarySoft: '#1b1533',
            accent: '#5eead4', accentSoft: '#062a26',
            background: '#071521', surface: 'rgba(255, 255, 255, 0.08)', surfaceAlt: 'rgba(255, 255, 255, 0.05)',
            text: '#eaf4ff', textSoft: '#b6cbe0', muted: '#7d96ad',
            border: 'rgba(255, 255, 255, 0.14)', borderStrong: 'rgba(255, 255, 255, 0.24)',
            success: '#34d399', danger: '#fb7185', warning: '#fbbf24',
            navBg: 'rgba(7, 21, 33, 0.58)', navText: '#eaf4ff', navBorder: 'rgba(255, 255, 255, 0.12)',
            footerBg: 'rgba(4, 12, 20, 0.78)', footerText: '#dbeafe', footerLink: '#93b4cc',
            announcementBg: 'linear-gradient(90deg, rgba(56, 189, 248, 0.9) 0%, rgba(167, 139, 250, 0.9) 100%)', announcementText: '#04121c',
            heroGradient: 'linear-gradient(130deg, #0b2436 0%, #123a52 45%, #2a1b52 100%)',
            promoGradient: 'linear-gradient(120deg, rgba(56, 189, 248, 0.85) 0%, rgba(167, 139, 250, 0.85) 100%)',
            headingFont: FONT_STACKS.manrope, bodyFont: FONT_STACKS.manrope, accentFont: FONT_STACKS.manrope,
            radius: 22, cardRadius: 20, buttonRadius: 999,
            cardStyle: 'glass', buttonStyle: 'gradient',
            shadow: '0 16px 40px rgba(2, 8, 20, 0.45)', shadowHover: '0 24px 60px rgba(56, 189, 248, 0.22)',
            containerWidth: 1600, headerHeight: 76, sectionSpacing: 50, imageRatio: '4 / 3', gridGap: 22,
            animationSpeed: 1, animationIntensity: 0.8, motion: 'glass',
            density: 'comfortable', headingTransform: 'none', headingWeight: 800
        }
    }
];

const DEFAULT_DESIGN_ID = 'emox-premium';
const DESIGN_MAP = DESIGNS.reduce((map, design) => {
    map[design.id] = design;
    return map;
}, {});

function getDesign(id) {
    return DESIGN_MAP[id] || null;
}

function listDesigns() {
    return DESIGNS;
}

/* ------------------------------------------------------------------ */
/* Customisation validation                                            */
/* ------------------------------------------------------------------ */

function sanitizeCustomization(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
    const clean = {};

    COLOR_KEYS.forEach((key) => {
        if (typeof input[key] === 'string' && HEX_RE.test(input[key].trim())) {
            clean[key] = expandHex(input[key].trim());
        }
    });

    if (typeof input.headingFont === 'string'
        && Object.values(FONT_STACKS).includes(input.headingFont)) {
        clean.headingFont = input.headingFont;
    }
    if (typeof input.bodyFont === 'string'
        && Object.values(FONT_STACKS).includes(input.bodyFont)) {
        clean.bodyFont = input.bodyFont;
    }

    Object.keys(RANGES).forEach((key) => {
        const value = Number(input[key]);
        if (Number.isFinite(value)) {
            const [min, max] = RANGES[key];
            clean[key] = clamp(value, min, max);
        }
    });

    Object.keys(ENUMS).forEach((key) => {
        if (typeof input[key] === 'string' && ENUMS[key].includes(input[key])) {
            clean[key] = input[key];
        }
    });

    if (typeof input.radius === 'number') {
        clean.radius = clamp(Number(input.radius), 0, 40);
    }

    return clean;
}

/**
 * Merge a design's base tokens with a sanitised customisation object and
 * derive dependent shades so a custom primary/secondary still has matching
 * hover/soft colours.
 */
function resolveDesign(designId, customization) {
    const base = getDesign(designId) || getDesign(DEFAULT_DESIGN_ID);
    const clean = sanitizeCustomization(customization);
    const tokens = Object.assign({}, base.tokens, clean);

    if (clean.primary) {
        tokens.primaryDark = shade(clean.primary, 0.18);
        tokens.primarySoft = tint(clean.primary, 0.88);
    }
    if (clean.secondary) {
        tokens.secondaryDark = shade(clean.secondary, 0.16);
        tokens.secondarySoft = tint(clean.secondary, 0.86);
    }
    if (clean.accent) {
        tokens.accentSoft = tint(clean.accent, 0.86);
    }

    // Keep derived shape values coherent with a custom radius.
    if (clean.radius !== undefined) {
        tokens.radius = clean.radius;
        if (base.tokens.buttonRadius < 900) {
            tokens.buttonRadius = Math.min(clean.radius, 18);
        }
        tokens.cardRadius = clean.radius;
    }

    if (clean.buttonStyle === 'pill') tokens.buttonRadius = 999;
    if (clean.buttonStyle === 'solid' && base.tokens.buttonRadius >= 900) tokens.buttonRadius = 12;

    if (clean.shadow !== undefined) {
        const level = clean.shadow;
        tokens.shadow = level === 0
            ? 'none'
            : `0 ${Math.round(6 + level * 6)}px ${Math.round(18 + level * 14)}px rgba(15, 23, 42, ${0.06 + level * 0.06})`;
        tokens.shadowHover = level === 0
            ? 'none'
            : `0 ${Math.round(14 + level * 8)}px ${Math.round(34 + level * 16)}px rgba(15, 23, 42, ${0.1 + level * 0.08})`;
    }

    return tokens;
}

module.exports = {
    DESIGNS,
    DEFAULT_DESIGN_ID,
    FONT_STACKS,
    IMAGE_RATIOS,
    BUTTON_STYLES,
    CARD_STYLES,
    COLOR_KEYS,
    RANGES,
    ENUMS,
    getDesign,
    listDesigns,
    sanitizeCustomization,
    resolveDesign,
    shade,
    tint
};
