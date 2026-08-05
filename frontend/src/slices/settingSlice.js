import { createSlice } from "@reduxjs/toolkit";

const settingSlice = createSlice({
    name: 'setting',
    initialState: {
        settings: {},
        loading: false,
        error: null,
        isUpdated: false
    },
    reducers: {
        settingsRequest(state, action) {
            return {
                ...state,
                loading: true,
                error: null
            }
        },
        settingsSuccess(state, action) {
            return {
                ...state,
                loading: false,
                settings: action.payload.settings || {}
            }
        },
        settingsUpdated(state, action) {
            return {
                ...state,
                loading: false,
                isUpdated: true,
                settings: action.payload.settings || state.settings
            }
        },
        clearSettingsUpdated(state, action) {
            return {
                ...state,
                isUpdated: false
            }
        },
        settingsFail(state, action) {
            return {
                ...state,
                loading: false,
                error: action.payload
            }
        }
    }
});

const { actions, reducer } = settingSlice;

export const {
    settingsRequest,
    settingsSuccess,
    settingsUpdated,
    clearSettingsUpdated,
    settingsFail
} = actions;

export default reducer;
