import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import store from './store'
import {Provider } from 'react-redux';
import { WishlistProvider } from './context/WishlistContext';
import axios from 'axios';

// Centralized API configuration. Every axios request in the app uses these
// defaults, so there is exactly one place where the backend URL is resolved:
//   - local dev:  baseURL empty -> relative /api/v1 URLs, proxied to
//                 http://localhost:8000 via the CRA "proxy" field in package.json
//   - production: REACT_APP_API_URL (e.g. the Railway backend URL) -> direct
//                 cross-origin calls with credentials (cookies) attached
// withCredentials must stay true: the JWT session is an httpOnly cookie.
axios.defaults.withCredentials = true;
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '';
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

