import { combineReducers, configureStore } from "@reduxjs/toolkit";
import productsReducer from "./slices/productsSlice";
import productReducer from './slices/productSlice';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import orderReducer from './slices/orderSlice';
import userReducer from './slices/userSlice'
import deliveryReducer from './slices/deliverySlice'
import categoryReducer from './slices/categorySlice'
import couponReducer from './slices/couponSlice'
import settingReducer from './slices/settingSlice'
import analyticsReducer from './slices/analyticsSlice'


const reducer = combineReducers({
    productsState: productsReducer,
    productState: productReducer ,
    authState: authReducer,
    cartState: cartReducer,
    orderState: orderReducer,
    userState: userReducer,
    deliveryState: deliveryReducer,
    categoryState: categoryReducer,
    couponState: couponReducer,
    settingState: settingReducer,
    analyticsState: analyticsReducer
})


const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware()
})

export default store;