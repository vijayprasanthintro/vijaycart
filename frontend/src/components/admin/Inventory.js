import { Fragment, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getAdminProducts } from '../../actions/productActions';
import { toINR } from './Charts';
import { productImage, imgOnError } from '../../utils/productHelper';
import AdminPagination from './AdminPagination';
import AdminExport from './AdminExport';

export default function Inventory() {
    const { products = [], loading = true } = useSelector(state => state.productsState);
    const dispatch = useDispatch();

    const [query, setQuery] = useState('');
    const [stock, setStock] = useState('all');
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;

    useEffect(() => {
        dispatch(getAdminProducts);
    }, [dispatch]);

    const outOfStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
    const inventoryValue = products.reduce((s, p) => s + (p.stock * p.price), 0);

    const filtered = useMemo(() => {
        let list = products;
        if (stock === 'out') list = list.filter(p => p.stock === 0);
        else if (stock === 'low') list = list.filter(p => p.stock > 0 && p.stock <= 5);
        else if (stock === 'in') list = list.filter(p => p.stock > 5);
        if (query.trim()) {
            const q = query.trim().toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q) || (p.seller || '').toLowerCase().includes(q));
        }
        return list;
    }, [products, query, stock]);

    useEffect(() => { setPage(1); }, [query, stock]);

    const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const exportHeaders = [
        { label: 'Name', key: 'name' },
        { label: 'Category', key: 'category' },
        { label: 'Seller', key: 'seller' },
        { label: 'Price', key: 'price', type: 'number' },
        { label: 'Stock', key: 'stock', type: 'number' },
        { label: 'Stock Value', key: 'stockValue', type: 'number' }
    ];
    const exportRows = filtered.map(p => ({
        name: p.name,
        category: p.category,
        seller: p.seller || '',
        price: p.price,
        stock: p.stock,
        stockValue: p.stock * p.price
    }));

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Inventory</h1>
                    <p>Stock levels &amp; alerts</p>
                </div>
                <AdminExport filename="inventory" headers={exportHeaders} rows={exportRows} />
            </div>

            <div className="ad-stat-grid">
                <div className="ad-stat ad-stat--info">
                    <div className="ad-stat__icon"><i className="fa fa-box" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Products</div><div className="ad-stat__value">{products.length}</div></div>
                </div>
                <div className="ad-stat ad-stat--primary">
                    <div className="ad-stat__icon"><i className="fa fa-indian-rupee" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Inventory Value</div><div className="ad-stat__value">{toINR(inventoryValue)}</div></div>
                </div>
                <div className="ad-stat ad-stat--warning">
                    <div className="ad-stat__icon"><i className="fa fa-exclamation-triangle" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Low Stock</div><div className="ad-stat__value">{lowStock}</div></div>
                </div>
                <div className="ad-stat ad-stat--danger">
                    <div className="ad-stat__icon"><i className="fa fa-times-circle" aria-hidden="true"></i></div>
                    <div><div className="ad-stat__label">Out of Stock</div><div className="ad-stat__value">{outOfStock}</div></div>
                </div>
            </div>

            <div className="ad-card">
                <div className="ad-card__head">
                    <div className="ad-toolbar">
                        <div className="ad-search">
                            <i className="fa fa-search" aria-hidden="true"></i>
                            <input placeholder="Search products…" value={query} onChange={e => setQuery(e.target.value)} />
                        </div>
                        <select className="ad-filter" value={stock} onChange={e => setStock(e.target.value)}>
                            <option value="all">All stock</option>
                            <option value="in">In stock</option>
                            <option value="low">Low stock</option>
                            <option value="out">Out of stock</option>
                        </select>
                    </div>
                </div>
                <div className="ad-card__body ad-card__body--flush">
                    {loading ? (
                        <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading inventory…</div>
                    ) : filtered.length === 0 ? (
                        <div className="ad-empty"><i className="fa fa-warehouse" aria-hidden="true"></i><p>No products match your filters.</p></div>
                    ) : (
                        <div className="ad-table-wrap">
                            <table className="ad-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Stock</th>
                                        <th>Stock Value</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageItems.map(product => (
                                        <tr key={product._id}>
                                            <td>
                                                <div className="ad-toolbar" style={{ justifyContent: 'flex-start' }}>
                                                    {product.images && product.images[0] ? <img src={productImage(product)} alt={product.name} className="ad-avatar" style={{ width: 40, height: 40 }} onError={imgOnError} /> : <span className="ad-avatar"><i className="fa fa-box" aria-hidden="true"></i></span>}
                                                    <span className="ad-td-strong" style={{ maxWidth: 280 }}>{product.name}</span>
                                                </div>
                                            </td>
                                            <td><span className="ad-chip">{product.category}</span></td>
                                            <td>
                                                <span className={`ad-badge ${product.stock === 0 ? 'ad-badge--danger' : product.stock <= 5 ? 'ad-badge--warning' : 'ad-badge--success'}`}>
                                                    {product.stock === 0 ? 'Out of stock' : product.stock <= 5 ? `Low · ${product.stock}` : `${product.stock} in stock`}
                                                </span>
                                            </td>
                                            <td><span className="ad-td-strong">{toINR(product.stock * product.price)}</span></td>
                                            <td>
                                                <Link to={`/admin/product/${product._id}`} className="ad-btn ad-btn--ghost ad-btn--sm"><i className="fa fa-pencil" aria-hidden="true"></i> Edit</Link>
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
