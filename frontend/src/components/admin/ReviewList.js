import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteReview, getReviews } from '../../actions/productActions';
import { clearError, clearReviewDeleted } from '../../slices/productSlice';
import { toast } from 'react-toastify';

export default function ReviewList() {
    const { reviews = [], loading = true, error, isReviewDeleted } = useSelector(state => state.productState);
    const [productId, setProductId] = useState('');
    const [searchId, setSearchId] = useState('');
    const dispatch = useDispatch();

    useEffect(() => {
        if (error) {
            toast(error, { type: 'error', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearError()) });
            return;
        }
        if (isReviewDeleted) {
            toast('Review deleted successfully!', { type: 'success', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearReviewDeleted()) });
            if (productId) dispatch(getReviews(productId));
            return;
        }
    }, [dispatch, error, isReviewDeleted, productId]);

    const submitHandler = (e) => {
        e.preventDefault();
        if (!searchId.trim()) {
            toast('Please enter a product ID', { type: 'warning' });
            return;
        }
        setProductId(searchId.trim());
        dispatch(getReviews(searchId.trim()));
    };

    const deleteHandler = (id) => {
        dispatch(deleteReview(productId, id));
    };

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Reviews</h1>
                    <p>Customer feedback &amp; ratings</p>
                </div>
            </div>

            <div className="ad-card">
                <div className="ad-card__head">
                    <form onSubmit={submitHandler} className="ad-toolbar" style={{ marginBottom: 0 }}>
                        <div className="ad-search" style={{ minWidth: 280 }}>
                            <i className="fa fa-search" aria-hidden="true"></i>
                            <input placeholder="Enter product ID to load reviews…" value={searchId} onChange={e => setSearchId(e.target.value)} />
                        </div>
                        <button type="submit" className="ad-btn ad-btn--primary" disabled={loading}>
                            {loading && <i className="fa fa-spinner fa-spin" aria-hidden="true"></i>} Load Reviews
                        </button>
                    </form>
                    {productId && <span className="ad-chip"><i className="fa fa-box" aria-hidden="true"></i> Product: <span className="ad-td-mono">{productId}</span></span>}
                </div>
                <div className="ad-card__body ad-card__body--flush">
                    {loading && reviews.length === 0 ? (
                        <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading reviews…</div>
                    ) : reviews.length === 0 ? (
                        <div className="ad-empty"><i className="fa fa-star-o" aria-hidden="true"></i><p>Search for a product to manage its reviews.</p></div>
                    ) : (
                        <div className="ad-table-wrap">
                            <table className="ad-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Rating</th>
                                        <th>Comment</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reviews.map(review => (
                                        <tr key={review._id}>
                                            <td>
                                                <span className="ad-toolbar" style={{ justifyContent: 'flex-start' }}>
                                                    {review.user?.avatar ? <img src={review.user.avatar} alt={review.user.name} className="ad-avatar" /> : <span className="ad-avatar"><i className="fa fa-user" aria-hidden="true"></i></span>}
                                                    <span className="ad-td-strong">{review.user?.name || '—'}</span>
                                                </span>
                                            </td>
                                            <td>
                                                <span className="ad-badge ad-badge--warning"><i className="fa fa-star" aria-hidden="true"></i> {review.rating}</span>
                                            </td>
                                            <td style={{ maxWidth: 420 }}>{review.comment}</td>
                                            <td>
                                                <button type="button" className="ad-btn ad-btn--danger ad-btn--sm" onClick={() => deleteHandler(review._id)}>
                                                    <i className="fa fa-trash" aria-hidden="true"></i> Delete
                                                </button>
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
