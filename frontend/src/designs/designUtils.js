/**
 * Frontend design helpers.
 *
 * The backend is the source of truth for the 10 designs (names, descriptions
 * and full token sets). This module only needs to know how to turn a token set
 * into CSS custom properties, how to merge administrator overrides, and how to
 * cache the live design so the correct palette paints on the very first frame
 * (before /settings has finished loading).
 */

export const DEFAULT_DESIGN_ID = 'emox-premium';

export const DESIGN_CACHE_KEY = 'vc_design_state_v1';
const CACHE_KEY = DESIGN_CACHE_KEY;
export const THEME_PENDING_CLASS = 'vc-theme-pending';

export const FONT_OPTIONS = [
    {
        id: 'manrope',
        label: 'Manrope — Modern sans',
        value: "'Manrope Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    },
    {
        id: 'system',
        label: 'System — Apple / neutral',
        value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, 'Helvetica Neue', Arial, sans-serif"
    },
    {
        id: 'georgia',
        label: 'Georgia — Editorial serif',
        value: "Georgia, 'Times New Roman', 'Playfair Display', serif"
    },
    {
        id: 'grotesk',
        label: 'Grotesk — Technical',
        value: "'Trebuchet MS', 'Segoe UI', 'Manrope Variable', sans-serif"
    },
    {
        id: 'mono',
        label: 'Mono — Futuristic',
        value: "'SFMono-Regular', Consolas, 'Liberation Mono', 'Courier New', monospace"
    }
];

export const COLOR_GROUPS = [
    {
        title: 'Global colors',
        fields: [
            { key: 'primary', label: 'Primary color', hint: 'Buttons, links, active navigation' },
            { key: 'secondary', label: 'Secondary color', hint: 'Badges and supporting highlights' },
            { key: 'accent', label: 'Accent color', hint: 'Promotions and emphasis' },
            { key: 'background', label: 'Main background', hint: 'Page canvas' },
            { key: 'backgroundSecondary', label: 'Secondary background', hint: 'Alternate page surface' },
            { key: 'surface', label: 'Surface color', hint: 'Cards and panels' },
            { key: 'cardBg', label: 'Card background', hint: 'Product/category cards' },
            { key: 'sectionBg', label: 'Section background', hint: 'Content sections' },
            { key: 'pageBg', label: 'Page background', hint: 'Outer page canvas' },
            { key: 'headerBg', label: 'Header background', hint: 'Top header bar' },
            { key: 'navBg', label: 'Navigation background', hint: 'Category navigation' },
            { key: 'footerBg', label: 'Footer background', hint: 'Bottom footer surface' }
        ]
    },
    {
        title: 'Typography colors',
        fields: [
            { key: 'heading', label: 'Main heading color', hint: 'H1-H3 headings' },
            { key: 'headingSecondary', label: 'Secondary heading color', hint: 'Sub-headings' },
            { key: 'bodyText', label: 'Body text color', hint: 'Paragraph copy' },
            { key: 'description', label: 'Description color', hint: 'Secondary copy' },
            { key: 'muted', label: 'Muted text color', hint: 'Hints and meta' },
            { key: 'link', label: 'Link color', hint: 'Hyperlinks' },
            { key: 'linkHover', label: 'Link hover color', hint: 'Hovered links' },
            { key: 'price', label: 'Price color', hint: 'Product prices' },
            { key: 'discountPrice', label: 'Discount price color', hint: 'Sale prices' },
            { key: 'productTitle', label: 'Product title color', hint: 'Card titles' },
            { key: 'productDescription', label: 'Product description color', hint: 'Card descriptions' }
        ]
    },
    {
        title: 'Borders and boxes',
        fields: [
            { key: 'categoryBorder', label: 'Category box border', hint: 'Category tiles' },
            { key: 'productCardBorder', label: 'Product card border', hint: 'Product cards' },
            { key: 'productImageBorder', label: 'Product image border', hint: 'Gallery images' },
            { key: 'sectionBorder', label: 'Section border', hint: 'Section dividers' },
            { key: 'inputBorder', label: 'Input border', hint: 'Form inputs' },
            { key: 'buttonBorder', label: 'Button border', hint: 'Outlined buttons' },
            { key: 'activeBorder', label: 'Active border', hint: 'Focused/active' },
            { key: 'hoverBorder', label: 'Hover border', hint: 'Hovered boxes' },
            { key: 'divider', label: 'Divider color', hint: 'HR / separators' }
        ]
    },
    {
        title: 'Button colors',
        fields: [
            { key: 'primaryButtonBg', label: 'Primary button background', hint: 'Primary CTA' },
            { key: 'primaryButtonText', label: 'Primary button text', hint: 'Primary CTA label' },
            { key: 'secondaryButtonBg', label: 'Secondary button background', hint: 'Secondary CTA' },
            { key: 'secondaryButtonText', label: 'Secondary button text', hint: 'Secondary CTA label' },
            { key: 'addToCartBg', label: 'Add to Cart background', hint: 'Cart button' },
            { key: 'addToCartText', label: 'Add to Cart text', hint: 'Cart button label' },
            { key: 'buyNowBg', label: 'Buy Now background', hint: 'Buy Now button' },
            { key: 'buyNowText', label: 'Buy Now text', hint: 'Buy Now label' },
            { key: 'checkoutButtonBg', label: 'Checkout button background', hint: 'Checkout CTA' },
            { key: 'checkoutButtonText', label: 'Checkout button text', hint: 'Checkout CTA label' },
            { key: 'buttonHoverBg', label: 'Hover background', hint: 'Button hover' },
            { key: 'buttonHoverText', label: 'Hover text', hint: 'Button hover label' },
            { key: 'buttonDisabledBg', label: 'Disabled background', hint: 'Disabled buttons' },
            { key: 'buttonDisabledText', label: 'Disabled text', hint: 'Disabled labels' }
        ]
    },
    {
        title: 'Navigation colors',
        fields: [
            { key: 'navText', label: 'Navigation text', hint: 'Nav labels' },
            { key: 'navHover', label: 'Navigation hover', hint: 'Hovered nav' },
            { key: 'activeCategory', label: 'Active category color', hint: 'Selected category' },
            { key: 'dropdownBg', label: 'Dropdown background', hint: 'Menu panels' },
            { key: 'dropdownText', label: 'Dropdown text', hint: 'Menu items' },
            { key: 'dropdownBorder', label: 'Dropdown border', hint: 'Menu borders' },
            { key: 'megaMenuBg', label: 'Mega menu background', hint: 'Mega panels' },
            { key: 'megaMenuHover', label: 'Mega menu hover', hint: 'Mega hover' },
            { key: 'bottomNavBg', label: 'Bottom navigation background', hint: 'Mobile nav' },
            { key: 'bottomNavIcon', label: 'Bottom navigation icons', hint: 'Mobile nav icons' }
        ]
    },
    {
        title: 'Product colors',
        fields: [
            { key: 'bestsellerBadge', label: 'Bestseller badge', hint: 'Best seller chip' },
            { key: 'trendingBadge', label: 'Trending badge', hint: 'Trending chip' },
            { key: 'discountBadge', label: 'Discount badge', hint: 'Sale chip' },
            { key: 'stockAvailable', label: 'Stock availability', hint: 'In-stock text' },
            { key: 'ratingStar', label: 'Rating stars', hint: 'Star icons' },
            { key: 'productCardBg', label: 'Product card background', hint: 'Card surface' },
            { key: 'wishlistIcon', label: 'Wishlist icon', hint: 'Heart icon' },
            { key: 'productPrice', label: 'Product price', hint: 'Card price' },
            { key: 'salePrice', label: 'Sale price', hint: 'Discounted price' }
        ]
    },
    {
        title: 'Social media colors',
        fields: [
            { key: 'socialFacebook', label: 'Facebook', hint: 'FB hover' },
            { key: 'socialYoutube', label: 'YouTube', hint: 'YT hover' },
            { key: 'socialTwitter', label: 'Twitter / X', hint: 'X hover' },
            { key: 'socialInstagram', label: 'Instagram', hint: 'IG hover' },
            { key: 'socialDefault', label: 'Default icon color', hint: 'Base icon' },
            { key: 'socialBg', label: 'Social icon background', hint: 'Icon bg' },
            { key: 'socialHoverBg', label: 'Social hover background', hint: 'Hover bg' }
        ]
    },
    {
        title: 'Special sections',
        fields: [
            { key: 'heroText', label: 'Hero banner text', hint: 'Hero copy' },
            { key: 'megaShoppingDaysBg', label: 'Mega Shopping Days button', hint: 'Promo button' },
            { key: 'megaShoppingDaysText', label: 'Mega Shopping Days text', hint: 'Promo button label' },
            { key: 'promoBadge', label: 'Promotional badges', hint: 'Promo chips' },
            { key: 'offersSection', label: 'Offers section', hint: 'Offers bg' },
            { key: 'categoryBox', label: 'Category boxes', hint: 'Category tiles' },
            { key: 'dealsSection', label: 'Deals section', hint: 'Deals bg' },
            { key: 'bestSellersSection', label: 'Best Sellers section', hint: 'Best sellers bg' },
            { key: 'trendingSection', label: 'Trending products section', hint: 'Trending bg' },
            { key: 'footerSection', label: 'Footer sections', hint: 'Footer bg' }
        ]
    }
];

export const COLOR_FIELDS = COLOR_GROUPS.flatMap((group) =>
    group.fields.map((field) => ({ ...field, group: group.title }))
);

export const RANGE_FIELDS = [
    { key: 'radius', label: 'Corner radius', min: 0, max: 40, step: 1, unit: 'px' },
    { key: 'headerHeight', label: 'Header height', min: 52, max: 120, step: 1, unit: 'px' },
    { key: 'containerWidth', label: 'Container width', min: 1560, max: 1800, step: 10, unit: 'px' },
    { key: 'sectionSpacing', label: 'Section spacing', min: 16, max: 72, step: 1, unit: 'px' },
    { key: 'animationSpeed', label: 'Animation speed', min: 0.4, max: 2, step: 0.05, unit: '×' },
    { key: 'animationIntensity', label: 'Animation intensity', min: 0, max: 1, step: 0.05, unit: '' },
    { key: 'shadow', label: 'Shadow strength', min: 0, max: 2, step: 0.05, unit: '×' },
    { key: 'categoryBorderWidth', label: 'Category border width', min: 0, max: 8, step: 1, unit: 'px' },
    { key: 'categoryRadius', label: 'Category radius', min: 0, max: 40, step: 1, unit: 'px' },
    { key: 'categoryPadding', label: 'Category padding', min: 4, max: 48, step: 1, unit: 'px' },
    { key: 'productCardBorderWidth', label: 'Product card border width', min: 0, max: 8, step: 1, unit: 'px' },
    { key: 'productCardRadius', label: 'Product card radius', min: 0, max: 40, step: 1, unit: 'px' },
    { key: 'productCardPadding', label: 'Product card padding', min: 8, max: 48, step: 1, unit: 'px' }
];

export const BUTTON_STYLE_OPTIONS = [
    { value: 'solid', label: 'Solid' },
    { value: 'gradient', label: 'Gradient' },
    { value: 'outline', label: 'Outline' },
    { value: 'pill', label: 'Pill' },
    { value: 'glow', label: 'Glow' }
];

export const CARD_STYLE_OPTIONS = [
    { value: 'flat', label: 'Flat' },
    { value: 'elevated', label: 'Elevated' },
    { value: 'outline', label: 'Outline' },
    { value: 'glass', label: 'Glass' },
    { value: 'soft', label: 'Soft' }
];

export const IMAGE_RATIO_OPTIONS = [
    { value: '1 / 1', label: 'Square (1:1)' },
    { value: '4 / 3', label: 'Classic (4:3)' },
    { value: '3 / 2', label: 'Landscape (3:2)' },
    { value: '16 / 10', label: 'Wide (16:10)' },
    { value: '3 / 4', label: 'Portrait (3:4)' }
];

/** Compact fallback that mirrors the default eMox-inspired palette. */
export const DEFAULT_TOKENS = {
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
    headingFont: "'Manrope Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    bodyFont: "'Manrope Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    accentFont: "'Manrope Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    radius: 16, cardRadius: 16, buttonRadius: 12,
    cardStyle: 'elevated', buttonStyle: 'solid',
    shadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
    shadowHover: '0 18px 40px rgba(37, 99, 235, 0.18)',
    containerWidth: 1600, headerHeight: 72, sectionSpacing: 40,
    imageRatio: '4 / 3', gridGap: 20,
    animationSpeed: 1, animationIntensity: 0.7,
    motion: 'smooth', density: 'comfortable',
    headingTransform: 'none', headingWeight: 800,
    // Extended theme tokens (defaults mirror the eMox premium palette)
    backgroundSecondary: '#f8fafc', cardBg: '#ffffff',
    sectionBg: '#f4f6fb', pageBg: '#f4f6fb', headerBg: '#ffffff',
    heading: '#0f172a', headingSecondary: '#334155', bodyText: '#0f172a',
    description: '#334155', link: '#2563eb', linkHover: '#1d4ed8',
    price: '#0f172a', discountPrice: '#dc2626', productTitle: '#0f172a',
    productDescription: '#334155',
    categoryBorder: '#e6ebf3', productCardBorder: '#e6ebf3',
    productImageBorder: '#e6ebf3', sectionBorder: '#e6ebf3', inputBorder: '#cfd8e6',
    buttonBorder: '#2563eb', activeBorder: '#2563eb', hoverBorder: '#1d4ed8',
    divider: '#e6ebf3',
    primaryButtonBg: '#2563eb', primaryButtonText: '#ffffff',
    secondaryButtonBg: '#f59e0b', secondaryButtonText: '#ffffff',
    addToCartBg: '#eaf1ff', addToCartText: '#2563eb',
    buyNowBg: '#2563eb', buyNowText: '#ffffff',
    checkoutButtonBg: '#2563eb', checkoutButtonText: '#ffffff',
    buttonHoverBg: '#1d4ed8', buttonHoverText: '#ffffff',
    buttonDisabledBg: '#cbd5e1', buttonDisabledText: '#64748b',
    navHover: '#2563eb', activeCategory: '#2563eb',
    dropdownBg: '#ffffff', dropdownText: '#0f172a', dropdownBorder: '#e6ebf3',
    megaMenuBg: '#ffffff', megaMenuHover: '#eaf1ff', bottomNavBg: '#ffffff',
    bottomNavIcon: '#0f172a',
    bestsellerBadge: '#f59e0b', trendingBadge: '#7c3aed', discountBadge: '#dc2626',
    stockAvailable: '#16a34a', ratingStar: '#f59e0b', productCardBg: '#ffffff',
    wishlistIcon: '#dc2626', productPrice: '#0f172a', salePrice: '#dc2626',
    socialFacebook: '#1877f2', socialYoutube: '#ff0000', socialTwitter: '#111111',
    socialInstagram: '#e1306c', socialDefault: '#64748b', socialBg: '#f1f5f9',
    socialHoverBg: '#e2e8f0',
    heroText: '#0f172a', megaShoppingDaysBg: '#2563eb',
    megaShoppingDaysText: '#ffffff', promoBadge: '#dc2626', offersSection: '#fff4e0',
    categoryBox: '#ffffff', dealsSection: '#f8fafc', bestSellersSection: '#ffffff',
    trendingSection: '#ffffff', footerSection: '#0b1220',
    categoryBorderWidth: 1, categoryRadius: 14, categoryPadding: 16, categoryBorderStyle: 'solid',
    productCardBorderWidth: 1, productCardRadius: 14, productCardPadding: 16, productCardBorderStyle: 'solid'
};

/* ------------------------------------------------------------------ */
/* Colour helpers (mirror backend/utils/designs.js)                    */
/* ------------------------------------------------------------------ */

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function expandHex(hex) {
    const value = String(hex || '').trim();
    if (!/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)) return null;
    if (value.length === 4) return '#' + value.slice(1).split('').map((c) => c + c).join('');
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

export function hexToRgba(hex, alpha = 1) {
    const rgb = hexToRgb(hex);
    if (!rgb) return `rgba(37, 99, 235, ${alpha})`;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/** Relative luminance (WCAG) of a hex colour, 0 (black) – 1 (white). */
function relativeLuminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 1;
    const channel = (value) => {
        const c = value / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/**
 * Pick a readable foreground for a background colour. Light backgrounds get
 * dark text and dark backgrounds get white text, so themed buttons never end
 * up with white-on-yellow (or black-on-navy) invisible labels.
 */
export function readableOn(background, dark = '#0b1220', light = '#ffffff') {
    const hex = asHex(background, '#ffffff');
    return relativeLuminance(hex) > 0.45 ? dark : light;
}

/** Convert a gradient/rgba token into a value usable by <input type="color">. */
export function asHex(value, fallback = '#2563eb') {
    if (typeof value === 'string') {
        if (/^#[0-9a-fA-F]{6}$/.test(value.trim())) return value.trim();
        const hexMatch = value.match(/#[0-9a-fA-F]{6}/);
        if (hexMatch) return hexMatch[0];
        const rgbMatch = value.match(/rgba?\(\s*(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)/);
        if (rgbMatch) {
            return rgbToHex({
                r: Number(rgbMatch[1]),
                g: Number(rgbMatch[2]),
                b: Number(rgbMatch[3])
            });
        }
    }
    return fallback;
}

/* ------------------------------------------------------------------ */
/* Token resolution                                                    */
/* ------------------------------------------------------------------ */

/** Merge administrator overrides into a design's base tokens. */
export function resolveTokens(baseTokens, customization) {
    const baseDesignTokens = baseTokens && typeof baseTokens === 'object' ? baseTokens : {};
    const custom = customization && typeof customization === 'object' ? customization : {};
    const base = Object.assign({}, DEFAULT_TOKENS, baseDesignTokens);

    // Only keep the extra colour slots the design (or the admin) actually
    // provided. Dropping the hard-coded eMox defaults lets tokensToVars derive
    // missing slots from the design's own palette instead of leaking blue
    // buttons/sections into every other theme.
    const providedColorKeys = new Set([
        ...Object.keys(baseDesignTokens),
        ...Object.keys(custom)
    ]);
    COLOR_FIELDS.forEach((field) => {
        if (!providedColorKeys.has(field.key)) delete base[field.key];
    });

    const tokens = Object.assign({}, base);

    COLOR_FIELDS.map((field) => field.key).concat([
        'headingFont', 'bodyFont', 'accentFont',
        'buttonStyle', 'cardStyle', 'imageRatio',
        'categoryBorderStyle', 'productCardBorderStyle'
    ]).forEach((key) => {
        if (typeof custom[key] === 'string' && custom[key].trim()) {
            tokens[key] = custom[key];
        }
    });

    ['radius', 'headerHeight', 'containerWidth', 'sectionSpacing',
        'animationSpeed', 'animationIntensity', 'shadow',
        'categoryBorderWidth', 'categoryRadius', 'categoryPadding',
        'productCardBorderWidth', 'productCardRadius', 'productCardPadding'].forEach((key) => {
        const value = Number(custom[key]);
        if (Number.isFinite(value)) tokens[key] = value;
    });

    if (custom.primary) {
        tokens.primaryDark = shade(custom.primary, 0.18);
        tokens.primarySoft = tint(custom.primary, 0.88);
    }
    if (custom.secondary) {
        tokens.secondaryDark = shade(custom.secondary, 0.16);
        tokens.secondarySoft = tint(custom.secondary, 0.86);
    }
    if (custom.accent) {
        tokens.accentSoft = tint(custom.accent, 0.86);
    }

    if (custom.radius !== undefined) {
        tokens.radius = custom.radius;
        tokens.cardRadius = custom.radius;
        if (base.buttonRadius < 900) tokens.buttonRadius = Math.min(custom.radius, 18);
    }
    if (custom.buttonStyle === 'pill') tokens.buttonRadius = 999;
    if (custom.buttonStyle === 'solid' && base.buttonRadius >= 900) tokens.buttonRadius = 12;

    if (custom.shadow !== undefined) {
        const level = custom.shadow;
        tokens.shadow = level === 0
            ? 'none'
            : `0 ${Math.round(6 + level * 6)}px ${Math.round(18 + level * 14)}px rgba(15, 23, 42, ${0.06 + level * 0.06})`;
        tokens.shadowHover = level === 0
            ? 'none'
            : `0 ${Math.round(14 + level * 8)}px ${Math.round(34 + level * 16)}px rgba(15, 23, 42, ${0.1 + level * 0.08})`;
    }

    return tokens;
}

/** Map a token set to the CSS custom properties used across the app. */
export function tokensToVars(tokens) {
    const rawTokens = tokens && typeof tokens === 'object' ? tokens : {};
    const t = Object.assign({}, DEFAULT_TOKENS, rawTokens);
    const radius = Number(t.radius) || 0;
    const speed = Number(t.animationSpeed) || 1;
    const intensity = Number.isFinite(Number(t.animationIntensity)) ? Number(t.animationIntensity) : 0.7;
    //Never let the shell collapse into a narrow column on large screens.
    const containerWidth = clamp(Number(t.containerWidth) || 1600, 1560, 1800);
    //Readable foregrounds derived from the actual background luminance.
    const onPrimary = readableOn(t.primary);
    const onSecondary = readableOn(t.secondary);
    const onAccent = readableOn(t.accent);
    //Secondary copy that still clears contrast on both light and dark themes.
    const mutedStrong = mix(t.muted, t.text, 0.38);

    /**
     * Derive the "extended" colour slots from the design's core palette when
     * the design did not define them. This is what keeps preview and live in
     * sync: a cream editorial theme must not inherit eMox's blue buttons or
     * light-blue section boxes just because those slots are missing.
     */
    const derivedColor = (key) => {
        switch (key) {
            case 'backgroundSecondary': return t.surfaceAlt || t.background;
            case 'cardBg': return t.surface;
            case 'sectionBg': return t.background;
            case 'pageBg': return t.background;
            case 'headerBg': return t.navBg || t.surface;
            case 'heading': return t.text;
            case 'headingSecondary': return t.textSoft;
            case 'bodyText': return t.text;
            case 'description': return t.textSoft;
            case 'link': return t.primary;
            case 'linkHover': return t.primaryDark;
            case 'price': return t.text;
            case 'discountPrice': return t.danger;
            case 'productTitle': return t.text;
            case 'productDescription': return t.textSoft;
            case 'categoryBorder': return t.border;
            case 'productCardBorder': return t.border;
            case 'productImageBorder': return t.border;
            case 'sectionBorder': return t.border;
            case 'inputBorder': return t.borderStrong;
            case 'buttonBorder': return t.primary;
            case 'activeBorder': return t.primary;
            case 'hoverBorder': return t.primaryDark;
            case 'divider': return t.border;
            case 'primaryButtonBg': return t.primary;
            case 'primaryButtonText': return onPrimary;
            case 'secondaryButtonBg': return t.secondary;
            case 'secondaryButtonText': return onSecondary;
            case 'addToCartBg': return t.primarySoft;
            case 'addToCartText': return t.primary;
            case 'buyNowBg': return t.primary;
            case 'buyNowText': return onPrimary;
            case 'checkoutButtonBg': return t.primary;
            case 'checkoutButtonText': return onPrimary;
            case 'buttonHoverBg': return t.primaryDark;
            case 'buttonHoverText': return onPrimary;
            case 'buttonDisabledBg': return t.border;
            case 'buttonDisabledText': return t.muted;
            case 'navHover': return t.primary;
            case 'activeCategory': return t.primary;
            case 'dropdownBg': return t.surface;
            case 'dropdownText': return t.text;
            case 'dropdownBorder': return t.border;
            case 'megaMenuBg': return t.surface;
            case 'megaMenuHover': return t.primarySoft;
            case 'bottomNavBg': return t.surface;
            case 'bottomNavIcon': return t.text;
            case 'bestsellerBadge': return t.secondary;
            case 'trendingBadge': return t.accent;
            case 'discountBadge': return t.danger;
            case 'stockAvailable': return t.success;
            case 'ratingStar': return t.secondary;
            case 'productCardBg': return t.surface;
            case 'wishlistIcon': return t.danger;
            case 'productPrice': return t.text;
            case 'salePrice': return t.danger;
            // The hero copy sits on --hero-gradient. Derive its foreground from
            // that gradient (asHex picks the first stop) so a cream editorial
            // hero gets dark text while a dark gradient keeps white text.
            case 'heroText': return readableOn(t.heroGradient, t.text, '#ffffff');
            case 'megaShoppingDaysBg': return t.primary;
            case 'megaShoppingDaysText': return onPrimary;
            case 'promoBadge': return t.danger;
            case 'offersSection': return t.secondarySoft;
            case 'categoryBox': return t.surface;
            case 'dealsSection': return t.surfaceAlt;
            case 'bestSellersSection': return t.surface;
            case 'trendingSection': return t.surface;
            case 'footerSection': return t.footerBg;
            default: return DEFAULT_TOKENS[key];
        }
    };

    const vars = {
        '--primary': t.primary,
        '--primary-dark': t.primaryDark,
        '--primary-soft': t.primarySoft,
        '--secondary': t.secondary,
        '--secondary-dark': t.secondaryDark,
        '--secondary-soft': t.secondarySoft,
        '--accent': t.accent,
        '--accent-soft': t.accentSoft,
        '--background': t.background,
        '--surface': t.surface,
        '--surface-alt': t.surfaceAlt,
        '--text': t.text,
        '--text-soft': t.textSoft,
        '--muted-text': t.muted,
        '--muted-strong': mutedStrong,
        '--border': t.border,
        '--border-strong': t.borderStrong,
        '--success': t.success,
        '--danger': t.danger,
        '--warning': t.warning,
        //Text colours that are guaranteed readable on the themed buttons.
        '--on-primary': onPrimary,
        '--on-secondary': onSecondary,
        '--on-accent': onAccent,

        // Legacy aliases used throughout the existing App.css
        '--vc-blue': t.primary,
        '--vc-blue-dark': t.primaryDark,
        '--vc-blue-soft': t.primarySoft,
        '--vc-orange': t.primary,
        '--vc-orange-dark': t.primaryDark,
        '--vc-orange-soft': t.primarySoft,
        '--vc-yellow': t.secondary,
        '--vc-yellow-dark': t.secondaryDark,
        '--vc-gold': t.secondary,
        '--vc-gold-soft': t.secondarySoft,
        '--gold': t.primary,
        '--gold-dark': t.primaryDark,
        '--gold-glow': hexToRgba(t.primary, 0.28),

        '--nav-bg': t.navBg,
        '--nav-text': t.navText,
        '--nav-border': t.navBorder,
        '--footer-bg': t.footerBg,
        '--footer-text': t.footerText,
        '--footer-link': t.footerLink,
        '--announcement-bg': t.announcementBg,
        '--announcement-text': t.announcementText,
        '--hero-gradient': t.heroGradient,
        '--promo-gradient': t.promoGradient,
        // Foreground for the promo/banner gradient. Derived from the gradient
        // itself so dark editorial promos stay white while light minimal promos
        // stay dark; the hero text colour must not leak into this component.
        '--promo-text': readableOn(t.promoGradient, t.text, '#ffffff'),

        '--font-heading': t.headingFont,
        '--font-body': t.bodyFont,
        '--font-accent': t.accentFont,

        '--vc-radius': `${radius}px`,
        '--vc-card-radius': `${Number(t.cardRadius) || 0}px`,
        '--vc-btn-radius': `${Number(t.buttonRadius) || 0}px`,
        '--radius-xs': `${Math.round(radius * 0.35)}px`,
        '--radius-sm': `${Math.round(radius * 0.6)}px`,
        '--radius-md': `${radius}px`,
        '--radius-lg': `${Math.round(radius * 1.25)}px`,
        '--radius-xl': `${Math.round(radius * 1.5)}px`,

        '--vc-shadow': t.shadow,
        '--vc-shadow-hover': t.shadowHover,
        '--shadow-sm': t.shadow,
        '--shadow-md': t.shadowHover,
        '--shadow-lg': t.shadowHover,
        '--shadow-primary': t.shadowHover,
        '--shadow-orange': t.shadowHover,

        '--vc-container': `${containerWidth}px`,
        '--vc-header-h': `${Number(t.headerHeight) || 72}px`,
        '--vc-section-space': `${Number(t.sectionSpacing) || 40}px`,
        '--vc-grid-gap': `${Number(t.gridGap) || 20}px`,
        '--vc-img-ratio': t.imageRatio || '4 / 3',
        '--vc-anim': speed,
        '--vc-motion': intensity,
        '--vc-card-style': t.cardStyle,
        '--vc-btn-style': t.buttonStyle,
        '--vc-heading-transform': t.headingTransform || 'none',
        '--vc-heading-weight': String(t.headingWeight || 700),
        '--vc-motion-distance': `${Math.round(12 + intensity * 22)}px`,
        '--vc-motion-duration': `${Math.round(520 / speed)}ms`,
        '--category-border-width': `${Number(t.categoryBorderWidth ?? 1)}px`,
        '--category-border-style': t.categoryBorderStyle || 'solid',
        '--category-radius': `${Number(t.categoryRadius ?? radius)}px`,
        '--category-padding': `${Number(t.categoryPadding ?? 16)}px`,
        '--product-card-border-width': `${Number(t.productCardBorderWidth ?? 1)}px`,
        '--product-card-border-style': t.productCardBorderStyle || 'solid',
        '--product-card-radius': `${Number(t.productCardRadius ?? radius)}px`,
        '--product-card-padding': `${Number(t.productCardPadding ?? 16)}px`
    };

    // Emit CSS custom properties for every colour token so the live site and
    // the admin preview consume the exact same values. Keys that already have
    // a hand-written mapping above are skipped to keep their special names.
    const handled = new Set(Object.keys(vars));
    const camelToKebab = (key) => key.replace(/([A-Z])/g, '-$1').toLowerCase();
    COLOR_FIELDS.forEach((field) => {
        const varName = `--${camelToKebab(field.key)}`;
        if (handled.has(varName)) return;
        const provided = rawTokens[field.key];
        const value = (provided !== undefined && provided !== null && provided !== '')
            ? provided
            : derivedColor(field.key);
        if (value !== undefined && value !== null && value !== '') {
            vars[varName] = value;
        }
    });

    return vars;
}

/** Apply a design to any element (documentElement for live, preview root for previews). */
export function applyDesignToElement(element, designId, tokens) {
    if (!element) return;
    element.setAttribute('data-design', designId || DEFAULT_DESIGN_ID);
    if (tokens && tokens.density) element.setAttribute('data-density', tokens.density);
    // CSS cannot branch on a custom property's value, so mirror the two style
    // controls into attributes. Both the live <html> element and the studio
    // preview root emit them, which keeps button/card personalities identical.
    const source = tokens && typeof tokens === 'object' ? tokens : DEFAULT_TOKENS;
    element.setAttribute('data-btn-style', source.buttonStyle || DEFAULT_TOKENS.buttonStyle);
    element.setAttribute('data-card-style', source.cardStyle || DEFAULT_TOKENS.cardStyle);
    const vars = tokensToVars(tokens);
    Object.keys(vars).forEach((key) => {
        const value = vars[key];
        if (value !== undefined && value !== null) {
            element.style.setProperty(key, String(value));
        }
    });
}

/* ------------------------------------------------------------------ */
/* First-paint cache                                                   */
/* ------------------------------------------------------------------ */

export function cacheDesign(designId, tokens) {
    try {
        const resolvedDesignId = designId || DEFAULT_DESIGN_ID;
        const resolvedTokens = tokens || DEFAULT_TOKENS;
        const vars = tokensToVars(resolvedTokens);
        window.localStorage.setItem(CACHE_KEY, JSON.stringify({
            designId: resolvedDesignId,
            tokens: resolvedTokens,
            vars
        }));
    } catch (error) {
        /* storage can be unavailable in private mode — the live settings
           response still applies the design a moment later. */
    }
}

export function readCachedDesign() {
    try {
        const raw = window.localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.designId || !parsed.tokens) return null;
        return parsed;
    } catch (error) {
        return null;
    }
}

/**
 * Called from index.js before React mounts. Only a real cached design is
 * allowed to paint — falling back to DEFAULT_TOKENS here was what produced the
 * eMox-blue flash on a fashion-editorial store.
 */
export function applyCachedDesign() {
    const cached = readCachedDesign();
    if (!cached) return false;
    // Use the same application path as the live theme so the cached first frame
    // also gets data-btn-style/data-card-style (CSS cannot read the custom
    // properties when matching button/card personalities).
    applyDesignToElement(document.documentElement, cached.designId, cached.tokens);
    return true;
}

/** Show/hide the neutral first-paint cover used when no cache is available. */
export function setThemePending(pending) {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle(THEME_PENDING_CLASS, !!pending);
}

/** Small helper used by studio swatches and cards. */
export function designSwatches(tokens) {
    const t = Object.assign({}, DEFAULT_TOKENS, tokens || {});
    return [t.primary, t.secondary, t.accent, t.background, t.text]
        .filter(Boolean)
        .slice(0, 5);
}
