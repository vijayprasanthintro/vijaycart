const products = require('../data/products.json');
const Product = require('../models/productModel');
const dotenv = require('dotenv');
const connectDatabase = require('../config/database')

dotenv.config({path:'backend/config/config.env'});
connectDatabase();

const REQUIRED_FIELDS = [
    'name',
    'brand',
    'category',
    'description',
    'specifications',
    'features',
    'highlights',
    'warranty',
    'images',
    'stock',
    'price',
    'mrp',
    'discount',
    'ratings',
    'numOfReviews',
    'reviews',
    'seller'
];

const validateCatalog = () => {
    const problems = [];
    products.forEach((p, i) => {
        const label = `#${i + 1} ${p.name || '(no name)'}`;
        if (!p || typeof p !== 'object') {
            problems.push(`${label}: not an object`);
            return;
        }
        REQUIRED_FIELDS.forEach((f) => {
            const v = p[f];
            if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
                problems.push(`${label}: missing required field "${f}"`);
            }
        });
        if (!Array.isArray(p.images) || !p.images.length) problems.push(`${label}: images must be a non-empty array`);
        if (typeof p.price !== 'number' || p.price <= 0) problems.push(`${label}: price must be a positive number`);
        if (typeof p.discount !== 'number' || p.discount < 0 || p.discount > 95) problems.push(`${label}: discount must be 0-95`);
        if (typeof p.stock !== 'number' || p.stock < 0) problems.push(`${label}: stock must be a non-negative number`);
        if (typeof p.ratings !== 'number' || p.ratings < 0 || p.ratings > 5) problems.push(`${label}: ratings must be 0-5`);
    });
    return problems;
};

const seedProducts = async ()=>{
    try{
        const problems = validateCatalog();
        if (problems.length) {
            console.error(`Catalog validation failed (${problems.length} issues):`);
            problems.forEach(p => console.error('  - ' + p));
            process.exit(1);
        }

        await Product.deleteMany();
        console.log('Products deleted!')
        await Product.insertMany(products);
        console.log(`All ${products.length} products added!`);

        const byCategory = {};
        products.forEach(p => { byCategory[p.category] = (byCategory[p.category] || 0) + 1; });
        console.table(byCategory);
    }catch(error){
        console.error(error.message);
        process.exit(1);
    }
    process.exit();
}

seedProducts();
