import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import { productsFail, productsSuccess, productsRequest, adminProductsRequest, adminProductsSuccess, adminProductsFail } from '../slices/productsSlice';
import { productFail, productSuccess, productRequest, productNotFound, createReviewRequest, createReviewSuccess, createReviewFail, newProductRequest, newProductSuccess, newProductFail, deleteProductRequest, deleteProductSuccess, deleteProductFail, updateProductRequest, updateProductSuccess, updateProductFail, reviewsRequest, reviewsSuccess, reviewsFail, deleteReviewRequest, deleteReviewSuccess, deleteReviewFail } from '../slices/productSlice';

// API base: relative paths are used everywhere and resolved against the single
// API_BASE_URL from ../apiConfig (REACT_APP_API_URL in production). When it is
// unset the requests go to the same origin (CRA proxy in dev, Express static in
// prod), so we never build broken "undefined/api/..." URLs.
const API = API_BASE_URL;

// Small in-memory cache for the two hottest reads (product detail + listing).
// Prevents refetching the same product when navigating back to a detail page
// and dedupes the full-catalogue fetch shared by Home / Search / Detail.
const responseCache = new Map();
const GET_PRODUCT_TTL = 60 * 1000;   // 60s
const GET_PRODUCTS_TTL = 20 * 1000;  // 20s

// Dedupes concurrent getProduct calls for the same id (no duplicate requests
// when a component re-runs before the first one resolves).
const pendingGetProduct = new Set();

const cacheGet = (key) => {
    const hit = responseCache.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expires) {
        responseCache.delete(key);
        return null;
    }
    return hit.data;
};

const cacheSet = (key, data, ttl) => {
    if (responseCache.size >= 100) {
        const oldest = responseCache.keys().next().value;
        if (oldest !== undefined) responseCache.delete(oldest);
    }
    responseCache.set(key, { data, expires: Date.now() + ttl });
};

const cacheClear = (prefix) => {
    for (const key of responseCache.keys()) {
        if (key.startsWith(prefix)) responseCache.delete(key);
    }
};

const PRODUCT_DETAIL_PREFIX = `${API}/api/v1/product/`;
const PRODUCTS_LIST_PREFIX = `${API}/api/v1/products`;

export const getProducts = (keyword, price, category, rating, currentPage, limit) => async (dispatch) => {

    try {  
        let link = `${API}/api/v1/products?page=${currentPage}`
        
        if(keyword) {
            link += `&keyword=${keyword}`
        }
        if(price) {
            link += `&price[gte]=${price[0]}&price[lte]=${price[1]}`
        }
        if(category) {
            link += `&category=${category}`
        }
        if(rating) {
            link += `&ratings=${rating}`
        }
        if(limit) {
            link += `&limit=${limit}`
        }

        const cached = cacheGet(link);
        if (cached) {
            dispatch(productsSuccess(cached))
            return;
        }

        dispatch(productsRequest()) 
        const { data }  =  await axios.get(link);
        cacheSet(link, data, GET_PRODUCTS_TTL);
        dispatch(productsSuccess(data))
    } catch (error) {
        //handle error
        dispatch(productsFail(error?.response?.data?.message || error?.message || 'Something went wrong'))
    }
    
}
export const getTopRatedProducts = () => async (dispatch) => {
  try {
    dispatch(productsRequest())
    const { data } = await axios.get(
      `${API}/api/v1/products?ratings=4`
    );
    dispatch(productsSuccess(data))
  } catch (error) {
    dispatch(productsFail(error?.response?.data?.message || error?.message || 'Something went wrong'))
  }
}


