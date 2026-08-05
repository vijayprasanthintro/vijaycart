import './App.css';
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import store from './store';
import { loadUser } from './actions/userActions';
import Home from './components/Home';
import Header from './components/layouts/Header';
import Footer from './components/layouts/Footer';
import BottomNavigation from './components/layouts/BottomNavigation';
import CategoryNav from './components/home/CategoryNav';
import ProtectedRoute from './components/route/ProtectedRoute';
import Loader from './components/layouts/Loader';

// Route-level code splitting: everything except the shell + landing page is
// loaded on demand, shrinking the initial bundle and speeding up first paint.
const ProductDetail = lazy(() => import('./components/product/ProductDetail'));
const ProductSearch = lazy(() => import('./components/product/ProductSearch'));
const Login = lazy(() => import('./components/user/Login'));
const Register = lazy(() => import('./components/user/Register'));
const Profile = lazy(() => import('./components/user/Profile'));
const Wishlist = lazy(() => import('./components/user/Wishlist'));
const UpdateProfile = lazy(() => import('./components/user/UpdateProfile'));
const UpdatePassword = lazy(() => import('./components/user/UpdatePassword'));
const ForgotPassword = lazy(() => import('./components/user/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/user/ResetPassword'));
const Cart = lazy(() => import('./components/cart/Cart'));
const Shipping = lazy(() => import('./components/cart/Shipping'));
const ConfirmOrder = lazy(() => import('./components/cart/ConfirmOrder'));
const StripeGate = lazy(() => import('./components/cart/StripeGate'));
const OrderSuccess = lazy(() => import('./components/cart/OrderSuccess'));
const UserOrders = lazy(() => import('./components/order/UserOrders'));
const OrderDetail = lazy(() => import('./components/order/OrderDetail'));

// Admin dashboard
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const Dashboard = lazy(() => import('./components/admin/Dashboard'));
const ProductList = lazy(() => import('./components/admin/ProductList'));
const NewProduct = lazy(() => import('./components/admin/NewProduct'));
const UpdateProduct = lazy(() => import('./components/admin/UpdateProduct'));
const OrderList = lazy(() => import('./components/admin/OrderList'));
const UpdateOrder = lazy(() => import('./components/admin/UpdateOrder'));
const UserList = lazy(() => import('./components/admin/UserList'));
const UpdateUser = lazy(() => import('./components/admin/UpdateUser'));
const ReviewList = lazy(() => import('./components/admin/ReviewList'));
const CategoryList = lazy(() => import('./components/admin/CategoryList'));
const CouponList = lazy(() => import('./components/admin/CouponList'));
const DeliveryBoys = lazy(() => import('./components/admin/DeliveryBoys'));
const Analytics = lazy(() => import('./components/admin/Analytics'));
const Revenue = lazy(() => import('./components/admin/Revenue'));
const Inventory = lazy(() => import('./components/admin/Inventory'));
const Settings = lazy(() => import('./components/admin/Settings'));
const Permissions = lazy(() => import('./components/admin/Permissions'));
const AssignDelivery = lazy(() => import('./components/admin/AssignDelivery'));

// Delivery boy app
const DeliveryLogin = lazy(() => import('./components/delivery/DeliveryLogin'));
const DeliveryDashboard = lazy(() => import('./components/delivery/DeliveryDashboard'));

function RouteFallback() {
  return <Loader />;
}

function Shell() {
  const location = useLocation();
  const hideChrome = location.pathname.startsWith('/admin') || location.pathname.startsWith('/delivery');

  return (
    <>
      {!hideChrome && <Header />}
      {!hideChrome && <CategoryNav />}
      <div className='container'>
        <ToastContainer theme='dark' />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/search/:keyword' element={<ProductSearch />} />
            <Route path='/search/' element={<ProductSearch />} />
            <Route path='/product/:id' element={<ProductDetail />} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/myprofile' element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path='/myprofile/update' element={<ProtectedRoute><UpdateProfile /></ProtectedRoute>} />
            <Route path='/myprofile/update/password' element={<ProtectedRoute><UpdatePassword /></ProtectedRoute>} />
            <Route path='/password/forgot' element={<ForgotPassword />} />
            <Route path='/password/reset/:token' element={<ResetPassword />} />
            <Route path='/cart' element={<Cart />} />
            <Route path='/wishlist' element={<Wishlist />} />
            <Route path='/shipping' element={<ProtectedRoute><Shipping /></ProtectedRoute>} />
            <Route path='/order/confirm' element={<ProtectedRoute><ConfirmOrder /></ProtectedRoute>} />
            <Route path='/order/success' element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
            <Route path='/orders' element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
            <Route path='/order/:id' element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
            <Route path='/payment' element={<ProtectedRoute><StripeGate /></ProtectedRoute>} />

            <Route path='/admin' element={<ProtectedRoute isAdmin={true}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to='dashboard' replace />} />
              <Route path='dashboard' element={<Dashboard />} />
              <Route path='orders' element={<OrderList />} />
              <Route path='order/:id' element={<UpdateOrder />} />
              <Route path='products' element={<ProductList />} />
              <Route path='products/create' element={<NewProduct />} />
              <Route path='product/:id' element={<UpdateProduct />} />
              <Route path='categories' element={<CategoryList />} />
              <Route path='coupons' element={<CouponList />} />
              <Route path='delivery-boys' element={<DeliveryBoys />} />
              <Route path='users' element={<UserList />} />
              <Route path='user/:id' element={<UpdateUser />} />
              <Route path='analytics' element={<Analytics />} />
              <Route path='revenue' element={<Revenue />} />
              <Route path='inventory' element={<Inventory />} />
              <Route path='reviews' element={<ReviewList />} />
              <Route path='settings' element={<Settings />} />
              <Route path='permissions' element={<Permissions />} />
              <Route path='delivery' element={<AssignDelivery />} />
            </Route>

            <Route path='/delivery/login' element={<DeliveryLogin />} />
            <Route path='/delivery/dashboard' element={<ProtectedRoute isDeliveryBoy={true}><DeliveryDashboard /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </div>
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
