// Single source of truth for the API base URL used across the whole app.
// Every axios request and every image/upload URL resolution reads from here,
// so the backend hostname is configured in exactly one place.
//
//   - local dev:     empty string -> all relative /api/v1/* requests are
//                    proxied to http://localhost:8000 by the CRA "proxy" field
//                    in frontend/package.json (no CORS involved)
//   - Vercel prod:   REACT_APP_API_URL should be left EMPTY. The /api and
//                    /uploads rewrites in frontend/vercel.json forward those
//                    same-origin requests to the Railway backend, so the
//                    browser only ever resolves the Vercel domain (which its
//                    DNS can always reach). This is why production never needs
//                    the raw Railway hostname in a client request.
//
// A non-empty REACT_APP_API_URL is only needed when you want the browser to
// call the backend DIRECTLY (e.g. a custom API domain like api.example.com
// that your network reliably resolves). Do NOT set it to a *.up.railway.app
// hostname: many ISP/enterprise resolvers fail on it, which shows up as
// net::ERR_NAME_NOT_RESOLVED in the browser.
//
// Never hardcode a hostname here. It is read from the build-time env var so
// the same bundle works on every deployment.
export const API_BASE_URL = process.env.REACT_APP_API_URL || '';
