import { createSlice } from '@reduxjs/toolkit';

const sellerSlice = createSlice({
    name: 'seller',
    initialState: {
        application: null,
        applications: [],
        loading: false,
        submitting: false,
        error: null,
        isSubmitted: false,
        isUpdated: false
    },
    reducers: {
        sellerRequest(state, action) {
            return { ...state, loading: true, error: null };
        },
        sellerSubmitRequest(state, action) {
            return { ...state, submitting: true, error: null };
        },
        sellerApplied(state, action) {
            return {
                ...state,
                submitting: false,
                isSubmitted: true,
                application: action.payload.application || null,
                error: null
            };
        },
        mySellerApplicationSuccess(state, action) {
            return { ...state, loading: false, application: action.payload.application || null };
        },
        sellerApplicationsSuccess(state, action) {
            return { ...state, loading: false, applications: action.payload.applications || [] };
        },
        sellerApplicationUpdated(state, action) {
            const updated = action.payload.application;
            const applications = state.applications.map(a =>
                a._id === updated._id ? { ...a, ...updated } : a
            );
            return { ...state, loading: false, isUpdated: true, applications };
        },
        sellerFail(state, action) {
            return { ...state, loading: false, submitting: false, error: action.payload };
        },
        clearSellerState(state, action) {
            return { ...state, isSubmitted: false, isUpdated: false, error: null };
        }
    }
});

const { actions, reducer } = sellerSlice;

export const {
    sellerRequest,
    sellerSubmitRequest,
    sellerApplied,
    mySellerApplicationSuccess,
    sellerApplicationsSuccess,
    sellerApplicationUpdated,
    sellerFail,
    clearSellerState
} = actions;

export default reducer;
