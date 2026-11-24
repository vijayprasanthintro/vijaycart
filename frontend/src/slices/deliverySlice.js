import { createSlice } from "@reduxjs/toolkit";

const deliverySlice = createSlice({
    name: 'delivery',
    initialState: {
        assignedOrders: [],
        todayOrders: [],
        historyOrders: [],
        deliveryBoys: [],
        loading: false,
        error: null,
        isUpdated: false
    },
    reducers: {
        deliveryRequest(state, action) {
            return {
                ...state,
                loading: true,
                error: null
            }
        },
        deliverySuccess(state, action) {
            return {
                ...state,
                loading: false
            }
        },
        assignedOrdersSuccess(state, action) {
            return {
                ...state,
                loading: false,
                assignedOrders: action.payload.orders || []
            }
        },
        todayOrdersSuccess(state, action) {
            return {
                ...state,
                loading: false,
                todayOrders: action.payload.orders || []
            }
        },
        historySuccess(state, action) {
            return {
                ...state,
                loading: false,
                historyOrders: action.payload.orders || []
            }
        },
        deliveryBoysSuccess(state, action) {
            return {
                ...state,
                loading: false,
                deliveryBoys: action.payload.deliveryBoys || []
            }
        },
        updateDeliverySuccess(state, action) {
            return {
                ...state,
                loading: false,
                isUpdated: true,
                error: null
            }
        },
        clearUpdateDelivery(state, action) {
            return {
                ...state,
                isUpdated: false
            }
        },
        removeDeliveryBoy(state, action) {
            const id = action.payload;
            return {
                ...state,
                loading: false,
                deliveryBoys: state.deliveryBoys.filter(b => b._id !== id)
            }
        },
        deliveryFail(state, action) {
            return {
                ...state,
                loading: false,
                error: action.payload
            }
        }
    }
});

const { actions, reducer } = deliverySlice;

export const {
    deliveryRequest,
    deliverySuccess,
    assignedOrdersSuccess,
    todayOrdersSuccess,
    historySuccess,
    deliveryBoysSuccess,
    updateDeliverySuccess,
    clearUpdateDelivery,
    removeDeliveryBoy,
    deliveryFail
} = actions;

export default reducer;
