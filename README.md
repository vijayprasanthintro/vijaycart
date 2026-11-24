# VijayCart

VijayCart is a MERN stack e-commerce application with customer shopping flows, checkout/payment, Google authentication, and an admin dashboard.

## Tech Stack

- **Frontend:** React 18, Redux Toolkit, React Router, Bootstrap, Axios
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Auth:** JWT cookie auth, OTP login, Google OAuth (full-page redirect)
- **Payments:** Stripe card flow and configurable payment methods

## Project Structure

```text
vijaycart/
├── backend/                 # Express API, controllers, models, routes, config
├── frontend/                # React app
├── package.json             # Root scripts/dependencies
└── README.md
```

## Prerequisites

- Node.js 18.x
- npm 9.x
- MongoDB (local or Atlas)
- Google OAuth credentials (for Google login)
- Stripe keys (for card payments, if enabled)

## Environment Setup

1. Copy the backend example env file:

   ```bash
   copy backend\config\config.env.example backend\config\config.env
   ```

2. Fill required values in `backend/config/config.env`.

Important variables:

| Variable | Purpose |
|---|---|
| `PORT` | Backend port (default `8000`) |
| `NODE_ENV` | `development` or `production` |
| `DB_LOCAL_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_TIME` | JWT expiry (e.g. `7d`) |
| `COOKIE_EXPIRES_TIME` | Auth cookie expiry in days |
| `FRONTEND_URL` | Frontend origin for CORS/callback redirects |
| `BACKEND_URL` | Backend base URL |
| `GOOGLE_CLIENT_ID` | Google OAuth Web client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Web client secret |
| `GOOGLE_REDIRECT_URI` | Backend Google callback URL |
| `STRIPE_API_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |

## Google OAuth Setup (Full-Page Redirect)

VijayCart uses a full-page Google OAuth redirect flow:

1. Frontend redirects user to `GET /api/v1/google?redirect=...`
2. Backend redirects to Google with `prompt=select_account`
3. Google redirects to backend callback `GET /api/v1/google/callback`
4. Backend verifies the Google identity, creates/links user in MongoDB, sets JWT cookie, and redirects back to frontend

Configure in Google Cloud Console:

- **Authorized redirect URI:**
  - Local: `http://127.0.0.1:8000/api/v1/google/callback`
  - Production: `https://YOUR-BACKEND/api/v1/google/callback`

Set in `backend/config/config.env`:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/api/v1/google/callback
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://127.0.0.1:8000
```

## Installation

### Root / Backend dependencies

```bash
npm install
```

### Frontend dependencies

```bash
cd frontend
npm install
```

## Running the App

### Run backend (development)

From repo root:

```bash
npm run dev
```

Or from backend:

```bash
cd backend
npm start
```

### Run frontend

```bash
cd frontend
npm start
```

- Frontend: `http://localhost:3000`
- Backend: `http://127.0.0.1:8000`
- Frontend dev proxy targets `http://localhost:8000` (see `frontend/package.json`)

## Build

### Frontend build

```bash
cd frontend
npm run build
```

### Root build script

```bash
npm run build
```

This installs frontend dependencies and builds the frontend.

## Useful Scripts

### Root `package.json`

- `npm start` - start backend (`backend/server.js`)
- `npm run dev` - start backend with nodemon (development)
- `npm run prod` - start backend with nodemon (production)
- `npm run build` - build frontend
- `npm run seeder` - run data seeder
- `npm run seed:admin` - seed admin user

## Key Flows

### Customer

- Browse/search/filter products
- Add to cart / Buy Now
- Manage addresses (India default for new addresses)
- Checkout and payment
- Order confirmation and order history
- OTP login and Google full-page login

### Admin

- Dashboard and reports
- Product create/edit/delete
- Category, order, user, coupon, banner, and settings management
- Inventory and order status management

## Notes

- Do not commit `backend/config/config.env` or secrets.
- Google client secret must remain server-side only.
- For cross-origin production deployments, ensure frontend/backend URLs, HTTPS, and cookie settings are correctly configured.
- Payment gateway behavior should be validated with real provider credentials in staging before production.

## Manual QA Checklist

- Add to cart → Checkout → Address → Payment → Order confirmation
- Google login redirect (success, cancel, failure)
- Admin product create/edit with continuous typing
- Address save with India as default country
- Mobile and desktop responsive checks
