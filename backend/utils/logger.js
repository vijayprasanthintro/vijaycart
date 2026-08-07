// Minimal structured JSON logger (no external deps).
// Every line is a single JSON object so logs are easy to ship to log
// aggregators (Splunk/Datadog/Loki) and to correlate in production.
//
//   - `info`    : normal operational events (requests, jobs)
//   - `warn`    : recoverable issues (migration warnings, slow queries)
//   - `error`   : failures that still let the server keep running
//   - `fatal`   : crash-level errors (used before process.exit in server.js)

const LEVELS = { fatal: 0, error: 1, warn: 2, info: 3, debug: 4 };

const CONFIG = {
    level: (process.env.LOG_LEVEL || 'info').toLowerCase(),
    pretty: process.env.NODE_ENV !== 'production' && process.env.LOG_PRETTY !== 'false'
};

// Serialize extra metadata defensively so a bad value can never crash the
// logger (and take down the request handler with it).
function safeSerialize(value) {
    if (value instanceof Error) {
        return {
            message: value.message,
            stack: value.stack,
            ...(value.name ? { name: value.name } : {}),
            ...(value.statusCode ? { statusCode: value.statusCode } : {}),
            ...(value.code ? { code: value.code } : {})
        };
    }
    try {
        const seen = new WeakSet();
        return JSON.parse(JSON.stringify(value, (_key, v) => {
            if (typeof v === 'bigint') return String(v);
            if (typeof v === 'function') return undefined;
            if (v && typeof v === 'object') {
                if (seen.has(v)) return '[circular]';
                seen.add(v);
            }
            return v;
        }));
    } catch (e) {
        return { unstringifiable: true, message: String(value) };
    }
}

function write(level, message, meta) {
    if (LEVELS[level] === undefined) level = 'info';
    if (LEVELS[level] > LEVELS[CONFIG.level]) return;

    const record = {
        ts: new Date().toISOString(),
        level,
        message,
        ...(meta ? safeSerialize(meta) : {})
    };

    if (CONFIG.pretty) {
        const line = `[${record.ts}] ${level.toUpperCase()} ${message}`;
        if (level === 'error' || level === 'fatal') {
            console.error(line, meta ? JSON.stringify(safeSerialize(meta)) : '');
        } else {
            console.log(line, meta ? JSON.stringify(safeSerialize(meta)) : '');
        }
        return;
    }

    if (level === 'error' || level === 'fatal') {
        console.error(JSON.stringify(record));
    } else {
        console.log(JSON.stringify(record));
    }
}

module.exports = {
    fatal: (message, meta) => write('fatal', message, meta),
    error: (message, meta) => write('error', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    info: (message, meta) => write('info', message, meta),
    debug: (message, meta) => write('debug', message, meta),
    // Re-exported for the request-log middleware (morgan stream target).
    write
};
