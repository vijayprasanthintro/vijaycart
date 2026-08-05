import {
    settingsRequest,
    settingsSuccess,
    settingsUpdated,
    clearSettingsUpdated,
    settingsFail
} from '../slices/settingSlice';
import axios from 'axios';

export const getSettings = () => async (dispatch) => {
    try {
        dispatch(settingsRequest())
        const { data } = await axios.get(`/api/v1/settings`)
        dispatch(settingsSuccess(data))
    } catch (error) {
        dispatch(settingsFail(error.response?.data?.message || error.message))
    }
}

export const updateSettings = (formData) => async (dispatch) => {
    try {
        dispatch(settingsRequest())
        const { data } = await axios.put(`/api/v1/admin/settings`, formData)
        dispatch(settingsUpdated(data))
        return { success: true }
    } catch (error) {
        dispatch(settingsFail(error.response?.data?.message || error.message))
        return { success: false, error: error.response?.data?.message || error.message }
    }
}

export const clearSettingsState = dispatch => {
    dispatch(clearSettingsUpdated())
}
