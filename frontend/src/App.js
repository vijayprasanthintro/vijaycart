import './App.css';
import { lazy, Suspense, useEffect, Children, isValidElement, cloneElement } from 'react';
import { useSelector } from 'react-redux';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import store from './store';
import { AUTH_KEY } from './slices/authSlice';
import { loadUser } from './actions/userActions';
import Home from './components/Home';
import Header from './components/layouts/Header';
import Footer from './components/layouts/Footer';
import BottomNavigation from './components/layouts/BottomNavigation';
import CategoryNav from './components/home/CategoryNav';
import LocationBar from './components/home/LocationBar';
import ProtectedRoute from './components/route/ProtectedRoute';
import ScrollRestoration from './components/route/ScrollRestoration';
import ErrorBoundary from './components/layouts/ErrorBoundary';
import Loader from './components/layouts/Loader';
import PageTransition from './components/layouts/PageTransition';

// Route-level code splitting: everything except the shell + landing page is
// loaded on demand, shrinking the initial bundle and speeding up first paint.
// Explicit chunk names keep filenames stable across builds (better caching).
const ProductDetail = lazy(() => import(/* webpackChunkName: "product-detail" */ './components/product/ProductDetail'));
const ProductSearch = lazy(() => import(/* webpackChunkName: "product-search" */ './components/product/ProductSearch'));
const Login = lazy(() => import(/* webpackChunkName: "login" */ './components/user/Login'));
const Profile = lazy(() => import(/* webpackChunkName: "profile" */ './components/user/Profile'));
const Wishlist = lazy(() => import(/* webpackChunkName: "wishlist" */ './components/user/Wishlist'));
const UpdateProfile = lazy(() => import(/* webpackChunkName: "update-profile" */ './components/user/UpdateProfile'));
const SellerApply = lazy(() => import(/* webpackChunkName: "seller" */ './components/seller/SellerApply'));
const Cart = lazy(() => import(/* webpackChunkName: "cart" */ './components/cart/Cart'));
const Shipping = lazy(() => import(/* webpackChunkName: "shipping" */ './components/cart/Shipping'));
const ConfirmOrder = lazy(() => import(/* webpackChunkName: "confirm-order" */ './components/cart/ConfirmOrder'));
const StripeGate = lazy(() => import(/* webpackChunkName: "stripe-gate" */ './components/cart/StripeGate'));
const OrderSuccess = lazy(() => import(/* webpackChunkName: "order-success" */ './components/cart/OrderSuccess'));
const UserOrders = lazy(() => import(/* webpackChunkName: "user-orders" */ './components/order/UserOrders'));
const OrderDetail = lazy(() => import(/* webpackChunkName: "order-detail" */ './components/order/OrderDetail'));

// Admin dashboard
const AdminLayout = lazy(() => import(/* webpackChunkName: "admin-layout" */ './components/admin/AdminLayout'));
const Dashboard = lazy(() => import(/* webpackChunkName: "admin-dashboard" */ './components/admin/Dashboard'));
const ProductList = lazy(() => import(/* webpackChunkName: "admin-products" */ './components/admin/ProductList'));
const NewProduct = lazy(() => import(/* webpackChunkName: "admin-new-product" */ './components/admin/NewProduct'));
const UpdateProduct = lazy(() => import(/* webpackChunkName: "admin-update-product" */ './components/admin/UpdateProduct'));
const OrderList = lazy(() => import(/* webpackChunkName: "admin-orders" */ './components/admin/OrderList'));
const UpdateOrder = lazy(() => import(/* webpackChunkName: "admin-update-order" */ './components/admin/UpdateOrder'));
const UserList = lazy(() => import(/* webpackChunkName: "admin-users" */ './components/admin/UserList'));
const UpdateUser = lazy(() => import(/* webpackChunkName: "admin-update-user" */ './components/admin/UpdateUser'));
const ReviewList = lazy(() => import(/* webpackChunkName: "admin-reviews" */ './components/admin/ReviewList'));
const CategoryList = lazy(() => import(/* webpackChunkName: "admin-categories" */ './components/admin/CategoryList'));
const CouponList = lazy(() => import(/* webpackChunkName: "admin-coupons" */ './components/admin/CouponList'));
const DeliveryBoys = lazy(() => import(/* webpackChunkName: "admin-delivery-boys" */ './components/admin/DeliveryBoys'));
const Analytics = lazy(() => import(/* webpackChunkName: "admin-analytics" */ './components/admin/Analytics'));
const Revenue = lazy(() => import(/* webpackChunkName: "admin-revenue" */ './components/admin/Revenue'));
const Inventory = lazy(() => import(/* webpackChunkName: "admin-inventory" */ './components/admin/Inventory'));
const Settings = lazy(() => import(/* webpackChunkName: "admin-settings" */ './components/admin/Settings'));
const Permissions = lazy(() => import(/* webpackChunkName: "admin-permissions" */ './components/admin/Permissions'));
const AssignDelivery = lazy(() => import(/* webpackChunkName: "admin-assign-delivery" */ './components/admin/AssignDelivery'));
const SellerApplications = lazy(() => import(/* webpackChunkName: "admin-seller-applications" */ './components/admin/SellerApplications'));
const BannerList = lazy(() => import(/* webpackChunkName: "admin-banners" */ './components/admin/BannerList'));
const Reports = lazy(() => import(/* webpackChunkName: "admin-reports" */ './components/admin/Reports'));
const Pincodes = lazy(() => import(/* webpackChunkName: "admin-pincodes" */ './components/admin/Pincodes'));

