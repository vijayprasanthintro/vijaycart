/**
 * Shared storefront copy + category navigation data.
 *
 * Both the live storefront and the Design Studio preview read from this file so
 * the announcement/hero/category content cannot drift between the two.
 */

export const DEFAULT_DESIGN_COPY_ID = 'fashion-editorial';

export const STOREFRONT_CATEGORIES = [
    {
        label: 'Electronics',
        icon: 'fa-plug',
        cls: 'cat-icon-electronics',
        to: '/search/all?category=Electronics',
        category: 'Electronics'
    },
    {
        label: 'Fashion',
        icon: 'fa-tags',
        cls: 'cat-icon-fashion',
        to: '/search/all?category=Clothes%2FShoes',
        category: 'Clothes/Shoes'
    },
    {
        label: 'Mobiles',
        icon: 'fa-mobile',
        cls: 'cat-icon-mobile',
        to: '/search/all?category=Smartphones',
        category: 'Smartphones'
    },
    {
        label: 'Home',
        icon: 'fa-home',
        cls: 'cat-icon-home',
        to: '/search/all?category=Home',
        category: 'Home'
    },
    {
        label: 'Beauty',
        icon: 'fa-heartbeat',
        cls: 'cat-icon-beauty',
        to: '/search/all?category=Beauty%2FHealth',
        category: 'Beauty/Health'
    },
    {
        label: 'Grocery',
        icon: 'fa-shopping-basket',
        cls: 'cat-icon-grocery',
        to: '/search/all?category=Food',
        category: 'Food'
    },
    {
        label: 'Sports',
        icon: 'fa-futbol-o',
        cls: 'cat-icon-sports',
        to: '/search/all?category=Sports',
        category: 'Sports'
    },
    {
        label: 'Audio',
        icon: 'fa-headphones',
        cls: 'cat-icon-audio',
        to: '/search/all?category=Audio',
        category: 'Audio'
    }
];

export const HERO_COPY = {
    'emox-premium': {
        category: 'Marketplace',
        title: 'Up to 70% off top brands',
        description: 'A bright, editorial marketplace layout with a professional navigation bar, large promotional hero, popular category circles and dense horizontal product cards.'
    },
    'luxury-black-gold': {
        category: 'Luxury',
        title: 'The Gold Standard of Shopping',
        description: 'A dramatic black canvas with champagne-gold detailing, elegant serif headlines, outlined product cards and slow, cinematic transitions.'
    },
    'modern-minimalist': {
        category: 'Minimal',
        title: 'Considered things, beautifully made',
        description: 'Warm off-white surfaces, hairline borders, generous whitespace and restrained type. Products breathe and navigation stays out of the way.'
    },
    'premium-gradient': {
        category: 'Gradient',
        title: 'Colour your everyday',
        description: 'A violet-to-pink gradient world with frosted glass cards, floating product tiles, animated buttons and a soft aurora background.'
    },
    'flipkart-shopping': {
        category: 'Marketplace',
        title: 'Big Savings. Every Single Day.',
        description: 'A blue-and-yellow shopping workhorse: dense category bar, promotional hero, compact product grids and fast, snappy interactions built for conversion.'
    },
    'apple-premium': {
        category: 'Premium',
        title: 'The best way to buy the best.',
        description: 'Huge whitespace, translucent navigation, oversized typography and a calm monochrome palette that lets product photography lead.'
    },
    'futuristic-tech': {
        category: 'Technology',
        title: 'The future, delivered today',
        description: 'A deep-space navy interface with cyan and magenta neon, glowing card borders, animated grid lines and monospace technical accents.'
    },
    'fashion-editorial': {
        category: 'Fashion',
        title: 'The New Season Edit',
        description: 'A warm cream editorial canvas, oversized serif headlines, tall image-led product cards, gold rules and a runway-inspired hover treatment.'
    },
    'colorful-marketplace': {
        category: 'Colorful',
        title: 'Shopping, but make it joyful',
        description: 'A rose, amber and cyan festival of colour with rounded cards, playful badges, gradient buttons and energetic hover motion.'
    },
    'ultra-glass': {
        category: 'Glass',
        title: 'Clarity in every purchase',
        description: 'A deep teal night with frosted glass navigation, translucent cards, soft aurora gradients, floating elements and refined micro-interactions.'
    }
};

export function getHeroCopy(design) {
    const id = (design && (design.id || design.designId)) || DEFAULT_DESIGN_COPY_ID;
    const copy = HERO_COPY[id] || HERO_COPY[DEFAULT_DESIGN_COPY_ID];
    return {
        designId: id,
        category: (design && design.category) || copy.category,
        title: copy.title,
        description: (design && design.description) || copy.description
    };
}

export function getDefaultAnnouncement() {
    return 'Free delivery on orders above ₹499 · New season drops are live';
}
