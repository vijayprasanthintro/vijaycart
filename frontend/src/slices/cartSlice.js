import { createSlice } from "@reduxjs/toolkit";



const COUPON_KEY = 'vijaycart_coupon';

const readCoupon = () => {
    try { return JSON.parse(sessionStorage.getItem(COUPON_KEY)); } catch { return null; }
};

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        items: localStorage.getItem('cartItems')? JSON.parse(localStorage.getItem('cartItems')): [],
        loading: false,
        shippingInfo: localStorage.getItem('shippingInfo')? JSON.parse(localStorage.getItem('shippingInfo')): {},
        coupon: readCoupon()
    },
    reducers: {
        addCartItemRequest(state, action){
            return {
                ...state,
                loading: true
            }
        },
        addCartItemSuccess(state, action){
            const item = action.payload
            const isItemExist = state.items.find( i => i.product === item.product);
            
            if(isItemExist) {
                state.items = state.items.map(i => 
                    i.product === item.product ? {...i, quantity: i.quantity + item.quantity} : i
                )
                state.loading = false
            }else{
                state = {
                    ...state,
                    items: [...state.items, item],
                    loading: false
                }
            }
            localStorage.setItem('cartItems', JSON.stringify(state.items));
            return state
        },
        increaseCartItemQty(state, action) {
            state.items = state.items.map(item => {
                if(item.product === action.payload) {
                    item.quantity = item.quantity + 1
                }
                return item;
            })
            localStorage.setItem('cartItems', JSON.stringify(state.items));

        },
        decreaseCartItemQty(state, action) {
            state.items = state.items.map(item => {
                if(item.product === action.payload) {
                    item.quantity = item.quantity - 1
                }
                return item;
            })
            localStorage.setItem('cartItems', JSON.stringify(state.items));

        },
        removeItemFromCart(state, action) {
            const filterItems = state.items.filter(item => {
                return item.product !== action.payload
            })
            localStorage.setItem('cartItems', JSON.stringify(filterItems));
            return {
                ...state,
                items: filterItems
            }
        },
        saveShippingInfo(state, action) {
            localStorage.setItem('shippingInfo', JSON.stringify(action.payload));
            return {
                ...state,
                shippingInfo: action.payload
            }
        },
        setCoupon(state, action) {
            try { sessionStorage.setItem(COUPON_KEY, JSON.stringify(action.payload)); } catch { /* ignore */ }
            return {
                ...state,
                coupon: action.payload
            }
        },
        clearCoupon(state, action) {
            try { sessionStorage.removeItem(COUPON_KEY); } catch { /* ignore */ }
            return {
                ...state,
                coupon: null
            }
        },
        orderCompleted(state, action) {
            localStorage.removeItem('shippingInfo');
            localStorage.removeItem('cartItems');
            sessionStorage.removeItem('orderInfo');
            try { sessionStorage.removeItem(COUPON_KEY); } catch { /* ignore */ }
            return {
                items: [],
                loading: false,
                shippingInfo: {},
                coupon: null
            }
        }

    }
});

const { actions, reducer } = cartSlice;

export const { 
    addCartItemRequest, 
    addCartItemSuccess,
    decreaseCartItemQty,
    increaseCartItemQty,
    removeItemFromCart,
    saveShippingInfo,
    setCoupon,
    clearCoupon,
    orderCompleted
 } = actions;

export default reducer;

