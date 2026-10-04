import { createSlice } from '@reduxjs/toolkit';
import {
    loadUserSuccess,
    loginSuccess,
    logoutSuccess,
    updateProfileSuccess
} from './authSlice';

// Server-backed address book state (one source of truth: the authenticated
// user's MongoDB document). `userId` records which account the cached list
// belongs to so any account switch (login without logout, cross-tab session
// change, logout) drops the previous user's addresses before they can ever
// be rendered for someone else.
const initialState = {
    loading: false,
    items: [],
    userId: null,
    loaded: false
};

const syncUser = (state, action) => {
    const nextId = action.payload?.user?.id || null;
    if (!nextId) return;
    if (state.userId && state.userId !== nextId) {
        // Different account took over this browser/tab — never keep or show
        // the previous user's saved addresses.
        return { ...initialState, userId: nextId };
    }
    state.userId = nextId;
};

const addressSlice = createSlice({
    name: 'address',
    initialState,
    reducers: {
        fetchAddressesRequest(state) {
            return { ...state, loading: true };
        },
        fetchAddressesSuccess(state, action) {
            return {
                loading: false,
                items: Array.isArray(action.payload) ? action.payload : [],
                userId: state.userId,
                loaded: true
            };
        },
        fetchAddressesFail(state) {
            return { ...state, loading: false };
        },
        mutateRequest(state) {
            return { ...state, loading: true };
        },
        mutateSuccess(state, action) {
            return {
                loading: false,
                items: Array.isArray(action.payload) ? action.payload : [],
                userId: state.userId,
                loaded: true
            };
        },
        mutateFail(state) {
            return { ...state, loading: false };
        },
        clearAddresses() {
            return { ...initialState };
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginSuccess, syncUser)
            .addCase(loadUserSuccess, syncUser)
            .addCase(updateProfileSuccess, syncUser)
            .addCase(logoutSuccess, () => ({ ...initialState }));
    }
});

const { actions, reducer } = addressSlice;

export const {
    fetchAddressesRequest,
    fetchAddressesSuccess,
    fetchAddressesFail,
    mutateRequest,
    mutateSuccess,
    mutateFail,
    clearAddresses
} = actions;

export default reducer;
