import { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from "react-router-dom";
import { getProduct, updateProduct } from "../../actions/productActions";
import { getCategories } from "../../actions/categoryActions";
import { clearError, clearProductUpdated } from "../../slices/productSlice";
import { toast } from "react-toastify";
import { resolveProductImage } from "../../utils/productHelper";

const Section = ({ icon, title, children }) => (
    <div className="ad-form-section">
        <div className="ad-form-section__head"><i className={`fa ${icon}`} aria-hidden="true"></i>{title}</div>
        <div className="ad-form-section__body">{children}</div>
    </div>
);

const Err = ({ errors, field }) => errors[field] ? <div className="ad-form-error"><i className="fa fa-exclamation-circle" aria-hidden="true"></i> {errors[field]}</div> : null;

export default function UpdateProduct() {
    const [name, setName] = useState("");
    const [brand, setBrand] = useState("");
    const [price, setPrice] = useState("");
    const [mrp, setMrp] = useState("");
    const [discount, setDiscount] = useState(0);
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [stock, setStock] = useState(0);
    const [seller, setSeller] = useState("");
    const [specs, setSpecs] = useState([]);
    //Two separate lists: images already stored on the product (URLs) and files
    //picked in this session. Only the kept URLs are sent back, so the backend
    //never has to guess which gallery entries the admin removed.
    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [newPreviews, setNewPreviews] = useState([]);
    const [imagesCleared, setImagesCleared] = useState(false);
    const [errors, setErrors] = useState({});
    const [drag, setDrag] = useState(false);

    const { id: productId } = useParams();
    const { loading, isProductUpdated, error, product } = useSelector(state => state.productState);
    const { categories = [] } = useSelector(state => state.categoryState);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(getCategories());
    }, [dispatch]);

    const onImagesChange = (files) => {
        if (!files || !files.length) return;
        Array.from(files).forEach(file => {
            if (!file.type || !file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.readyState === 2) {
                    setNewPreviews(oldArray => [...oldArray, reader.result]);
                    setNewImages(oldArray => [...oldArray, file]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const validate = () => {
        const e = {};
        if (!name.trim()) e.name = 'Product name is required';
        if (!price || Number(price) <= 0) e.price = 'Enter a valid price';
        if (!description.trim()) e.description = 'Description is required';
        if (!category) e.category = 'Select a category';
        if (!seller.trim()) e.seller = 'Seller name is required';
        if (Number(stock) < 0) e.stock = 'Stock cannot be negative';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const submitHandler = (e) => {
        e.preventDefault();
        if (!validate()) {
            toast('Please fix the highlighted fields', { type: 'warning', position: toast.POSITION.BOTTOM_CENTER });
            return;
        }
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('price', price);
        formData.append('stock', stock);
        formData.append('description', description.trim());
        formData.append('seller', seller.trim());
        formData.append('category', category);
        if (brand.trim()) formData.append('brand', brand.trim());
        if (mrp) formData.append('mrp', mrp);
        if (discount) formData.append('discount', discount);
        const cleanSpecs = specs
            .filter(sp => sp.label.trim() || sp.value.trim())
            .map(sp => ({ label: sp.label.trim(), value: sp.value.trim() }));
        formData.append('specifications', JSON.stringify(cleanSpecs));
        newImages.forEach(image => formData.append('images', image));
        //Exact list of already-stored images to keep, in display order.
        formData.append('keptImages', JSON.stringify(existingImages));
        formData.append('imagesCleared', imagesCleared ? 'true' : 'false');
        dispatch(updateProduct(productId, formData));
    };

    const onSpecChange = (i, field, value) => {
        setSpecs(specs.map((sp, idx) => idx === i ? { ...sp, [field]: value } : sp));
    };
    const addSpec = () => setSpecs([...specs, { label: '', value: '' }]);
    const removeSpec = (i) => setSpecs(specs.filter((_, idx) => idx !== i));

    const clearImagesHandler = () => {
        setExistingImages([]);
        setNewImages([]);
        setNewPreviews([]);
        setImagesCleared(true);
    };

    const removeExistingImage = (url) => {
        setExistingImages(existingImages.filter(img => img !== url));
    };

    const removeNewImage = (i) => {
        setNewPreviews(newPreviews.filter((_, idx) => idx !== i));
        setNewImages(newImages.filter((_, idx) => idx !== i));
    };

    useEffect(() => {
        if (isProductUpdated) {
            toast('Product updated successfully!', { type: 'success', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearProductUpdated()) });
            setNewImages([]);
            setNewPreviews([]);
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
            setBrand(product.brand || "");
            setPrice(product.price);
            setMrp(product.mrp || "");
            setDiscount(product.discount || 0);
            setStock(product.stock);
            setDescription(product.description);
            setSeller(product.seller);
            setCategory(product.category);
            setSpecs((product.specifications && product.specifications.length
                ? product.specifications
                : [{ label: 'Model', value: '' }, { label: 'RAM', value: '' }, { label: 'Storage', value: '' }, { label: 'Color', value: '' }]
            ).map(sp => ({ label: sp.label || '', value: sp.value || '' })));
            const imgs = (product.images || []).map(img => img.image).filter(Boolean);
            setExistingImages(imgs);
            setNewImages([]);
            setNewPreviews([]);
            setImagesCleared(false);
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

            <form className="ad-form" onSubmit={submitHandler} encType='multipart/form-data' style={{ maxWidth: 860 }}>
                <Section icon="fa-info-circle" title="Basic Information">
                    <div className="ad-form--grid">
                        <div className="ad-field ad-field--full">
                            <label className="ad-label">Name *</label>
                            <input className="ad-input" value={name} onChange={e => setName(e.target.value)} />
                            <Err errors={errors} field="name" />
                        </div>
                        <div className="ad-field">
                            <label className="ad-label">Brand</label>
                            <input className="ad-input" value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Samsung, Apple" />
                        </div>
                        <div className="ad-field">
                            <label className="ad-label">Category *</label>
                            <select className="ad-select" value={category} onChange={e => setCategory(e.target.value)}>
                                <option value="">Select</option>
                                {categories.map(c => (
                                    <option key={c._id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                            <Err errors={errors} field="category" />
                        </div>
                    </div>
                </Section>

                <Section icon="fa-tags" title="Pricing & Inventory">
                    <div className="ad-form--grid">
                        <div className="ad-field">
                            <label className="ad-label">Selling Price (₹) *</label>
                            <input className="ad-input" type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} />
                            <Err errors={errors} field="price" />
                        </div>
                        <div className="ad-field">
                            <label className="ad-label">Original Price / MRP (₹)</label>
                            <input className="ad-input" type="number" min="0" value={mrp} onChange={e => setMrp(e.target.value)} />
                        </div>
                        <div className="ad-field">
                            <label className="ad-label">Discount (%)</label>
                            <input className="ad-input" type="number" min="0" max="95" value={discount} onChange={e => setDiscount(e.target.value)} />
                        </div>
                        <div className="ad-field">
                            <label className="ad-label">Stock *</label>
                            <input className="ad-input" type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} />
                            <Err errors={errors} field="stock" />
                        </div>
                        <div className="ad-field ad-field--full">
                            <label className="ad-label">Seller Name *</label>
                            <input className="ad-input" value={seller} onChange={e => setSeller(e.target.value)} />
                            <Err errors={errors} field="seller" />
                        </div>
                    </div>
                </Section>

                <Section icon="fa-list-alt" title="Specifications">
                    <div className="ad-specs">
                        {specs.map((sp, i) => (
                            <div className="ad-specs__row" key={i}>
                                <input className="ad-input" placeholder="Label (e.g. RAM)" value={sp.label} onChange={e => onSpecChange(i, 'label', e.target.value)} />
                                <input className="ad-input" placeholder="Value (e.g. 8 GB)" value={sp.value} onChange={e => onSpecChange(i, 'value', e.target.value)} />
                                <button type="button" className="ad-btn ad-btn--danger ad-btn--sm ad-btn--icon" onClick={() => removeSpec(i)} title="Remove" disabled={specs.length <= 1}>
                                    <i className="fa fa-trash" aria-hidden="true"></i>
                                </button>
                            </div>
                        ))}
                        <button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={addSpec} style={{ alignSelf: 'flex-start' }}>
                            <i className="fa fa-plus" aria-hidden="true"></i> Add spec
                        </button>
                    </div>
                </Section>

                <Section icon="fa-image" title="Images">
                    <label
                        className={`ad-upload__drop ${drag ? 'ad-upload__drop--drag' : ''}`}
                        onDragOver={e => { e.preventDefault(); setDrag(true); }}
                        onDragLeave={() => setDrag(false)}
                        onDrop={e => { e.preventDefault(); setDrag(false); onImagesChange(e.dataTransfer.files); }}
                    >
                        <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => onImagesChange(e.target.files)} />
                        <i className="fa fa-cloud-upload" aria-hidden="true"></i>
                        <b>Drop images here or click to browse</b>
                        <span>PNG, JPG, WebP — first image is the product thumbnail</span>
                    </label>
                    {(existingImages.length > 0 || newPreviews.length > 0) && (
                        <div className="ad-upload__preview">
                            {existingImages.map((image, i) => (
                                <span className="ad-thumb" key={`existing-${image}-${i}`}>
                                    <img src={resolveProductImage(image)} alt={name || ''} />
                                    {i === 0 && <span className="ad-thumb__badge">Primary</span>}
                                    <button type="button" className="ad-thumb__remove" onClick={() => removeExistingImage(image)} title="Remove">
                                        <i className="fa fa-times" aria-hidden="true"></i>
                                    </button>
                                </span>
                            ))}
                            {newPreviews.map((image, i) => (
                                <span className="ad-thumb" key={`new-${i}`}>
                                    <img src={image} alt="New upload preview" />
                                    {existingImages.length === 0 && i === 0 && <span className="ad-thumb__badge">Primary</span>}
                                    <button type="button" className="ad-thumb__remove" onClick={() => removeNewImage(i)} title="Remove">
                                        <i className="fa fa-times" aria-hidden="true"></i>
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                    {(existingImages.length > 0 || newPreviews.length > 0) && (
                        <div className="ad-upload__actions">
                            <button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={clearImagesHandler}>
                                <i className="fa fa-trash" aria-hidden="true"></i> Clear all images
                            </button>
                        </div>
                    )}
                </Section>

                <Section icon="fa-align-left" title="Description">
                    <div className="ad-field">
                        <textarea className="ad-textarea" rows={6} value={description} onChange={e => setDescription(e.target.value)}></textarea>
                        <Err errors={errors} field="description" />
                    </div>
                </Section>

                <div className="ad-settings-savebar">
                    <span className="ad-settings-savebar__hint"><i className="fa fa-info-circle" aria-hidden="true"></i> Required fields are marked with *</span>
                    <button type="button" className="ad-btn ad-btn--ghost" onClick={() => navigate('/admin/products')}>Cancel</button>
                    <button type="submit" className="ad-btn ad-btn--primary" disabled={loading}>
                        {loading ? <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> : <i className="fa fa-save" aria-hidden="true"></i>}
                        Update Product
                    </button>
                </div>
            </form>
        </Fragment>
    );
}
