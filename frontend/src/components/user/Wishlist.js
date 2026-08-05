import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useWishlist } from '../../context/WishlistContext';
import { addCartItem } from '../../actions/cartActions';
import { getPricing, formatMoney, roundRating } from '../../utils/productHelper';
import MetaData from '../layouts/MetaData';

export default function Wishlist() {
    const dispatch = useDispatch();
    const { items, removeFromWishlist, clearWishlist, count } = useWishlist();

    const moveToCart = (product) => {
        dispatch(addCartItem(product._id, 1));
        removeFromWishlist(product._id);
        toast('Moved to Cart!', { type: 'success', position: toast.POSITION.BOTTOM_CENTER });
    };

    const removeItem = (id) => {
        removeFromWishlist(id);
        toast('Removed from Wishlist', { type: 'info', position: toast.POSITION.BOTTOM_CENTER });
    };

    return (
        <div className="mt-4">
            <MetaData title="My Wishlist" />
            <div className="addr-head">
                <div>
                    <h1 className="cart-title">My Wishlist</h1>
                    <p className="addr-sub">{count} item{count === 1 ? '' : 's'} you love — ready when you are.</p>
                </div>
                {items.length > 0 && (
                    <button type="button" className="save-later-btn" onClick={() => { clearWishlist(); toast('Wishlist cleared', { type: 'info', position: toast.POSITION.BOTTOM_CENTER }); }}>
                        <i className="fa fa-trash-o mr-1" aria-hidden="true"></i>Clear All
                    </button>
                )}
            </div>

            {items.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon"><i className="fa fa-heart-o" aria-hidden="true"></i></div>
                    <h2 className="empty-title">Your Wishlist is Empty</h2>
                    <p className="empty-sub">Save the products you love by tapping the heart icon, then move them to your cart whenever you're ready.</p>
                    <Link to="/search/all" className="empty-cta"><i className="fa fa-shopping-bag mr-2" aria-hidden="true"></i>Start Shopping</Link>
                </div>
            ) : (
                <div className="wishlist-grid">
                    {items.map(product => {
                        const pricing = getPricing(product);
                        const rating = roundRating(product.ratings);
                        const inStock = Number(product.stock) > 0;
                        return (
                            <div key={product._id} className="card-premium card-product p-0">
                                <div className="product-badges">
                                    <span className="product-badge bg-discount">-{pricing.discount}%</span>
                                </div>
                                <button
                                    type="button"
                                    className="wishlist-btn active"
                                    onClick={() => removeItem(product._id)}
                                    aria-label="Remove from wishlist"
                                ><i className="fa fa-heart" aria-hidden="true"></i></button>
                                <Link to={`/product/${product._id}`} className="d-block overflow-hidden">
                                    {product.images && product.images.length > 0 && (
                                        <img className="card-img-top mx-auto" src={product.images[0].image} alt={product.name} loading="lazy" />
                                    )}
                                </Link>
                                <div className="card-body d-flex flex-column">
                                    <h5 className="card-title"><Link to={`/product/${product._id}`} title={product.name}>{product.name}</Link></h5>
                                    <div className="rating-row">
                                        <div className="rating-outer">
                                            <div className="rating-inner" style={{ width: `${rating / 5 * 100}%` }}></div>
                                        </div>
                                        <span className="rating-value">{rating}</span>
                                        <span className="no-of-reviews">({product.numOfReviews || 0})</span>
                                    </div>
                                    <div className="price-row">
                                        <span className="card-text">{formatMoney(pricing.price)}</span>
                                        <span className="mrp">{formatMoney(pricing.mrp)}</span>
                                    </div>
                                    <span className={`wl-stock ${inStock ? 'in' : 'out'}`}>
                                        <i className={`fa mr-1 ${inStock ? 'fa-check-circle' : 'fa-exclamation-circle'}`} aria-hidden="true"></i>
                                        {inStock ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                    <div className="d-flex gap-2 mt-auto pt-2">
                                        <button
                                            type="button"
                                            disabled={!inStock}
                                            onClick={() => moveToCart(product)}
                                            className="btn btn-block view-btn flex-grow-1"
                                        ><span>{inStock ? 'Move to Cart' : 'Out of Stock'}</span></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
