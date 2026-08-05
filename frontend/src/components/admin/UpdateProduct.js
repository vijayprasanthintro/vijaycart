import { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from "react-router-dom";
import { getProduct, updateProduct } from "../../actions/productActions";
import { getCategories } from "../../actions/categoryActions";
import { clearError, clearProductUpdated } from "../../slices/productSlice";
import { toast } from "react-toastify";

export default function UpdateProduct() {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [stock, setStock] = useState(0);
    const [seller, setSeller] = useState("");
    const [images, setImages] = useState([]);
    const [imagesCleared, setImagesCleared] = useState(false);
    const [imagesPreview, setImagesPreview] = useState([]);

    const { id: productId } = useParams();
    const { loading, isProductUpdated, error, product } = useSelector(state => state.productState);
    const { categories = [] } = useSelector(state => state.categoryState);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(getCategories());
    }, [dispatch]);

    const onImagesChange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.readyState === 2) {
                    setImagesPreview(oldArray => [...oldArray, reader.result]);
                    setImages(oldArray => [...oldArray, file]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const submitHandler = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', name);
        formData.append('price', price);
        formData.append('stock', stock);
        formData.append('description', description);
        formData.append('seller', seller);
        formData.append('category', category);
        images.forEach(image => formData.append('images', image));
        formData.append('imagesCleared', imagesCleared);
        dispatch(updateProduct(productId, formData));
    };

    const clearImagesHandler = () => {
        setImages([]);
        setImagesPreview([]);
        setImagesCleared(true);
    };

    useEffect(() => {
        if (isProductUpdated) {
            toast('Product updated successfully!', { type: 'success', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearProductUpdated()) });
            setImages([]);
            return;
        }
        if (error) {
            toast(error, { type: 'error', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearError()) });
            return;
        }
        dispatch(getProduct(productId));
    }, [isProductUpdated, error, dispatch, productId]);

    useEffect(() => {
        if (product._id) {
            setName(product.name);
            setPrice(product.price);
            setStock(product.stock);
            setDescription(product.description);
            setSeller(product.seller);
            setCategory(product.category);
            const imgs = (product.images || []).map(img => img.image);
            setImagesPreview(imgs);
        }
    }, [product]);

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Update Product</h1>
                    <p>Edit product details &amp; stock</p>
                </div>
            </div>

            <div className="ad-card" style={{ maxWidth: 680 }}>
                <div className="ad-card__body">
                    <form className="ad-form" onSubmit={submitHandler} encType='multipart/form-data'>
                        <div className="ad-form--grid">
                            <div className="ad-field ad-field--full">
                                <label className="ad-label">Name *</label>
                                <input className="ad-input" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="ad-field">
                                <label className="ad-label">Price (₹) *</label>
                                <input className="ad-input" type="number" value={price} onChange={e => setPrice(e.target.value)} />
                            </div>
                            <div className="ad-field">
                                <label className="ad-label">Stock *</label>
                                <input className="ad-input" type="number" value={stock} onChange={e => setStock(e.target.value)} />
                            </div>
                            <div className="ad-field">
                                <label className="ad-label">Category *</label>
                                <select className="ad-select" value={category} onChange={e => setCategory(e.target.value)}>
                                    <option value="">Select</option>
                                    {categories.map(c => (
                                        <option key={c._id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="ad-field">
                                <label className="ad-label">Seller Name *</label>
                                <input className="ad-input" value={seller} onChange={e => setSeller(e.target.value)} />
                            </div>
                            <div className="ad-field ad-field--full">
                                <label className="ad-label">Description *</label>
                                <textarea className="ad-textarea" rows={6} value={description} onChange={e => setDescription(e.target.value)}></textarea>
                            </div>
                            <div className="ad-field ad-field--full">
                                <label className="ad-label">Images</label>
                                <input type="file" className="ad-input" multiple onChange={onImagesChange} />
                                <div className="ad-toolbar" style={{ marginTop: '0.6rem' }}>
                                    {imagesPreview.length > 0 && (
                                        <button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={clearImagesHandler}>
                                            <i className="fa fa-trash" aria-hidden="true"></i> Clear images
                                        </button>
                                    )}
                                    {imagesPreview.map(image => (
                                        <img key={image} src={image} alt="Preview" width="56" height="52" style={{ borderRadius: 8, objectFit: 'cover', border: '1px solid var(--ad-border)' }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="ad-modal__actions" style={{ marginTop: 0 }}>
                            <button type="submit" className="ad-btn ad-btn--primary" disabled={loading}>
                                {loading ? <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> : <i className="fa fa-save" aria-hidden="true"></i>}
                                Update Product
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Fragment>
    );
}
