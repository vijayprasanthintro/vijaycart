import { Link } from 'react-router-dom';
import { memo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useWishlist } from '../../context/WishlistContext';
import { addCartItem } from '../../actions/cartActions';
import { getPricing, formatMoney, roundRating, isInStock, getBadge, getDelivery, productImage, imgOnError } from '../../utils/productHelper';

export default memo(function Product ({product, col}) {
    const dispatch = useDispatch();
    const { isWishlisted, toggleWishlist } = useWishlist();
    const [showQuick, setShowQuick] = useState(false);
    const pricing = getPricing(product);
    const rating = roundRating(product.ratings);
    const inStock = isInStock(product);
    const wish = isWishlisted(product._id);
    const delivery = getDelivery(product);

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.stock === 0) {
            toast('Out of stock', { type: 'error', position: toast.POSITION.BOTTOM_CENTER });
            return;
        }
        dispatch(addCartItem(product._id, 1));
        toast('Cart Item Added!', { type: 'success', position: toast.POSITION.BOTTOM_CENTER });
    };

    const handleWishlist = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);
        toast(wish ? 'Removed from Wishlist' : 'Added to Wishlist', {
            type: wish ? 'info' : 'success',
            position: toast.POSITION.BOTTOM_CENTER
        });
    };

    return (
        <div className={`col-12 col-sm-6 col-lg-${col} my-3`}>
            <div className="card-premium card-product p-0 rounded">
                {/* Badges */}
                <div className="product-badges">
                    <span className="product-badge bg-gold">{getBadge(product)}</span>
                    <span className="product-badge bg-discount">-{pricing.discount}%</span>
                </div>

                {/* Wishlist heart */}
                <button
                    type="button"
                    onClick={handleWishlist}
                    aria-label={wish ? 'Remove from wishlist' : 'Add to wishlist'}
                    aria-pressed={wish}
                    className={`wishlist-btn ${wish ? 'active' : ''}`}
                >
                    <i className={`fa ${wish ? 'fa-heart' : 'fa-heart-o'}`} aria-hidden="true"></i>
                </button>

                {product.images.length > 0 &&
                <div className="position-relative overflow-hidden">
                  <img
                    className="card-img-top mx-auto"
                    src={productImage(product)}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    onError={imgOnError}
                  />
                  <button
                    type="button"
                    className="quick-view-btn"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQuick(true); }}
                  >
                    <i className="fa fa-eye" aria-hidden="true"></i> Quick View
                  </button>
                </div>}

                <div className="card-body d-flex flex-column">
                    <span className="product-seller">{product.brand || product.seller}</span>
                    <h5 className="card-title">
                        <Link to={`/product/${product._id}`} title={product.name}>{product.name}</Link>
                    </h5>

                    <div className="rating-row">
                        <div className="rating-outer">
                            <div className="rating-inner" style={{width: `${rating / 5 * 100}%`}}></div>
                        </div>
                        <span className="rating-value">{rating}</span>
                        <span className="no-of-reviews">({product.numOfReviews || 0})</span>
                    </div>

                    <div className="price-row">
                        <span className="card-text">{formatMoney(pricing.price)}</span>
                        <span className="mrp">{formatMoney(pricing.mrp)}</span>
                        <span className="discount-chip">-{pricing.discount}%</span>
                    </div>

                    <div className="delivery-row">
                        <span className="delivery-truck"><i className="fa fa-truck" aria-hidden="true"></i></span>
                        <span className="delivery-free">Free Delivery</span>
                        <span className="delivery-by">by {delivery.by}</span>
                        {inStock && pricing.price <= 5000 && (
                            <span className="cod-chip"><i className="fa fa-hand-holding-dollar mr-1" aria-hidden="true"></i>COD Available</span>
                        )}
                    </div>

                    <div className="stock-status mb-1" style={{ fontSize: '0.72rem', fontFamily: 'var(--font-accent)', fontWeight: '600' }}>
                      {inStock ? (
                        <span style={{ color: 'var(--success)' }}><i className="fa fa-check-circle mr-1" aria-hidden="true"></i>In Stock</span>
                      ) : (
                        <span style={{ color: 'var(--danger)' }}><i className="fa fa-times-circle mr-1" aria-hidden="true"></i>Out of Stock</span>
                      )}
                    </div>

                    <div className="d-flex gap-2 mt-auto pt-2">
                        <button
                            type="button"
                            disabled={!inStock}
                            onClick={handleAddToCart}
                            className="btn btn-block view-btn flex-grow-1"
                        >
                            <span>{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick View Modal */}
            {showQuick && (
                <Modal show={showQuick} onHide={() => setShowQuick(false)} size="lg" centered className="quickview-modal">
                    <Modal.Body>
                        <div className="row align-items-center g-0">
                            <div className="col-12 col-md-5 text-center quickview-img">
                                {product.images.length > 0 &&
                                  <img src={productImage(product)} alt={product.name} loading="lazy" decoding="async" onError={imgOnError} />}
                            </div>
                            <div className="col-12 col-md-7 quickview-info">
                                <span className="product-seller">{product.brand || product.seller}</span>
                                <h3 className="qv-title">{product.name}</h3>
                                <div className="rating-row mb-2">
                                    <div className="rating-outer">
                                        <div className="rating-inner" style={{width: `${rating / 5 * 100}%`}}></div>
                                    </div>
                                    <span className="rating-value">{rating}</span>
                                    <span className="no-of-reviews">({product.numReviews || 0} Reviews)</span>
                                </div>
                                <div className="price-row mb-3">
                                    <span className="qv-price">{formatMoney(pricing.price)}</span>
                                    <span className="mrp">{formatMoney(pricing.mrp)}</span>
                                    <span className="off-discount">{pricing.discount}% OFF</span>
                                </div>
                                <p className="qv-desc">{String(product.description || '').slice(0, 140)}...</p>
                                <div className="d-flex flex-wrap gap-2">
                                    <Link to={`/product/${product._id}`} className="btn btn-block view-btn flex-grow-1" style={{maxWidth:'200px'}}>
                                        <span>View Details</span>
                                    </Link>
                                    <button type="button" disabled={!inStock} onClick={handleAddToCart} className="btn btn-gold flex-grow-1" style={{maxWidth:'200px'}}>
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Modal.Body>
                </Modal>
            )}
        </div>
    )
})