import axios from 'axios';
import {
    sellerRequest,
    sellerSubmitRequest,
    sellerApplied,
    mySellerApplicationSuccess,
    sellerApplicationsSuccess,
    sellerApplicationUpdated,
    sellerFail
} from '../slices/sellerSlice';

//Submit a "Become a Seller" application - POST /api/v1/seller/apply
export const applySeller = (sellerData) => async (dispatch) => {
    dispatch(sellerSubmitRequest());
    try {
        const { data } = await axios.post('/api/v1/seller/apply', sellerData);
        dispatch(sellerApplied(data));
        return data;
    } catch (error) {
        dispatch(sellerFail(error.response?.data?.message || error.message || 'Something went wrong'));
        throw error;
    }
};

//Fetch the current user's application status - GET /api/v1/seller/application
export const getMySellerApplication = () => async (dispatch) => {
    dispatch(sellerRequest());
    try {
        const { data } = await axios.get('/api/v1/seller/application');
        dispatch(mySellerApplicationSuccess(data));
    } catch (error) {
        dispatch(sellerFail(error.response?.data?.message || error.message || 'Something went wrong'));
    }
};

//Admin: list all seller applications - GET /api/v1/admin/seller-applications
export const getSellerApplications = () => async (dispatch) => {
    dispatch(sellerRequest());
    try {
        const { data } = await axios.get('/api/v1/admin/seller-applications');
        dispatch(sellerApplicationsSuccess(data));
    } catch (error) {
        dispatch(sellerFail(error.response?.data?.message || error.message || 'Something went wrong'));
    }
};

//Admin: approve/reject an application - PUT /api/v1/admin/seller-applications/:id
export const updateSellerApplication = (id, data) => async (dispatch) => {
    dispatch(sellerRequest());
    try {
        const { data: res } = await axios.put(`/api/v1/admin/seller-applications/${id}`, data);
        dispatch(sellerApplicationUpdated(res));
        return res;
    } catch (error) {
        dispatch(sellerFail(error.response?.data?.message || error.message || 'Something went wrong'));
        throw error;
    }
};
