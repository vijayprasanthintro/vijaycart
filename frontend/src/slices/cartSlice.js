import { createSlice } from "@reduxjs/toolkit";



const COUPON_KEY = 'vijaycart_coupon';
const ORDER_KEY = 'vijaycart_orderKey';
const BUY_NOW_KEY = 'vijaycart_buyNowItems';
const COINS_KEY = 'vijaycart_coinsRedeemed';

const readCartItems = () => {
    try {
        const items = JSON.parse(localStorage.getItem('cartItems'));
        return Array.isArray(items) ? items : [];
    } catch { return []; }
};

const readShippingInfo = () => {
    try {
        const info = JSON.parse(localStorage.getItem('shippingInfo'));
        return info && typeof info === 'object' ? info : {};
    } catch { return {}; }
};

const readCoupon = () => {
    try { return JSON.parse(sessionStorage.getItem(COUPON_KEY)); } catch { return null; }
};

const readOrderKey = () => {
    try { return sessionStorage.getItem(ORDER_KEY) || null; } catch { return null; }
};

const readBuyNowItems = () => {
    try {
        const items = JSON.parse(sessionStorage.getItem(BUY_NOW_KEY));
        return Array.isArray(items) ? items : [];
    } catch { return []; }
};

const readCoinsRedeemed = () => {
    try { return Math.max(0, Number(sessionStorage.getItem(COINS_KEY)) || 0); } catch { return 0; }
};

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        items: readCartItems(),
        loading: false,
        shippingInfo: readShippingInfo(),
        coupon: readCoupon(),
        // Idempotency key for the current checkout session. Created when the
        // user reaches the payment screen, cleared after the order is created,
        // so a refresh/retry of the same session can never create a duplicate
        // order on the server.
        orderKey: readOrderKey(),
        // "Buy Now" checkout items — a session-scoped single-product checkout
        // that is completely separate from the cart. Placed so a Buy Now
        // purchase never adds to (or empties) the user's real cart.
        buyNowItems: readBuyNowItems(),
        // VijayCoins redeemed in the current checkout session (1 coin = ₹1).
        // Session-scoped like the coupon: it belongs to the order being placed
        // and is cleared the moment that order is created.
        coinsRedeemed: readCoinsRedeemed()
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
        setOrderKey(state, action) {
            const key = action.payload;
            try { sessionStorage.setItem(ORDER_KEY, key); } catch { /* ignore */ }
            return {
                ...state,
                orderKey: key
            }
        },
        clearOrderKey(state, action) {
            try { sessionStorage.removeItem(ORDER_KEY); } catch { /* ignore */ }
            return {
                ...state,
                orderKey: null
            }
        },
        setBuyNowItems(state, action) {
            try { sessionStorage.setItem(BUY_NOW_KEY, JSON.stringify(action.payload)); } catch { /* ignore */ }
            return {
                ...state,
                buyNowItems: action.payload
            }
        },
        clearBuyNowItems(state, action) {
            try { sessionStorage.removeItem(BUY_NOW_KEY); } catch { /* ignore */ }
            return {
                ...state,
                buyNowItems: []
            }
        },
        setCoinsRedeemed(state, action) {
            const value = Math.max(0, Math.floor(Number(action.payload) || 0));
            try { sessionStorage.setItem(COINS_KEY, String(value)); } catch { /* ignore */ }
            return {
                ...state,
                coinsRedeemed: value
            }
        },
        clearCoinsRedeemed(state, action) {
            try { sessionStorage.removeItem(COINS_KEY); } catch { /* ignore */ }
            return {
                ...state,
                coinsRedeemed: 0
            }
        },
        orderCompleted(state, action) {
            // A Buy Now checkout (keepCart) must clear only the buy-now session
            // and leave the user's real cart untouched. A regular cart checkout
            // clears the cart as before.
            const { keepCart } = action.payload || {};
            localStorage.removeItem('shippingInfo');
            if (!keepCart) localStorage.removeItem('cartItems');
            sessionStorage.removeItem('orderInfo');
            try { sessionStorage.removeItem(COUPON_KEY); } catch { /* ignore */ }
            try { sessionStorage.removeItem(ORDER_KEY); } catch { /* ignore */ }
            try { sessionStorage.removeItem(BUY_NOW_KEY); } catch { /* ignore */ }
            try { sessionStorage.removeItem(COINS_KEY); } catch { /* ignore */ }
            return {
                items: keepCart ? state.items : [],
                loading: false,
                shippingInfo: {},
                coupon: null,
                orderKey: null,
                buyNowItems: [],
                coinsRedeemed: 0
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
    setOrderKey,
    clearOrderKey,
    setBuyNowItems,
    clearBuyNowItems,
    setCoinsRedeemed,
    clearCoinsRedeemed,
    orderCompleted
 } = actions;

export default reducer;

