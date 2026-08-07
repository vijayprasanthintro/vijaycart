// Single source of truth for the API base URL used across the whole app.
// Every axios request and every image/upload URL resolution reads from here,
// so the backend hostname is configured in exactly one place.
//
//   - local dev:     empty string -> all relative /api/v1/* requests are
//                    proxied to http://localhost:8000 by the CRA "proxy" field
//                    in frontend/package.json (no CORS involved)
//   - Vercel prod:   REACT_APP_API_URL (e.g. https://your-service.up.railway.app)
//                    -> axios (baseURL) and image resolution go straight to the
//                    Railway backend, cross-origin with credentials (cookies)
//
// Never hardcode a hostname here. It is read from the build-time env var so the
// same bundle works on every deployment; on Vercel set REACT_APP_API_URL in the
// dashboard (Production/Preview) or a .env file committed nowhere.
export const API_BASE_URL = process.env.REACT_APP_API_URL || '';
