import {
    settingsRequest,
    settingsSuccess,
    settingsUpdated,
    clearSettingsUpdated,
    settingsFail
} from '../slices/settingSlice';
import axios from 'axios';
import { cacheDesign } from '../designs/designUtils';

/**
 * Keep the first-paint cache in sync with every settings/design response.
 * Writing it here (rather than only in ThemeProvider) means the admin tab
 * updates the shared cache the instant a save/apply succeeds, which also
 * notifies any open storefront tab through the storage event.
 */
const cacheDesignFromResponse = (data) => {
    const design = data?.settings?.design;
    if (design?.designId && design?.tokens) {
        cacheDesign(design.designId, design.tokens);
    }
};

export const getSettings = () => async (dispatch) => {
    try {
        dispatch(settingsRequest())
        // Cache-buster: theme must never be served from a stale browser cache.
        const { data } = await axios.get(`/api/v1/settings`, { params: { _: Date.now() } })
        cacheDesignFromResponse(data);
        dispatch(settingsSuccess(data))
    } catch (error) {
        dispatch(settingsFail(error.response?.data?.message || error.message))
    }
}

export const updateSettings = (formData) => async (dispatch) => {
    try {
        dispatch(settingsRequest())
        const { data } = await axios.put(`/api/v1/admin/settings`, formData)
        cacheDesignFromResponse(data);
        dispatch(settingsUpdated(data))
        return { success: true }
    } catch (error) {
        dispatch(settingsFail(error.response?.data?.message || error.message))
        return { success: false, error: error.response?.data?.message || error.message }
    }
}

export const clearSettingsState = () => async (dispatch) => {
    dispatch(clearSettingsUpdated())
}

/* ------------------------------------------------------------------ */
/* Website Design Studio                                               */
/* ------------------------------------------------------------------ */

const designError = (error) => error.response?.data?.message || error.message || 'Something went wrong';

/** Public catalog of the 10 designs (no auth required). */
export const getDesigns = () => async () => {
    try {
        const { data } = await axios.get('/api/v1/designs', { params: { _: Date.now() } });
        return {
            success: true,
            designs: data.designs || [],
            defaultDesignId: data.defaultDesignId || 'emox-premium'
        };
    } catch (error) {
        return { success: false, error: designError(error), designs: [] };
    }
}

/** Apply a design to the live storefront and refresh global settings. */
export const applyDesign = (designId, customization) => async (dispatch) => {
    try {
        dispatch(settingsRequest())
        const { data } = await axios.put('/api/v1/admin/designs/apply', { designId, customization })
        cacheDesignFromResponse(data);
        dispatch(settingsUpdated(data))
        return { success: true, settings: data.settings, message: data.message }
    } catch (error) {
        const message = designError(error)
        dispatch(settingsFail(message))
        return { success: false, error: message }
    }
}

/** Persist customisation for the live design (keeps the reset target). */
export const saveDesign = (designId, customization) => async (dispatch) => {
    try {
        dispatch(settingsRequest())
        const { data } = await axios.put('/api/v1/admin/designs/save', { designId, customization })
        cacheDesignFromResponse(data);
        dispatch(settingsUpdated(data))
        return { success: true, settings: data.settings, message: data.message }
    } catch (error) {
        const message = designError(error)
        dispatch(settingsFail(message))
        return { success: false, error: message }
    }
}

/** Restore the design that was live before the last apply/save. */
export const resetDesign = () => async (dispatch) => {
    try {
        dispatch(settingsRequest())
        const { data } = await axios.post('/api/v1/admin/designs/reset')
        cacheDesignFromResponse(data);
        dispatch(settingsUpdated(data))
        return { success: true, settings: data.settings, message: data.message }
    } catch (error) {
        const message = designError(error)
        dispatch(settingsFail(message))
        return { success: false, error: message }
    }
}
