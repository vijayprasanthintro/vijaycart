import {
    assignedOrdersSuccess,
    deliveryBoysSuccess,
    deliveryFail,
    deliveryRequest,
    historySuccess,
    todayOrdersSuccess,
    updateDeliverySuccess
} from '../slices/deliverySlice';
import axios from 'axios';

export const getAssignedOrders = () => async (dispatch) => {
    try {
        dispatch(deliveryRequest())
        const { data } = await axios.get(`/api/v1/delivery/orders`)
        dispatch(assignedOrdersSuccess(data))
    } catch (error) {
        dispatch(deliveryFail(error.response?.data?.message || error.message))
    }
}

export const getTodayOrders = () => async (dispatch) => {
    try {
        dispatch(deliveryRequest())
        const { data } = await axios.get(`/api/v1/delivery/orders/today`)
        dispatch(todayOrdersSuccess(data))
    } catch (error) {
        dispatch(deliveryFail(error.response?.data?.message || error.message))
    }
}

export const getDeliveryHistory = () => async (dispatch) => {
    try {
        dispatch(deliveryRequest())
        const { data } = await axios.get(`/api/v1/delivery/history`)
        dispatch(historySuccess(data))
    } catch (error) {
        dispatch(deliveryFail(error.response?.data?.message || error.message))
    }
}

export const updateDeliveryStatus = (id, orderData) => async (dispatch) => {
    dispatch(deliveryRequest())
    try {
        const { data } = await axios.put(`/api/v1/delivery/order/${id}/status`, orderData)
        dispatch(updateDeliverySuccess(data))
        return { success: true }
    } catch (error) {
        dispatch(deliveryFail(error.response?.data?.message || error.message))
        return { success: false, error: error.response?.data?.message || error.message }
    }
}

export const getDeliveryBoys = () => async (dispatch) => {
    try {
        dispatch(deliveryRequest())
        const { data } = await axios.get(`/api/v1/admin/deliveryboys`)
        dispatch(deliveryBoysSuccess(data))
    } catch (error) {
        dispatch(deliveryFail(error.response?.data?.message || error.message))
    }
}

export const assignOrder = (id, deliveryBoy) => async (dispatch) => {
    dispatch(deliveryRequest())
    try {
        await axios.put(`/api/v1/admin/order/${id}/assign`, { deliveryBoy })
        dispatch(updateDeliverySuccess())
        return { success: true }
    } catch (error) {
        dispatch(deliveryFail(error.response?.data?.message || error.message))
        return { success: false, error: error.response?.data?.message || error.message }
    }
}
