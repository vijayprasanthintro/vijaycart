import {
    categoriesRequest,
    categoriesSuccess,
    categoryCreated,
    categorySuccess,
    categoryDeleted,
    clearCategoryFlags,
    categoriesFail
} from '../slices/categorySlice';
import axios from 'axios';

export const getCategories = () => async (dispatch) => {
    try {
        dispatch(categoriesRequest())
        const { data } = await axios.get(`/api/v1/categories`)
        dispatch(categoriesSuccess(data))
    } catch (error) {
        dispatch(categoriesFail(error.response?.data?.message || error.message))
    }
}

export const createCategory = (formData) => async (dispatch) => {
    try {
        dispatch(categoriesRequest())
        const { data } = await axios.post(`/api/v1/admin/category/new`, formData)
        dispatch(categoryCreated(data))
        return { success: true }
    } catch (error) {
        dispatch(categoriesFail(error.response?.data?.message || error.message))
        return { success: false, error: error.response?.data?.message || error.message }
    }
}

export const updateCategory = (id, formData) => async (dispatch) => {
    try {
        dispatch(categoriesRequest())
        const { data } = await axios.put(`/api/v1/admin/category/${id}`, formData)
        dispatch(categorySuccess(data))
        return { success: true }
    } catch (error) {
        dispatch(categoriesFail(error.response?.data?.message || error.message))
        return { success: false, error: error.response?.data?.message || error.message }
    }
}

export const deleteCategory = (id) => async (dispatch) => {
    try {
        dispatch(categoriesRequest())
        await axios.delete(`/api/v1/admin/category/${id}`)
        dispatch(categoryDeleted())
        return { success: true }
    } catch (error) {
        dispatch(categoriesFail(error.response?.data?.message || error.message))
        return { success: false, error: error.response?.data?.message || error.message }
    }
}

export const clearCategoryState = dispatch => {
    dispatch(clearCategoryFlags())
}
