import { createSlice } from "@reduxjs/toolkit";

const categorySlice = createSlice({
    name: 'category',
    initialState: {
        categories: [],
        loading: false,
        error: null,
        isCreated: false,
        isUpdated: false,
        isDeleted: false
    },
    reducers: {
        categoriesRequest(state, action) {
            return {
                ...state,
                loading: true,
                error: null
            }
        },
        categoriesSuccess(state, action) {
            return {
                ...state,
                loading: false,
                categories: action.payload.categories || []
            }
        },
        categorySuccess(state, action) {
            return {
                ...state,
                loading: false,
                isCreated: false,
                isUpdated: true
            }
        },
        categoryCreated(state, action) {
            return {
                ...state,
                loading: false,
                isCreated: true,
                isUpdated: false
            }
        },
        categoryDeleted(state, action) {
            return {
                ...state,
                loading: false,
                isDeleted: true
            }
        },
        clearCategoryFlags(state, action) {
            return {
                ...state,
                isCreated: false,
                isUpdated: false,
                isDeleted: false,
                error: null
            }
        },
        categoriesFail(state, action) {
            return {
                ...state,
                loading: false,
                error: action.payload
            }
        }
    }
});

const { actions, reducer } = categorySlice;

export const {
    categoriesRequest,
    categoriesSuccess,
    categorySuccess,
    categoryCreated,
    categoryDeleted,
    clearCategoryFlags,
    categoriesFail
} = actions;

export default reducer;
