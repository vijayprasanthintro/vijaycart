const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const dotenv = require('dotenv');
const connectDatabase = require('../config/database')

dotenv.config({ path: 'backend/config/config.env' });
connectDatabase();

// One-off data repair for issues found during the production audit:
//   1. Reset seeded admin/delivery-boy passwords via save() so the
//      pre('save') hook re-hashes them (they were stored as plaintext because
//      the old seeders used updateOne + upsert, which bypass the hook).
//   2. Audit remaining users for non-bcrypt passwords.
//   3. Remove duplicate products (same name) keeping the oldest record.
//   4. Drop the duplicate 'Mobile Phones' category (canonical: 'Smartphones').

const isBcrypt = (p) => String(p || '').startsWith('$2');

(async () => {
    try {
        // ---------- 1) Fix seeded accounts ----------
        for (const email of ['admin@vijaycart.com', 'deliveryboy@vijaycart.com']) {
            const u = await User.findOne({ email }).select('+password');
            if (u) {
                const wasPlain = !isBcrypt(u.password);
                u.password = '123456';
                await u.save();
                console.log(`Reset password for ${email} (was plaintext: ${wasPlain})`);
            } else {
                console.log(`WARN ${email} not found - run the admin/delivery seeder first`);
            }
        }

        // ---------- 2) Audit other users ----------
        const users = await User.find().select('+password');
        for (const u of users) {
            if (!isBcrypt(u.password)) {
                console.log(`WARN ${u.email} has a non-bcrypt password - reset manually`);
            }
        }

        // ---------- 3) Dedupe products by name ----------
        const all = await Product.find().sort({ createdAt: 1 });
        const byName = {};
        for (const p of all) {
            const key = String(p.name).trim().toLowerCase();
            if (!byName[key]) byName[key] = [];
            byName[key].push(p._id);
        }
        let removed = 0;
        for (const key of Object.keys(byName)) {
            if (byName[key].length > 1) {
                const [, ...dupes] = byName[key];
                const res = await Product.deleteMany({ _id: { $in: dupes } });
                removed += res.deletedCount || 0;
            }
        }
        console.log(`Removed ${removed} duplicate products (${await Product.countDocuments()} remaining)`);

        // ---------- 4) Drop duplicate 'Mobile Phones' category ----------
        const dupCat = await Category.findOne({ name: 'Mobile Phones' });
        if (dupCat) {
            const canonical = await Category.findOne({ name: 'Smartphones' });
            if (canonical) {
                await dupCat.deleteOne();
                console.log('Removed duplicate "Mobile Phones" category (canonical: "Smartphones")');
            } else {
                await dupCat.updateOne({ name: 'Smartphones' });
                console.log('Renamed "Mobile Phones" category to "Smartphones"');
            }
        } else {
            console.log('No "Mobile Phones" category to clean');
        }

        console.log('Repair complete.');
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
    process.exit();
})();
