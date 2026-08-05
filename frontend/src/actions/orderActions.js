import {adminOrdersFail, adminOrdersRequest, adminOrdersSuccess, cancelOrderFail, cancelOrderRequest, cancelOrderSuccess, createOrderFail, createOrderRequest, createOrderSuccess, deleteOrderFail, deleteOrderRequest, deleteOrderSuccess, orderDetailFail, orderDetailRequest, orderDetailSuccess, returnOrderFail, returnOrderRequest, returnOrderSuccess, updateOrderFail, updateOrderRequest, updateOrderSuccess, userOrdersFail, userOrdersRequest, userOrdersSuccess } from '../slices/orderSlice';
import axios from 'axios';

export const requestReturn = (id, data) => async(dispatch) => {
    dispatch(returnOrderRequest())
    try {
        const { data: res } = await axios.put(`/api/v1/order/return/${id}`, data)
        dispatch(returnOrderSuccess(res))
        return { success: true }
    } catch (error) {
        dispatch(returnOrderFail(error.response?.data?.message || error.message))
        return { success: false, error: error.response?.data?.message || error.message }
    }
}

export const cancelOrder = id => async(dispatch) => {
    dispatch(cancelOrderRequest())
    try {
        await axios.put(`/api/v1/order/cancel/${id}`)
        dispatch(cancelOrderSuccess())
        dispatch(userOrders)
        return { success: true }
    } catch (error) {
        dispatch(cancelOrderFail(error.response?.data?.message || error.message))
        return { success: false, error: error.response?.data?.message || error.message }
    }
}

export const createOrder = order => async(dispatch) => {
    try {
       dispatch(createOrderRequest())
       const {data} = await axios.post(`/api/v1/order/new`, order)
       dispatch(createOrderSuccess(data))
    } catch (error) {
        dispatch(createOrderFail(error.response?.data?.message || error.message))
        throw error
    }
}
export const userOrders = async(dispatch) => {
    try {
       dispatch(userOrdersRequest())
       const {data} = await axios.get(`/api/v1/myorders`)
       dispatch(userOrdersSuccess(data))
    } catch (error) {
        dispatch(userOrdersFail(error.response.data.message))
    }
}
export const orderDetail = id => async(dispatch) => {
    try {
       dispatch(orderDetailRequest())
       const {data} = await axios.get(`/api/v1/order/${id}`)
       dispatch(orderDetailSuccess(data))
    } catch (error) {
        dispatch(orderDetailFail(error.response.data.message))
    }
}

export const adminOrders = async(dispatch) => {
    try {
       dispatch(adminOrdersRequest())
       const {data} = await axios.get(`/api/v1/admin/orders`)
       dispatch(adminOrdersSuccess(data))
    } catch (error) {
        dispatch(adminOrdersFail(error.response.data.message))
    }
}

export const deleteOrder = id => async(dispatch) => {
    try {
       dispatch(deleteOrderRequest())
       await axios.delete(`/api/v1/admin/order/${id}`)
       dispatch(deleteOrderSuccess())
    } catch (error) {
       dispatch(deleteOrderFail(error.response.data.message))
    }
}

export const updateOrder = (id, orderData)  => async(dispatch) => {
    try {
       dispatch(updateOrderRequest())
       const { data} = await axios.put(`/api/v1/admin/order/${id}`, orderData)
       dispatch(updateOrderSuccess(data))
    } catch (error) {
       dispatch(updateOrderFail(error.response.data.message))
    }
}