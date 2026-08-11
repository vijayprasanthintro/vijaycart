import { Fragment, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { deleteProduct, getAdminProducts, bulkDeleteProducts, bulkUpdateStock } from '../../actions/productActions';
import { getCategories } from '../../actions/categoryActions';
import { clearError, clearProductDeleted } from '../../slices/productSlice';
import { toast } from 'react-toastify';
import { toINR } from './Charts';
import { productImage, imgOnError } from '../../utils/productHelper';
import AdminPagination from './AdminPagination';
import AdminExport from './AdminExport';

export default function ProductList() {
    const { products = [], loading = true, error } = useSelector(state => state.productsState);
    const { isProductDeleted, error: productError } = useSelector(state => state.productState);
    const { categories = [] } = useSelector(state => state.categoryState);
    const { analytics } = useSelector(state => state.analyticsState);
    const dispatch = useDispatch();

    const lowStockThreshold = analytics.lowStockThreshold || 5;

    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState(() => new Set());
    const [bulkStock, setBulkStock] = useState('');
    const PER_PAGE = 10;

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

    useEffect(() => { setPage(1); }, [query, category]);

    const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const exportHeaders = [
        { label: 'Name', key: 'name' },
        { label: 'Category', key: 'category' },
        { label: 'Seller', key: 'seller' },
        { label: 'Price', key: 'price', type: 'number' },
        { label: 'Stock', key: 'stock', type: 'number' },
        { label: 'Rating', key: 'ratings', type: 'number' },
        { label: 'Reviews', key: 'numOfReviews', type: 'number' }
    ];
    const exportRows = filtered.map(p => ({
        name: p.name,
        category: p.category,
        seller: p.seller || '',
        price: p.price,
        stock: p.stock,
        ratings: p.ratings || 0,
        numOfReviews: p.numOfReviews || 0
    }));

    const outOfStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= lowStockThreshold).length;

    const deleteHandler = id => dispatch(deleteProduct(id));

    const toggleSelect = id => setSelected(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });

    const allChecked = pageItems.length > 0 && pageItems.every(p => selected.has(p._id));

    const toggleSelectAll = () => setSelected(prev => {
        const next = new Set(prev);
        if (allChecked) pageItems.forEach(p => next.delete(p._id));
        else pageItems.forEach(p => next.add(p._id));
        return next;
    });

    const clearSelection = () => setSelected(new Set());

    const bulkDeleteHandler = async () => {
        const ids = Array.from(selected);
        if (!ids.length) return;
        if (!window.confirm(`Delete ${ids.length} product${ids.length === 1 ? '' : 's'}? This cannot be undone.`)) return;
        const res = await dispatch(bulkDeleteProducts(ids));
        if (res && res.success) {
            toast(`${res.deleted} product${res.deleted === 1 ? '' : 's'} deleted`, { type: 'success', position: toast.POSITION.BOTTOM_CENTER });
            dispatch(getAdminProducts);
            clearSelection();
        } else {
            toast(res?.error || 'Delete failed', { type: 'error', position: toast.POSITION.BOTTOM_CENTER });
        }
    };

    const bulkStockHandler = async () => {
        const ids = Array.from(selected);
        const stock = Math.max(0, Math.floor(Number(bulkStock)));
        if (!ids.length || !Number.isFinite(stock)) return;
        const res = await dispatch(bulkUpdateStock(ids.map(id => ({ id, stock }))));
        if (res && res.success) {
            toast(`Stock updated for ${res.updated} product${res.updated === 1 ? '' : 's'}`, { type: 'success', position: toast.POSITION.BOTTOM_CENTER });
            dispatch(getAdminProducts);
            clearSelection();
            setBulkStock('');
        } else {
            toast(res?.error || 'Stock update failed', { type: 'error', position: toast.POSITION.BOTTOM_CENTER });
        }
    };

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Products</h1>
                    <p>{products.length} total · {outOfStock} out of stock · {lowStock} low stock</p>
                </div>
                <div className="ad-toolbar">
                    <AdminExport filename="products" headers={exportHeaders} rows={exportRows} />
                    <Link to="/admin/products/create" className="ad-btn ad-btn--primary"><i className="fa fa-plus" aria-hidden="true"></i> New Product</Link>
                </div>
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
                {selected.size > 0 && (
                    <div className="ad-bulk-bar">
                        <span className="ad-bulk-bar__count"><i className="fa fa-check-square-o" aria-hidden="true"></i> {selected.size} selected</span>
                        <div className="ad-bulk-bar__stock">
                            <input className="ad-input ad-input--sm" type="number" min="0" placeholder="New stock" value={bulkStock} onChange={e => setBulkStock(e.target.value)} aria-label="Set stock for selected products" />
                            <button type="button" className="ad-btn ad-btn--soft ad-btn--sm" onClick={bulkStockHandler}><i className="fa fa-boxes" aria-hidden="true"></i> Set Stock</button>
                        </div>
                        <button type="button" className="ad-btn ad-btn--danger ad-btn--sm" onClick={bulkDeleteHandler}><i className="fa fa-trash" aria-hidden="true"></i> Delete</button>
                        <button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={clearSelection}>Clear</button>
                    </div>
                )}
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
                                        <th className="ad-th-check">
                                            <input type="checkbox" checked={allChecked} onChange={toggleSelectAll} aria-label="Select all products on this page" />
                                        </th>
                                        <th></th>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th className="ad-td-num">Price</th>
                                        <th className="ad-td-num">Stock</th>
                                        <th className="ad-td-num">Rating</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageItems.map(product => (
                                        <tr key={product._id}>
                                            <td className="ad-th-check">
                                                <input type="checkbox" checked={selected.has(product._id)} onChange={() => toggleSelect(product._id)} aria-label={`Select ${product.name}`} />
                                            </td>
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
                                            <td className="ad-td-num"><span className="ad-td-strong">{toINR(product.price)}</span></td>
                                            <td className="ad-td-num">
                                                <span className={`ad-badge ${product.stock === 0 ? 'ad-badge--danger' : product.stock <= lowStockThreshold ? 'ad-badge--warning' : 'ad-badge--success'}`}>
                                                    {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
                                                </span>
                                            </td>
                                            <td className="ad-td-num">
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
                    {filtered.length > PER_PAGE && (
                        <AdminPagination count={filtered.length} perPage={PER_PAGE} page={page} onChange={setPage} />
                    )}
                </div>
            </div>
        </Fragment>
    );
}
