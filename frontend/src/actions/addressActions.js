import axios from 'axios';
import {
    fetchAddressesRequest,
    fetchAddressesSuccess,
    fetchAddressesFail,
    mutateRequest,
    mutateSuccess,
    mutateFail
} from '../slices/addressSlice';

// One-time carry-over for users who saved addresses before the address book
// moved to their account: if the server list is empty but the legacy
// localStorage book still has entries, push them up once and drop the local
// copy. Runs silently — a failure simply skips migration.
const migrateLegacyAddresses = async () => {
    try {
        const raw = localStorage.getItem('vijaycart_addresses');
        const list = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(list) || !list.length) return;
        for (const addr of list.slice(0, 10)) {
            await axios.post('/api/v1/myaddresses', { ...addr, isDefault: Boolean(addr.isDefault) });
        }
        localStorage.removeItem('vijaycart_addresses');
    } catch {
        /* best effort only */
    }
};

//Load the authenticated user's saved addresses - GET /api/v1/myaddresses.
//The backend resolves the user from the JWT cookie; no id is ever sent.
export const fetchAddresses = (options = {}) => async (dispatch) => {
    dispatch(fetchAddressesRequest());
    try {
        const { data } = await axios.get('/api/v1/myaddresses');
        let addresses = data?.addresses || [];
        if (!addresses.length && !options.skipMigration) {
            await migrateLegacyAddresses();
            const refetch = await axios.get('/api/v1/myaddresses');
            addresses = refetch.data?.addresses || [];
        }
        dispatch(fetchAddressesSuccess(addresses));
        return addresses;
    } catch {
        dispatch(fetchAddressesFail());
        return [];
    }
};

export const addAddress = (addressData) => async (dispatch) => {
    dispatch(mutateRequest());
    try {
        const { data } = await axios.post('/api/v1/myaddresses', addressData);
        dispatch(mutateSuccess(data.addresses));
        return data.addresses || [];
    } catch (error) {
        dispatch(mutateFail());
        throw error;
    }
};

export const updateAddress = (id, addressData) => async (dispatch) => {
    dispatch(mutateRequest());
    try {
        const { data } = await axios.put(`/api/v1/myaddresses/${id}`, addressData);
        dispatch(mutateSuccess(data.addresses));
        return data.addresses || [];
    } catch (error) {
        dispatch(mutateFail());
        throw error;
    }
};

export const deleteAddress = (id) => async (dispatch) => {
    dispatch(mutateRequest());
    try {
        const { data } = await axios.delete(`/api/v1/myaddresses/${id}`);
        dispatch(mutateSuccess(data.addresses));
        return data.addresses || [];
    } catch (error) {
        dispatch(mutateFail());
        throw error;
    }
};

export const setDefaultAddress = (id) => async (dispatch) => {
    dispatch(mutateRequest());
    try {
        const { data } = await axios.patch(`/api/v1/myaddresses/${id}/default`);
        dispatch(mutateSuccess(data.addresses));
        return data.addresses || [];
    } catch (error) {
        dispatch(mutateFail());
        throw error;
    }
};
