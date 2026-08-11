import {
    bannerRequest,
    publicBannersSuccess,
    adminBannersSuccess,
    bannerSaveRequest,
    bannerCreated,
    bannerUpdated,
    bannerDeleted,
    bannersReordered,
    bannerFail
} from '../slices/bannerSlice';
import axios from 'axios';

//Public: active homepage banners
export const getBanners = () => async (dispatch) => {
    try {
        dispatch(bannerRequest());
        const { data } = await axios.get(`/api/v1/banners`);
        dispatch(publicBannersSuccess(data));
    } catch (error) {
        dispatch(bannerFail(error.response?.data?.message || error.message));
    }
}

//Admin: all banners
export const getAdminBanners = () => async (dispatch) => {
    try {
        dispatch(bannerRequest());
        const { data } = await axios.get(`/api/v1/admin/banners`);
        dispatch(adminBannersSuccess(data));
    } catch (error) {
        dispatch(bannerFail(error.response?.data?.message || error.message));
    }
}

export const createBanner = (formData) => async (dispatch) => {
    try {
        dispatch(bannerSaveRequest());
        const { data } = await axios.post(`/api/v1/admin/banner/new`, formData);
        dispatch(bannerCreated(data));
        return { success: true };
    } catch (error) {
        dispatch(bannerFail(error.response?.data?.message || error.message));
        return { success: false, error: error.response?.data?.message || error.message };
    }
}

export const updateBanner = (id, formData) => async (dispatch) => {
    try {
        dispatch(bannerSaveRequest());
        const { data } = await axios.put(`/api/v1/admin/banner/${id}`, formData);
        dispatch(bannerUpdated(data));
        return { success: true };
    } catch (error) {
        dispatch(bannerFail(error.response?.data?.message || error.message));
        return { success: false, error: error.response?.data?.message || error.message };
    }
}

export const deleteBanner = (id) => async (dispatch) => {
    try {
        dispatch(bannerSaveRequest());
        await axios.delete(`/api/v1/admin/banner/${id}`);
        dispatch(bannerDeleted({ id }));
        return { success: true };
    } catch (error) {
        dispatch(bannerFail(error.response?.data?.message || error.message));
        return { success: false, error: error.response?.data?.message || error.message };
    }
}

export const reorderBanners = (order) => async (dispatch) => {
    try {
        dispatch(bannerSaveRequest());
        const { data } = await axios.put(`/api/v1/admin/banners/reorder`, { order });
        dispatch(bannersReordered(data));
        return { success: true };
    } catch (error) {
        dispatch(bannerFail(error.response?.data?.message || error.message));
        return { success: false, error: error.response?.data?.message || error.message };
    }
}
