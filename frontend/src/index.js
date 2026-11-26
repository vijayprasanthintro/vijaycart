import React from 'react';
import ReactDOM from 'react-dom/client';
// Framework CSS is bundled locally instead of loading it from the
// stackpath.bootstrapcdn.com CDN (which was unreachable/slow on several
// networks, silently removing every Bootstrap margin/grid/flex utility and all
// Font Awesome icons). Importing these before App.css keeps the same cascade.
import './vendor/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
// Premium variable font (bundled locally, no CDN) used for admin numeric
// values and display type via --ad-font-display.
import '@fontsource-variable/manrope';
import App from './App';
import store from './store'
import {Provider } from 'react-redux';
import { WishlistProvider } from './context/WishlistContext';
import axios from 'axios';
import { API_BASE_URL } from './apiConfig';
import { applyCachedDesign, setThemePending } from './designs/designUtils';

// Centralized API configuration. Every axios request in the app uses these
// defaults and the single API_BASE_URL from ./apiConfig:
//   - local dev:  relative /api/v1 URLs are proxied to http://localhost:8000
//                 via the CRA "proxy" field in package.json.
//   - production: API_BASE_URL is forced to '' so /api/v1/* stays same-origin.
//                 Vercel's /api + /uploads rewrites (vercel.json) forward those
//                 requests to the Suga backend. The browser only ever resolves
//                 the VijayCart domain, which owns the JWT cookie.
// withCredentials must stay true: the JWT session is an httpOnly cookie.
// Same-origin requests attach it automatically; this also keeps any explicitly
// cross-origin request compatible with the existing cookie-based auth.
axios.defaults.withCredentials = true;
axios.defaults.baseURL = API_BASE_URL;
// Fail clearly instead of hanging forever if the backend is unreachable or a
// Railway cold start is unusually slow.
axios.defaults.timeout = 45000;

// Paint the last applied design before React mounts. /settings refreshes it a
// moment later, but this removes any flash of the default palette on reload.
// With no cache we use a neutral cover instead of painting eMox blue.
if (!applyCachedDesign()) setThemePending(true);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <WishlistProvider>
      <App />
    </WishlistProvider>
  </Provider>
);

