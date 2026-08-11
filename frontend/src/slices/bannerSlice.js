import { createSlice } from "@reduxjs/toolkit";

const bannerSlice = createSlice({
    name: 'banner',
    initialState: {
        banners: [],
        publicBanners: [],
        loading: false,
        saving: false,
        error: null,
        isCreated: false,
        isUpdated: false,
        isDeleted: false
    },
    reducers: {
        bannerRequest(state, action) {
            return { ...state, loading: true, error: null };
        },
        publicBannersSuccess(state, action) {
            return { ...state, loading: false, publicBanners: action.payload.banners || [] };
        },
        adminBannersSuccess(state, action) {
            return { ...state, loading: false, banners: action.payload.banners || [] };
        },
        bannerSaveRequest(state, action) {
            return { ...state, saving: true, error: null };
        },
        bannerCreated(state, action) {
            return { ...state, saving: false, isCreated: true, banners: action.payload.banners || state.banners };
        },
        bannerUpdated(state, action) {
            const updated = action.payload.banner;
            const banners = state.banners.map(b => b._id === updated._id ? { ...b, ...updated } : b);
            return { ...state, saving: false, isUpdated: true, banners };
        },
        bannerDeleted(state, action) {
            const id = action.payload.id;
            return { ...state, saving: false, isDeleted: true, banners: state.banners.filter(b => b._id !== id) };
        },
        bannersReordered(state, action) {
            return { ...state, saving: false, banners: action.payload.banners || state.banners };
        },
        bannerFail(state, action) {
            return { ...state, loading: false, saving: false, error: action.payload };
        },
        clearBannerState(state, action) {
            return { ...state, isCreated: false, isUpdated: false, isDeleted: false, error: null };
        }
    }
});

const { actions, reducer } = bannerSlice;

export const {
    bannerRequest,
    publicBannersSuccess,
    adminBannersSuccess,
    bannerSaveRequest,
    bannerCreated,
    bannerUpdated,
    bannerDeleted,
    bannersReordered,
    bannerFail,
    clearBannerState
} = actions;

export default reducer;
