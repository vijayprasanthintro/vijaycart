// Single source of truth for the API base URL used across the whole app.
// Every axios request and every image/upload URL resolution reads from here.
//
//   - local dev:     REACT_APP_API_URL may be empty (CRA proxies /api/v1/* to
//                    http://localhost:8000) or point at a local API.
//   - Vercel prod:   ALWAYS same-origin. The /api and /uploads rewrites in
//                    vercel.json forward those requests to the Suga backend,
//                    so the browser only ever resolves the VijayCart domain.
//                    This is required for the httpOnly JWT cookie to be sent:
//                    a cookie stored on the Vercel origin is not attached to
//                    requests made directly to the raw Suga hostname.
//
// Production deliberately ignores REACT_APP_API_URL. A stale Vercel value
// containing the raw backend host is baked into the CRA bundle at build time
// and breaks /api/v1/myprofile after Google login (401 Unauthorized). No
// hostname is hardcoded here; the production origin is the site itself.
export const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? ''
    : String(process.env.REACT_APP_API_URL || '').trim().replace(/\/+$/, '');
