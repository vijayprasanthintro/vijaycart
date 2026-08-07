import { Fragment, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { deleteProduct, getAdminProducts } from '../../actions/productActions';
import { getCategories } from '../../actions/categoryActions';
import { clearError, clearProductDeleted } from '../../slices/productSlice';
import { toast } from 'react-toastify';
import { toINR } from './Charts';
import { productImage, imgOnError } from '../../utils/productHelper';

export default function ProductList() {
    const { products = [], loading = true, error } = useSelector(state => state.productsState);
    const { isProductDeleted, error: productError } = useSelector(state => state.productState);
    const { categories = [] } = useSelector(state => state.categoryState);
    const dispatch = useDispatch();

    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');

    useEffect(() => {
        dispatch(getAdminProducts);
        dispatch(getCategories());
    }, [dispatch]);

    useEffect(() => {
        if (error || productError) {
            toast(error || productError, { position: toast.POSITION.BOTTOM_CENTER, type: 'error', onOpen: () => dispatch(clearError()) });
            return;
        }
        if (isProductDeleted) {
            toast('Product deleted successfully!', { type: 'success', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearProductDeleted()) });
            return;
        }
    }, [dispatch, error, isProductDeleted, productError]);

    const filtered = useMemo(() => {
        let list = products;
        if (category) list = list.filter(p => p.category === category);
        if (query.trim()) {
            const q = query.trim().toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q) || (p.seller || '').toLowerCase().includes(q));
        }
        return list;
    }, [products, query, category]);

    const outOfStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;

    const deleteHandler = id => dispatch(deleteProduct(id));

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Products</h1>
                    <p>{products.length} total · {outOfStock} out of stock · {lowStock} low stock</p>
                </div>
                <Link to="/admin/products/create" className="ad-btn ad-btn--primary"><i className="fa fa-plus" aria-hidden="true"></i> New Product</Link>
            </div>

            <div className="ad-card">
                <div className="ad-card__head">
                    <div className="ad-toolbar">
                        <div className="ad-search">
                            <i className="fa fa-search" aria-hidden="true"></i>
                            <input placeholder="Search products…" value={query} onChange={e => setQuery(e.target.value)} />
                        </div>
                        <select className="ad-filter" value={category} onChange={e => setCategory(e.target.value)}>
                            <option value="">All categories</option>
                            {categories.map(c => (
                                <option key={c._id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="ad-card__body ad-card__body--flush">
                    {loading ? (
                        <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading products…</div>
                    ) : filtered.length === 0 ? (
                        <div className="ad-empty"><i className="fa fa-box-open" aria-hidden="true"></i><p>No products match your filters.</p></div>
                    ) : (
                        <div className="ad-table-wrap">
                            <table className="ad-table">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                        <th>Rating</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(product => (
                                        <tr key={product._id}>
                                            <td>
                                                {product.images && product.images[0] ? (
                                                    <img src={productImage(product)} alt={product.name} className="ad-avatar" style={{ width: 42, height: 42 }} onError={imgOnError} />
                                                ) : (
                                                    <span className="ad-avatar"><i className="fa fa-box" aria-hidden="true"></i></span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="ad-td-strong" style={{ maxWidth: 260 }}>{product.name}</div>
                                                <div className="ad-stat__label">{product.seller || ''}</div>
                                            </td>
                                            <td><span className="ad-chip"><i className="fa fa-th-large" aria-hidden="true"></i>{product.category}</span></td>
                                            <td><span className="ad-td-strong">{toINR(product.price)}</span></td>
                                            <td>
                                                <span className={`ad-badge ${product.stock === 0 ? 'ad-badge--danger' : product.stock <= 5 ? 'ad-badge--warning' : 'ad-badge--success'}`}>
                                                    {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="ad-td-strong"><i className="fa fa-star mr-1" style={{ color: '#e8a010' }} aria-hidden="true"></i>{product.ratings || 0}</span>
                                            </td>
                                            <td>
                                                <div className="ad-toolbar">
                                                    <Link to={`/admin/product/${product._id}`} className="ad-btn ad-btn--ghost ad-btn--sm" title="Edit"><i className="fa fa-pencil" aria-hidden="true"></i></Link>
                                                    <button type="button" className="ad-btn ad-btn--danger ad-btn--sm ad-btn--icon" title="Delete" onClick={() => deleteHandler(product._id)}>
                                                        <i className="fa fa-trash" aria-hidden="true"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Fragment>
    );
}