// Admin login (email + password, separate from customer OTP login)
const AdminLogin = lazy(() => import(/* webpackChunkName: "admin-login" */ './components/admin/AdminLogin'));

// Delivery boy app
const DeliveryLogin = lazy(() => import(/* webpackChunkName: "delivery-login" */ './components/delivery/DeliveryLogin'));
const DeliveryDashboard = lazy(() => import(/* webpackChunkName: "delivery-dashboard" */ './components/delivery/DeliveryDashboard'));

function RouteFallback() {
  return <Loader />;
}

// Guards an admin route against the permission matrix saved on the
// Permissions page. A module toggled off for the admin role redirects to the
// dashboard. Before any matrix is saved the guard is open (all routes allowed),
// matching the "default open" behavior of the sidebar.
function RequireModule({ perm, children }) {
  const { settings } = useSelector((state) => state.settingState);
  const adminPerms = settings?.permissions?.admin;
  // The dashboard is the admin landing page and the redirect target for
  // denied modules — blocking it would strand the admin. It is always open.
  const allowed = !adminPerms || perm === 'dashboard' || adminPerms[perm] !== false;
  if (!allowed) return <Navigate to="/admin/dashboard" replace />;
  return children;
}

function Shell() {
  const location = useLocation();
  const hideChrome = location.pathname.startsWith('/admin') || location.pathname.startsWith('/delivery');

  // Wrap every route element in a page-transition layer so navigation
  // cross-fades smoothly (the existing components/logic are untouched).
  // Admin/delivery routes are skipped: their pages mount at opacity 0 and
  // fade in on every navigation (the AnimatePresence key stays constant for
  // all /admin subpaths, so no exit runs) — that flash is exactly the
  // "Orders flicker". Dashboards should render instantly instead.
  const animatedRoutes = (routes) => (
    Children.map(routes, (child) => {
      if (!isValidElement(child)) return child;
      const path = child.props.path || '';
      const isDashboard = !path.startsWith('/') || path.startsWith('/admin') || path.startsWith('/delivery');
      if (isDashboard) return child;
      return cloneElement(child, {
        element: <PageTransition>{child.props.element}</PageTransition>,
      });
    })
  );

  return (
    <>
      {/* Route-level scroll management: every new navigation opens at the
          top of the page (back/forward restores the previous position). */}
      <ScrollRestoration />
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {!hideChrome && <Header />}
      {!hideChrome && <LocationBar />}
      {!hideChrome && <CategoryNav />}
      <main id="main-content" className='container' role="main">
        <ToastContainer theme='dark' />
        <Suspense fallback={<RouteFallback />}>
          <ErrorBoundary>
            <AnimatePresence mode="wait" initial={false}>
              <Routes
                location={location}
                key={location.pathname.split('/')[1] || 'home'}
            >
              {animatedRoutes(
                <>
                  <Route path='/' element={<Home />} />
                  <Route path='/search/:keyword' element={<ProductSearch />} />
                  <Route path='/search/' element={<ProductSearch />} />
                  <Route path='/product/:id' element={<ProductDetail />} />
                  <Route path='/login' element={<Login />} />
                  <Route path='/myprofile' element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path='/myprofile/update' element={<ProtectedRoute><UpdateProfile /></ProtectedRoute>} />
                  <Route path='/cart' element={<Cart />} />
                  <Route path='/wishlist' element={<Wishlist />} />
                  <Route path='/seller' element={<SellerApply />} />
                  <Route path='/shipping' element={<ProtectedRoute><Shipping /></ProtectedRoute>} />
                  <Route path='/order/confirm' element={<ProtectedRoute><ConfirmOrder /></ProtectedRoute>} />
                  <Route path='/order/success' element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
                  <Route path='/orders' element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
                  <Route path='/order/:id' element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                  <Route path='/payment' element={<ProtectedRoute><StripeGate /></ProtectedRoute>} />

                  <Route path='/admin' element={<ProtectedRoute isAdmin={true}><AdminLayout /></ProtectedRoute>}>
                    <Route index element={<Navigate to='dashboard' replace />} />
                    <Route path='dashboard' element={<RequireModule perm="dashboard"><Dashboard /></RequireModule>} />
                    <Route path='orders' element={<RequireModule perm="orders"><OrderList /></RequireModule>} />
                    <Route path='order/:id' element={<RequireModule perm="orders"><UpdateOrder /></RequireModule>} />
                    <Route path='products' element={<RequireModule perm="products"><ProductList /></RequireModule>} />
                    <Route path='products/create' element={<RequireModule perm="products"><NewProduct /></RequireModule>} />
                    <Route path='product/:id' element={<RequireModule perm="products"><UpdateProduct /></RequireModule>} />
                    <Route path='categories' element={<RequireModule perm="categories"><CategoryList /></RequireModule>} />
                    <Route path='coupons' element={<RequireModule perm="coupons"><CouponList /></RequireModule>} />
                    <Route path='delivery-boys' element={<RequireModule perm="delivery"><DeliveryBoys /></RequireModule>} />
                    <Route path='users' element={<RequireModule perm="users"><UserList /></RequireModule>} />
                    <Route path='user/:id' element={<RequireModule perm="users"><UpdateUser /></RequireModule>} />
                    <Route path='seller-applications' element={<RequireModule perm="sellers"><SellerApplications /></RequireModule>} />
                    <Route path='analytics' element={<RequireModule perm="analytics"><Analytics /></RequireModule>} />
                    <Route path='revenue' element={<RequireModule perm="revenue"><Revenue /></RequireModule>} />
                    <Route path='inventory' element={<RequireModule perm="inventory"><Inventory /></RequireModule>} />
                    <Route path='reviews' element={<RequireModule perm="reviews"><ReviewList /></RequireModule>} />
                    <Route path='reports' element={<RequireModule perm="reports"><Reports /></RequireModule>} />
                    <Route path='banners' element={<RequireModule perm="banners"><BannerList /></RequireModule>} />
                    <Route path='settings' element={<RequireModule perm="settings"><Settings /></RequireModule>} />
                    <Route path='permissions' element={<RequireModule perm="permissions"><Permissions /></RequireModule>} />
                    <Route path='delivery' element={<RequireModule perm="delivery"><AssignDelivery /></RequireModule>} />
                    <Route path='pincodes' element={<RequireModule perm="pincodes"><Pincodes /></RequireModule>} />
                  </Route>

                  <Route path='/admin/login' element={<AdminLogin />} />
                  <Route path='/delivery/login' element={<DeliveryLogin />} />
                  <Route path='/delivery/dashboard' element={<ProtectedRoute isDeliveryBoy={true}><DeliveryDashboard /></ProtectedRoute>} />
                </>
              )}
            </Routes>
            </AnimatePresence>
          </ErrorBoundary>
        </Suspense>
      </main>
      {!hideChrome && <Footer />}
      {!hideChrome && <BottomNavigation />}
    </>
  );
}

