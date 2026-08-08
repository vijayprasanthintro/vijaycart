import { createSlice } from "@reduxjs/toolkit";

// The httpOnly cookie is the real credential; this localStorage copy of the
// user profile is only an optimistic cache so that a page refresh restores the
// UI session instantly (no redirect-to-login flash) before /myprofile
// re-validates against the cookie. If the server rejects the cookie, the
// cache is cleared and the user is logged out for real.
const AUTH_KEY = 'vijaycart_auth';

// "Remember me" preference (stored in localStorage so it survives restarts).
// When unchecked, the optimistic auth cache is kept in sessionStorage only,
// so closing the browser drops the cached UI session (the server cookie may
// still be valid, but the app no longer restores the session optimistically).
const REMEMBER_KEY = 'vijaycart_remember';

// Keep the optimistic cache in step with the server session (JWT_EXPIRES_TIME
// and the cookie both expire after 7 days). An expired cache is treated as a
// logged-out state so a stale session is never shown as "still logged in".
const AUTH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const readRemember = () => {
    try { return localStorage.getItem(REMEMBER_KEY) !== '0'; } catch { return true; }
};

const authStorage = () => readRemember() ? localStorage : sessionStorage;
const otherAuthStorage = () => readRemember() ? sessionStorage : localStorage;

// Keys owned by the cart/checkout flow. Cleared on logout and on account
// switch so the next user never inherits the previous user's cart, saved
// addresses, or half-finished checkout (which would reuse the previous user's
// idempotency key and could surface their order on the success page).
const CART_STORAGE_KEYS = ['cartItems', 'shippingInfo', 'vijaycart_addresses'];
const CHECKOUT_SESSION_KEYS = ['orderInfo', 'vijaycart_orderKey', 'vijaycart_coupon'];

const clearCheckoutSession = () => {
    try {
        CART_STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
        CHECKOUT_SESSION_KEYS.forEach(k => sessionStorage.removeItem(k));
    } catch {
        /* ignore */
    }
};

const readAuth = () => {
    for (const store of [localStorage, sessionStorage]) {
        try {
            const raw = store.getItem(AUTH_KEY);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            if (parsed && parsed.isAuthenticated && parsed.user) {
                if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
                    clearAuth();
                    return null;
                }
                return parsed;
            }
        } catch {
            /* continue to the next storage */
        }
    }
    return null;
};

const persistAuth = (user) => {
    try {
        authStorage().setItem(AUTH_KEY, JSON.stringify({
            isAuthenticated: true,
            user,
            expiresAt: Date.now() + AUTH_TTL_MS
        }));
        otherAuthStorage().removeItem(AUTH_KEY);
    } catch {
        /* storage unavailable — cookie session still works for the current tab */
    }
};

const clearAuth = () => {
    try { localStorage.removeItem(AUTH_KEY); } catch { /* ignore */ }
    try { sessionStorage.removeItem(AUTH_KEY); } catch { /* ignore */ }
};

export { AUTH_KEY, REMEMBER_KEY };

const savedAuth = readAuth();

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        loading: true,
        isAuthenticated: !!savedAuth,
        user: savedAuth ? savedAuth.user : null,
        otpInfo: null,
        otpLoading: false,
        otpError: null
    },
    reducers: {
        loginRequest(state, action){
            return {
                ...state,
                loading: true,
            }
        },
        loginSuccess(state, action){
            // Switching from one logged-in account to another must not carry
            // over the previous account's cart / checkout session.
            if (state.user && state.user.id !== action.payload.user.id) {
                clearCheckoutSession();
            }
            persistAuth(action.payload.user);
            return {
                loading: false,
                isAuthenticated: true,
                user: action.payload.user
            }
        },
        loginFail(state, action){
            return {
                ...state,
                loading: false,
                error:  action.payload
            }
        },
        clearError(state, action){
            return {
                ...state,
                error:  null
            }
        },
        //Step 1 state: an OTP has been sent and awaits verification.
        otpRequest(state, action){
            return {
                ...state,
                otpLoading: true,
                otpError: null
            }
        },
        otpRequestSuccess(state, action){
            return {
                ...state,
                otpLoading: false,
                otpInfo: {
                    userId: action.payload.userId,
                    to: action.payload.to,
                    resendIn: action.payload.resendIn,
                    expiresIn: action.payload.expiresIn,
                    isNewUser: action.payload.isNewUser
                },
                otpError: null
            }
        },
        otpRequestFail(state, action){
            return {
                ...state,
                otpLoading: false,
                otpError: action.payload
            }
        },
        loadUserRequest(state, action){
            // Keep the previously known session while re-validating. Setting
            // isAuthenticated=false here would flash a logged-out state on
            // every refresh before /myprofile responds.
            return {
                ...state,
                loading: true,
            }
        },
        loadUserSuccess(state, action){
            persistAuth(action.payload.user);
            return {
                loading: false,
                isAuthenticated: true,
                user: action.payload.user
            }
        },
        loadUserFail(state, action){
            const { status, message } = action.payload || {};
            // Only treat an explicit auth rejection as a logout. A transient
            // network/500 error must not kick the user out of a valid session.
            const isAuthError = status === 401 || status === 403
                || (status === 400 && /login first|token|unauthorized|not allowed/i.test(String(message || '')));
            if (isAuthError) {
                clearAuth();
                return {
                    loading: false,
                    isAuthenticated: false,
                    error: message
                };
            }
            return {
                ...state,
                loading: false,
                error: message
            };
        },
        logoutSuccess(state, action){
            // Drop the cart, saved addresses and any in-progress checkout so a
            // different account logging in on this browser never inherits this
            // user's data (previous-user bleed).
            clearCheckoutSession();
            clearAuth();
            return {
                loading: false,
                isAuthenticated: false,
                user: null
            }
        },
        logoutFail(state, action){
            return {
                ...state,
                error:  action.payload
            }
        },
        updateProfileRequest(state, action){
            return {
                ...state,
                loading: true,
                isUpdated: false
            }
        },
        updateProfileSuccess(state, action){
            persistAuth(action.payload.user);
            return {
                ...state,
                loading: false,
                user: action.payload.user,
                isUpdated: true
            }
        },
        updateProfileFail(state, action){
            return {
                ...state,
                loading: false,
                error:  action.payload
            }
        },
        clearUpdateProfile(state, action){
            return {
                ...state,
                isUpdated: false
            }
        },
        
    }
});

const { actions, reducer } = authSlice;

export const { 
    loginRequest, 
    loginSuccess, 
    loginFail, 
    clearError,
    otpRequest,
    otpRequestSuccess,
    otpRequestFail,
    loadUserRequest,
    loadUserSuccess,
    loadUserFail,
    logoutFail,
    logoutSuccess,
    updateProfileFail,
    updateProfileRequest,
    updateProfileSuccess,
    clearUpdateProfile,
    
 } = actions;

export default reducer;

