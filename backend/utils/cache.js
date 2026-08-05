// Minimal in-memory TTL cache to avoid hammering MongoDB with identical read
// queries (product detail + product listing are the hottest endpoints).
const store = new Map();

const DEFAULT_TTL = 60 * 1000;   // 60s
const MAX_ENTRIES = 500;

function get(key) {
    const hit = store.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expires) {
        store.delete(key);
        return null;
    }
    return hit.value;
}

function set(key, value, ttl = DEFAULT_TTL) {
    if (store.size >= MAX_ENTRIES) {
        const oldest = store.keys().next().value;
        if (oldest !== undefined) store.delete(oldest);
    }
    store.set(key, { value, expires: Date.now() + ttl });
}

function del(key) {
    store.delete(key);
}

// Remove every key matching a prefix (e.g. "product:" or "products:").
function delPrefix(prefix) {
    for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key);
    }
}

function flush() {
    store.clear();
}

module.exports = { get, set, del, delPrefix, flush };