function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await store.dispatch(loadUser());
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error('Failed to initialize app data', error);
        }
      }
    };

    initializeApp();
  }, [])

  // Keep the visible account in sync when another tab of this origin logs in
  // or out (login/logout persist the shared cookie + localStorage cache). The
  // `storage` event only fires in the other tabs, never the one that changed.
  useEffect(() => {
    const onAuthStorageChange = (e) => {
      if (e.key !== AUTH_KEY) return;
      // Skip redundant re-persists: every successful loadUser() re-writes the
      // auth cache (with a fresh expiry), which would otherwise fire this event
      // in the other tabs, trigger another loadUser(), re-persist, and loop
      // forever — flashing the Loader on protected pages. Only a real profile
      // change (login/logout/profile edit) must propagate across tabs.
      try {
        const incoming = e.newValue ? JSON.parse(e.newValue) : null;
        const current = store.getState().authState.user;
        if (incoming && incoming.user && current
            && JSON.stringify(incoming.user) === JSON.stringify(current)) {
          return;
        }
      } catch { /* fall through and re-validate */ }
      store.dispatch(loadUser());
    };
    window.addEventListener('storage', onAuthStorageChange);
    return () => window.removeEventListener('storage', onAuthStorageChange);
  }, [])

  return (
    <Router>
      <div className="App">
        <div className="animated-bg"></div>
        <HelmetProvider>
          <Shell />
        </HelmetProvider>
      </div>
    </Router>
  );
}

export default App;
