import {
    loginFail,
    loginRequest, 
    loginSuccess, 
    clearError,
    otpRequest,
    otpRequestSuccess,
    otpRequestFail,
    loadUserRequest,
    loadUserSuccess,
    loadUserFail,
    logoutSuccess,
    updateProfileRequest,
    updateProfileSuccess,
    updateProfileFail
} from '../slices/authSlice';

import {
    usersRequest,
    usersSuccess,
    usersFail,
    userRequest,
    userSuccess,
    userFail,
    deleteUserRequest,
    deleteUserSuccess,
    deleteUserFail,
    updateUserRequest,
    updateUserSuccess,
    updateUserFail

} from '../slices/userSlice'
import axios from 'axios';

//Step 1: Request an OTP for a mobile number (or email for legacy accounts).
export const sendOtp = (payload) => async (dispatch) => {
    try {
        dispatch(otpRequest())
        const { data } = await axios.post(`/api/v1/otp/request`, payload);
        dispatch(otpRequestSuccess(data))
    } catch (error) {
        dispatch(otpRequestFail(error.response?.data?.message || error.message))
    }
}

//Step 2: Verify the OTP -> sets the auth cookie and logs the user in.
export const verifyOtp = (payload) => async (dispatch) => {

        try {
            dispatch(loginRequest())
            const { data }  = await axios.post(`/api/v1/otp/verify`,payload);
            dispatch(loginSuccess(data))
        } catch (error) {
            dispatch(loginFail(error.response?.data?.message || error.message))
        }

}

export const clearAuthError = dispatch => {
    dispatch(clearError())
}

export const loadUser = () => async (dispatch) => {

    try {
        dispatch(loadUserRequest())
       

        const { data }  = await axios.get(`/api/v1/myprofile`);
        dispatch(loadUserSuccess(data))
    } catch (error) {
        // Pass the HTTP status so the slice can distinguish a real auth
        // rejection (401/403) from a transient network/server error, and only
        // log the user out in the former case.
        dispatch(loadUserFail({
            message: error.response?.data?.message || error.message,
            status: error.response?.status
        }))
    }

}

export const logout = () => async (dispatch) => {

    try {
        await axios.get(`/api/v1/logout`);
    } catch (error) {
        // Best effort — clear the client session regardless.
    }
    dispatch(logoutSuccess())

}

export const updateProfile = (userData) => async (dispatch) => {

    try {
        dispatch(updateProfileRequest())
        const config = {
            headers: {
                'Content-type': 'multipart/form-data'
            }
        }

        const { data }  = await axios.put(`/api/v1/update`,userData, config);
        dispatch(updateProfileSuccess(data))
    } catch (error) {
        dispatch(updateProfileFail(error.response?.data?.message || error.message))
    }

}

export const getUsers =  async (dispatch) => {

    try {
        dispatch(usersRequest())
        const { data }  = await axios.get(`/api/v1/admin/users`);
        dispatch(usersSuccess(data))
    } catch (error) {
        dispatch(usersFail(error.response?.data?.message || error.message))
    }

}

export const getUser = id => async (dispatch) => {

    try {
        dispatch(userRequest())
        const { data }  = await axios.get(`/api/v1/admin/user/${id}`);
        dispatch(userSuccess(data))
    } catch (error) {
        dispatch(userFail(error.response?.data?.message || error.message))
    }

}

export const deleteUser = id => async (dispatch) => {

    try {
        dispatch(deleteUserRequest())
        await axios.delete(`/api/v1/admin/user/${id}`);
        dispatch(deleteUserSuccess())
    } catch (error) {
        dispatch(deleteUserFail(error.response?.data?.message || error.message))
    }

}

export const updateUser = (id, formData) => async (dispatch) => {

    try {
        dispatch(updateUserRequest())
        const config = {
            headers: {
                'Content-type': 'application/json'
            }
        }
        await axios.put(`/api/v1/admin/user/${id}`, formData, config);
        dispatch(updateUserSuccess())
    } catch (error) {
        dispatch(updateUserFail(error.response?.data?.message || error.message))
    }

}