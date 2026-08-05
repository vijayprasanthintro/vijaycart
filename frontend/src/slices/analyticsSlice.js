import { createSlice } from "@reduxjs/toolkit";

const analyticsSlice = createSlice({
    name: 'analytics',
    initialState: {
        analytics: {},
        loading: false,
        error: null
    },
    reducers: {
        analyticsRequest(state, action) {
            return {
                ...state,
                loading: true,
                error: null
            }
        },
        analyticsSuccess(state, action) {
            return {
                ...state,
                loading: false,
                analytics: action.payload.analytics || {}
            }
        },
        analyticsFail(state, action) {
            return {
                ...state,
                loading: false,
                error: action.payload
            }
        }
    }
});

const { actions, reducer } = analyticsSlice;

export const {
    analyticsRequest,
    analyticsSuccess,
    analyticsFail
} = actions;

export default reducer;
