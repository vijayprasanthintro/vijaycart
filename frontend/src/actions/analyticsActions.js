import {
    analyticsRequest,
    analyticsSuccess,
    analyticsFail
} from '../slices/analyticsSlice';
import axios from 'axios';

export const getAnalytics = () => async (dispatch) => {
    try {
        dispatch(analyticsRequest())
        const { data } = await axios.get(`/api/v1/admin/analytics`)
        dispatch(analyticsSuccess(data))
    } catch (error) {
        dispatch(analyticsFail(error.response?.data?.message || error.message))
    }
}
