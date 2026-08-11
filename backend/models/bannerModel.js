const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please enter banner title'],
        trim: true,
        maxLength: [60, 'Banner title cannot exceed 60 characters']
    },
    subtitle: {
        type: String,
        trim: true,
        maxLength: [160, 'Banner subtitle cannot exceed 160 characters'],
        default: ''
    },
    kicker: {
        type: String,
        trim: true,
        maxLength: [40, 'Banner kicker cannot exceed 40 characters'],
        default: ''
    },
    cta: {
        type: String,
        trim: true,
        maxLength: [24, 'Banner CTA label cannot exceed 24 characters'],
        default: 'Shop Now'
    },
    linkTo: {
        type: String,
        trim: true,
        default: '/search/all'
    },
    image: {
        type: String,
        default: ''
    },
    accent: {
        type: String,
        default: '#ff6b35'
    },
    gradient: {
        type: String,
        default: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)'
    },
    active: {
        type: Boolean,
        default: true
    },
    position: {
        type: String,
        default: 'home'
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

bannerSchema.index({ position: 1, active: 1, sortOrder: 1 });

// Built-in homepage banners. These mirror the storefront defaults so the admin
// Banner page always starts with a real, matching set (Stage 1 banners).
bannerSchema.statics.DEFAULT_BANNERS = [
    {
        title: 'Up to 70% Off',
        subtitle: 'Top brands, biggest discounts',
        kicker: 'Mega Sale',
        cta: 'Shop Now',
        linkTo: '/search/all',
        image: '/images/products/smartphone-1.jpg',
        accent: '#ff6b35',
        gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
        sortOrder: 0
    },
    {
        title: 'Gadgets Galore',
        subtitle: 'Laptops, phones, tablets & accessories',
        kicker: 'Electronics Fest',
        cta: 'Explore Deals',
        linkTo: '/search/all?category=Electronics',
        image: '/images/products/smart-tv-1.jpg',
        accent: '#00b4d8',
        gradient: 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 40%, #415a77 100%)',
        sortOrder: 1
    },
    {
        title: 'New Arrivals',
        subtitle: 'Fresh styles for every occasion',
        kicker: 'Fashion Week',
        cta: 'View Collection',
        linkTo: '/search/all?category=Clothes/Shoes',
        image: '/images/products/women-dress-1.jpg',
        accent: '#ff3f6c',
        gradient: 'linear-gradient(135deg, #2d1b69 0%, #4a1942 40%, #6b2fa0 100%)',
        sortOrder: 2
    },
    {
        title: 'Smart Home',
        subtitle: 'Upgrade your space, elevate your life',
        kicker: 'Home Living',
        cta: 'Shop Home',
        linkTo: '/search/all?category=Home',
        image: '/images/products/sofa-1.jpg',
        accent: '#95d5b2',
        gradient: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 40%, #40916c 100%)',
        sortOrder: 3
    },
    {
        title: 'Audio Uprising',
        subtitle: 'Headphones, earbuds & speakers',
        kicker: 'Sound Fest',
        cta: 'Listen Now',
        linkTo: '/search/all?category=Headphones',
        image: '/images/products/headphones-1.jpg',
        accent: '#f59e0b',
        gradient: 'linear-gradient(135deg, #4a1942 0%, #6b2fa0 40%, #2d1b69 100%)',
        sortOrder: 4
    }
];

let model = mongoose.model('Banner', bannerSchema);

module.exports = model;
