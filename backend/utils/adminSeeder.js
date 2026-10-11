const path = require('path');
const fs = require('fs');
const User = require('../models/userModel');
const connectDatabase = require('../config/database');

// Load the local .env when it exists (works from both the repo root and the
// backend folder). On Railway the real environment variables are injected, so
// a missing file is fine there.
const envCandidates = [
    path.join(process.cwd(), 'backend', 'config', 'config.env'),
    path.join(__dirname, '..', 'config', 'config.env')
];
const envFile = envCandidates.find(f => fs.existsSync(f));
if (envFile) require('dotenv').config({ path: envFile });

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@vijaycart.com').toLowerCase().trim();
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'vijayadmin').toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'vijay@2006';
const ADMIN_NAME = (process.env.ADMIN_NAME || 'VijayCart Admin').trim();
const ADMIN_MOBILE = String(process.env.ADMIN_MOBILE || '9999900000').trim();

connectDatabase();

const seedAdmin = async () => {
    const identity = { $or: [{ email: ADMIN_EMAIL }, { username: ADMIN_USERNAME }] };
    let admin = await User.findOne(identity);
    if (!admin) {
        admin = new User({ email: ADMIN_EMAIL });
    }
    admin.name = ADMIN_NAME;
    if (ADMIN_MOBILE) admin.mobile = ADMIN_MOBILE;
    admin.username = ADMIN_USERNAME;
    admin.role = 'admin';
    admin.password = ADMIN_PASSWORD;
    try {
        await admin.save();
        console.log(`Admin ready (username: ${ADMIN_USERNAME}, email: ${ADMIN_EMAIL})`);
    } catch (error) {
        if (error && error.code === 11000) {
            const existing = await User.findOne(identity);
            if (existing && String(existing.id) !== String(admin.id)) {
                existing.name = ADMIN_NAME;
                if (ADMIN_MOBILE) existing.mobile = ADMIN_MOBILE;
                existing.username = ADMIN_USERNAME;
                existing.role = 'admin';
                existing.password = ADMIN_PASSWORD;
                await existing.save();
                console.log(`Admin updated (username: ${ADMIN_USERNAME}, email: ${ADMIN_EMAIL})`);
                return;
            }
        }
        throw error;
    }
};

seedAdmin()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Admin seeding failed:', err.message);
        process.exit(1);
    });