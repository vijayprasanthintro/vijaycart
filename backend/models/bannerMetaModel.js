const mongoose = require('mongoose');

//Tracks whether the built-in homepage banners have ever been seeded. Without a
//persistent flag, ensureSeed() re-inserts the defaults whenever the banner
//collection empties, silently undoing an admin's deliberate "delete all".
const bannerMetaSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    done: { type: Boolean, default: false }
});

module.exports = mongoose.model('BannerMeta', bannerMetaSchema);
