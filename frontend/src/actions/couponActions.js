import {
    couponsRequest,
    couponsSuccess,
    couponCreated,
    couponUpdated,
    couponDeleted,
    clearCouponFlags,
    couponsFail
} from '../slices/couponSlice';
import axios from 'axios';

export const getCoupons = () => async (dispatch) => {
    try {
        dispatch(couponsRequest())
        const { data } = await axios.get(`/api/v1/admin/coupons`)
        dispatch(couponsSuccess(data))
    } catch (error) {
        dispatch(couponsFail(error.response?.data?.message || error.message))
    }
}

export const createCoupon = (formData) => async (dispatch) => {
    try {
        dispatch(couponsRequest())
        const { data } = await axios.post(`/api/v1/admin/coupon/new`, formData)
        dispatch(couponCreated(data))
        return { success: true }
    } catch (error) {
        dispatch(couponsFail(error.response?.data?.message || error.message))
        return { success: false, error: error.response?.data?.message || error.message }
    }
}

export const updateCoupon = (id, formData) => async (dispatch) => {
    try {
        dispatch(couponsRequest())
        const { data } = await axios.put(`/api/v1/admin/coupon/${id}`, formData)
        dispatch(couponUpdated(data))
        return { success: true }
    } catch (error) {
        dispatch(couponsFail(error.response?.data?.message || error.message))
        return { success: false, error: error.response?.data?.message || error.message }
    }
}

export const deleteCoupon = (id) => async (dispatch) => {
    try {
        dispatch(couponsRequest())
        await axios.delete(`/api/v1/admin/coupon/${id}`)
        dispatch(couponDeleted())
        return { success: true }
    } catch (error) {
        dispatch(couponsFail(error.response?.data?.message || error.message))
        return { success: false, error: error.response?.data?.message || error.message }
    }
}

export const clearCouponState = dispatch => {
    dispatch(clearCouponFlags())
}