export const getProduct = id => async (dispatch) => {

    const cacheKey = `${API}/api/v1/product/${id}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
        dispatch(productSuccess(cached))
        return;
    }
    // Prevent duplicate in-flight requests for the same product.
    if (pendingGetProduct.has(id)) return;

    pendingGetProduct.add(id);
    dispatch(productRequest())
    try {
        const { data }  =  await axios.get(cacheKey);
        cacheSet(cacheKey, data, GET_PRODUCT_TTL);
        dispatch(productSuccess(data))
    } catch (error) {
        const status = error?.response?.status;
        const msg = error?.response?.data?.message || error?.message || 'Something went wrong';
        if (status === 404 || (status === 400 && /not found/i.test(msg))) {
            dispatch(productNotFound())
        } else {
            dispatch(productFail(msg))
        }
    } finally {
        pendingGetProduct.delete(id);
    }

}

export const createReview = reviewData => async (dispatch) => {

    try {  
        dispatch(createReviewRequest()) 
        const config = {
            headers : {
                'Content-type': 'application/json'
            }
        }
        const { data }  =  await axios.put(`/api/v1/review`,reviewData, config);
        cacheClear(PRODUCT_DETAIL_PREFIX);
        dispatch(createReviewSuccess(data))
    } catch (error) {
        //handle error
        dispatch(createReviewFail(error?.response?.data?.message || error?.message || 'Something went wrong'))
    }
    
}

export const getAdminProducts  =  async (dispatch) => {

    try {  
        dispatch(adminProductsRequest()) 
        const { data }  =  await axios.get(`/api/v1/admin/products`);
        dispatch(adminProductsSuccess(data))
    } catch (error) {
        //handle error
        dispatch(adminProductsFail(error?.response?.data?.message || error?.message || 'Something went wrong'))
    }
    
}

export const createNewProduct  =  productData => async (dispatch) => {

    try {  
        dispatch(newProductRequest()) 
        const { data }  =  await axios.post(`/api/v1/admin/product/new`, productData);
        cacheClear(PRODUCT_DETAIL_PREFIX);
        cacheClear(PRODUCTS_LIST_PREFIX);
        dispatch(newProductSuccess(data))
    } catch (error) {
        //handle error
        dispatch(newProductFail(error?.response?.data?.message || error?.message || 'Something went wrong'))
    }
    
}

export const deleteProduct  =  id => async (dispatch) => {

    try {  
        dispatch(deleteProductRequest()) 
        await axios.delete(`/api/v1/admin/product/${id}`);
        cacheClear(PRODUCT_DETAIL_PREFIX);
        cacheClear(PRODUCTS_LIST_PREFIX);
        dispatch(deleteProductSuccess())
    } catch (error) {
        //handle error
        dispatch(deleteProductFail(error?.response?.data?.message || error?.message || 'Something went wrong'))
    }
    
}

export const updateProduct  =  (id, productData) => async (dispatch) => {

    try {  
        dispatch(updateProductRequest()) 
        const { data }  =  await axios.put(`/api/v1/admin/product/${id}`, productData);
        cacheClear(PRODUCT_DETAIL_PREFIX);
        cacheClear(PRODUCTS_LIST_PREFIX);
        dispatch(updateProductSuccess(data))
    } catch (error) {
        //handle error
        dispatch(updateProductFail(error?.response?.data?.message || error?.message || 'Something went wrong'))
    }
    
}


export const getReviews =  id => async (dispatch) => {

    try {  
        dispatch(reviewsRequest()) 
        const { data }  =  await axios.get(`/api/v1/admin/reviews`,{params: {id}});
        dispatch(reviewsSuccess(data))
    } catch (error) {
        //handle error
        dispatch(reviewsFail(error?.response?.data?.message || error?.message || 'Something went wrong'))
    }
    
}

export const deleteReview =  (productId, id) => async (dispatch) => {

    try {  
        dispatch(deleteReviewRequest()) 
        await axios.delete(`/api/v1/admin/review`,{params: {productId, id}});
        dispatch(deleteReviewSuccess())
    } catch (error) {
        //handle error
        dispatch(deleteReviewFail(error?.response?.data?.message || error?.message || 'Something went wrong'))
    }
    
}
