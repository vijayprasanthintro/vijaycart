import { createSlice } from "@reduxjs/toolkit";

const couponSlice = createSlice({
    name: 'coupon',
    initialState: {
        coupons: [],
        loading: false,
        error: null,
        isCreated: false,
        isUpdated: false,
        isDeleted: false
    },
    reducers: {
        couponsRequest(state, action) {
            return {
                ...state,
                loading: true,
                error: null
            }
        },
        couponsSuccess(state, action) {
            return {
                ...state,
                loading: false,
                coupons: action.payload.coupons || []
            }
        },
        couponUpdated(state, action) {
            return {
                ...state,
                loading: false,
                isCreated: false,
                isUpdated: true
            }
        },
        couponCreated(state, action) {
            return {
                ...state,
                loading: false,
                isCreated: true,
                isUpdated: false
            }
        },
        couponDeleted(state, action) {
            return {
                ...state,
                loading: false,
                isDeleted: true
            }
        },
        clearCouponFlags(state, action) {
            return {
                ...state,
                isCreated: false,
                isUpdated: false,
                isDeleted: false,
                error: null
            }
        },
        couponsFail(state, action) {
            return {
                ...state,
                loading: false,
                error: action.payload
            }
        }
    }
});

const { actions, reducer } = couponSlice;

export const {
    couponsRequest,
    couponsSuccess,
    couponUpdated,
    couponCreated,
    couponDeleted,
    clearCouponFlags,
    couponsFail
} = actions;

export default reducer;
