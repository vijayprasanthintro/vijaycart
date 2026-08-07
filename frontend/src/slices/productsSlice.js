import { createSlice } from "@reduxjs/toolkit";


const productsSlice = createSlice({
    name: 'products',
    initialState: {
        loading: false
    },
    reducers: {
        productsRequest(state, action){
            return {
                loading: true
            }
        },
        productsSuccess(state, action){
            const p = action.payload || {};
            return {
                loading: false,
                products: p.products || [],
                productsCount: p.count || 0,
                resPerPage : p.resPerPage || 0
            }
        },
        productsFail(state, action){
            return {
                loading: false,
                error:  action.payload
            }
        },
        adminProductsRequest(state, action){
            return {
                loading: true
            }
        },
        adminProductsSuccess(state, action){
            const p = action.payload || {};
            return {
                loading: false,
                products: p.products || [],
            }
        },
        adminProductsFail(state, action){
            return {
                loading: false,
                error:  action.payload
            }
        },
        clearError(state, action){
            return {
                ...state,
                error:  null
            }
        }
    }
});

const { actions, reducer } = productsSlice;

export const { 
    productsRequest, 
    productsSuccess, 
    productsFail,
    adminProductsFail,
    adminProductsRequest,
    adminProductsSuccess

} = actions;

export default reducer;

