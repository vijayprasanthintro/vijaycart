import { Fragment, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteReview, getAllReviews } from '../../actions/productActions';
import { clearError, clearReviewDeleted } from '../../slices/productSlice';
import { toast } from 'react-toastify';
import AdminPagination from './AdminPagination';
import AdminExport from './AdminExport';
import { resolveProductImage, imgOnError } from '../../utils/productHelper';

const RATING_LABELS = { 5: 'Excellent', 4: 'Good', 3: 'Average', 2: 'Poor', 1: 'Very Poor' };

export default function ReviewList() {
    const { reviews = [], loading = true, error, isReviewDeleted } = useSelector(state => state.productState);
    const [query, setQuery] = useState('');
    const [minRating, setMinRating] = useState(0);
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(getAllReviews());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast(error, { type: 'error', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearError()) });
            return;
        }
        if (isReviewDeleted) {
            toast('Review deleted successfully!', { type: 'success', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearReviewDeleted()) });
            dispatch(getAllReviews());
            return;
        }
    }, [dispatch, error, isReviewDeleted]);

    const filtered = useMemo(() => {
        let list = reviews;
        if (minRating) list = list.filter(r => Number(r.rating) >= minRating);
        if (query.trim()) {
            const q = query.trim().toLowerCase();
            list = list.filter(r =>
                (r.product?.name || '').toLowerCase().includes(q) ||
                (r.userName || r.user?.name || '').toLowerCase().includes(q) ||
                (r.comment || '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [reviews, query, minRating]);

    useEffect(() => { setPage(1); }, [filtered.length, query, minRating]);

    const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const exportHeaders = [
        { label: 'Product', key: 'product' },
        { label: 'User', key: 'user' },
        { label: 'Rating', key: 'rating', type: 'number' },
        { label: 'Comment', key: 'comment' },
        { label: 'Created', key: 'created', type: 'date' }
    ];
    const exportRows = filtered.map(r => ({
        product: r.product?.name || '',
        user: r.userName || r.user?.name || '',
        rating: r.rating,
        comment: r.comment || '',
        created: r.createdAt || ''
    }));

    const deleteHandler = (review) => {
        if (!review.product?._id) {
            toast('Cannot delete this review — product reference missing', { type: 'error' });
            return;
        }
        dispatch(deleteReview(review.product._id, review._id));
    };

    const total = reviews.length;
    const avg = total ? (reviews.reduce((s, r) => s + Number(r.rating), 0) / total) : 0;

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Reviews</h1>
                    <p>All customer feedback across {reviews.length} reviews · Avg {avg ? avg.toFixed(1) : '—'}/5</p>
                </div>
                <div className="ad-toolbar">
                    {reviews.length > 0 && <AdminExport filename="reviews" headers={exportHeaders} rows={exportRows} />}
                </div>
            </div>

            <div className="ad-card">
                <div className="ad-card__head">
                    <div className="ad-toolbar">
                        <div className="ad-search">
                            <i className="fa fa-search" aria-hidden="true"></i>
                            <input placeholder="Search product, customer or comment…" value={query} onChange={e => setQuery(e.target.value)} />
                        </div>
                        <select className="ad-filter" value={minRating} onChange={e => setMinRating(Number(e.target.value))}>
                            <option value={0}>All ratings</option>
                            {[5, 4, 3, 2, 1].map(r => (
                                <option key={r} value={r}>{r}★ &amp; above</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="ad-card__body ad-card__body--flush">
                    {loading && reviews.length === 0 ? (
                        <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading reviews…</div>
                    ) : filtered.length === 0 ? (
                        <div className="ad-empty"><i className="fa fa-star-o" aria-hidden="true"></i><p>No reviews match your filters.</p></div>
                    ) : (
                        <div className="ad-table-wrap">
                            <table className="ad-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Customer</th>
                                        <th className="ad-td-num">Rating</th>
                                        <th>Comment</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageItems.map(review => (
                                        <tr key={review._id}>
                                            <td>
                                                <div className="ad-review-product">
                                                    {review.product?.image ? (
                                                        <img src={resolveProductImage(review.product.image)} alt={review.product.name} onError={imgOnError} />
                                                    ) : (
                                                        <span className="ad-avatar"><i className="fa fa-cube" aria-hidden="true"></i></span>
                                                    )}
                                                    <span>{review.product?.name || '—'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="ad-td-strong">{review.userName || review.user?.name || '—'}</div>
                                                <div className="ad-stat__label">{review.user?.email || ''}</div>
                                            </td>
                                            <td className="ad-td-num">
                                                <span className="ad-stars">
                                                    <i className="fa fa-star" aria-hidden="true"></i>
                                                </span>
                                                <span className="ad-td-strong"> {review.rating}</span>
                                                <div className="ad-stat__label">{RATING_LABELS[Number(review.rating)] || ''}</div>
                                            </td>
                                            <td style={{ maxWidth: 360 }}>{review.comment || '—'}</td>
                                            <td><span className="ad-stat__label">{review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span></td>
                                            <td>
                                                <button type="button" className="ad-btn ad-btn--danger ad-btn--sm" onClick={() => deleteHandler(review)}>
                                                    <i className="fa fa-trash" aria-hidden="true"></i> Delete
                                                </button>
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
