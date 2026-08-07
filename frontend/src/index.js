import React from 'react';
import ReactDOM from 'react-dom/client';
// Framework CSS is bundled locally instead of loading it from the
// stackpath.bootstrapcdn.com CDN (which was unreachable/slow on several
// networks, silently removing every Bootstrap margin/grid/flex utility and all
// Font Awesome icons). Importing these before App.css keeps the same cascade.
import './vendor/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import App from './App';
import store from './store'
import {Provider } from 'react-redux';
import { WishlistProvider } from './context/WishlistContext';
import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

// Centralized API configuration. Every axios request in the app uses these
// defaults and the single API_BASE_URL from ./apiConfig:
//   - local dev:  baseURL empty -> relative /api/v1 URLs, proxied to
//                 http://localhost:8000 via the CRA "proxy" field in package.json
//   - production: REACT_APP_API_URL (e.g. the Railway backend URL) -> direct
//                 cross-origin calls with credentials (cookies) attached
// withCredentials must stay true: the JWT session is an httpOnly cookie.
axios.defaults.withCredentials = true;
axios.defaults.baseURL = API_BASE_URL;
// Fail clearly instead of hanging forever if the backend is unreachable or a
// Railway cold start is unusually slow.
axios.defaults.timeout = 45000;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <WishlistProvider>
    <Provider store={store}>
      <App />
    </Provider>
  </WishlistProvider>
);

