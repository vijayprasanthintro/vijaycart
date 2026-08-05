import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams, Link } from "react-router-dom";
import { createReview, getProduct, getProducts } from "../../actions/productActions"
import { ProductDetailSkeleton } from '../layouts/Skeletons';
import MetaData from "../layouts/MetaData";
import { addCartItem } from "../../actions/cartActions";
import { clearReviewSubmitted, clearError, clearProduct } from '../../slices/productSlice';
import { Modal } from 'react-bootstrap';
import { toast } from "react-toastify";
import ProductReview from "./ProductReview";
import ProductCarousel from "../home/ProductCarousel";
import GalleryLightbox from "./GalleryLightbox";
import axios from "axios";
import { useWishlist } from "../../context/WishlistContext";
import { getPricing, formatMoney, roundRating, getDelivery, getGalleryImages, getDemoReviews } from "../../utils/productHelper";

const arrivalText = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export default function ProductDetail () {
    const { loading, product = {}, isReviewSubmitted, error, notFound } = useSelector((state) => state.productState);
    const { products: relatedProducts, loading: relatedLoading } = useSelector((state) => state.productsState);
    const { user } = useSelector(state => state.authState);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams()
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState(0);
    const [show, setShow] = useState(false);
    const [rating, setRating] = useState(1);
    const [comment, setComment] = useState("");
    const [canZoom, setCanZoom] = useState(false);
    const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 });
    const [pincode, setPincode] = useState('');
    const [pinStatus, setPinStatus] = useState(null);
    const [pinChecking, setPinChecking] = useState(false);
    const [pool, setPool] = useState([]);
    const [poolLoaded, setPoolLoaded] = useState(false);
    const [lightbox, setLightbox] = useState(null);
    const [stickyVisible, setStickyVisible] = useState(false);
    const actionsRef = useRef(null);
    const prevIdRef = useRef(id);
    const lastErrorToastRef = useRef('');

    const pricing = useMemo(() => getPricing(product), [product]);
    const ratingVal = useMemo(() => roundRating(product.ratings), [product.ratings]);
    const wish = useWishlist();
    const isWished = wish.isWishlisted(product._id);
    const delivery = useMemo(() => getDelivery(product), [product]);
    const images = useMemo(() => getGalleryImages(product), [product]);

    const increaseQty = () => {
        if (product.stock === 0 || quantity >= product.stock) return;
        setQuantity(q => q + 1);
    }
    const decreaseQty = () => {
        if (quantity === 1) return;
        setQuantity(q => q - 1);
    }

    const addToCart = (qty = quantity) => {
        dispatch(addCartItem(product._id, qty));
        toast('Added to Cart!', { type: 'success', position: toast.POSITION.BOTTOM_CENTER });
    };

    const buyNow = () => {
        dispatch(addCartItem(product._id, quantity));
        navigate('/shipping');
    };

    const toggleWish = () => {
        wish.toggleWishlist(product);
        toast(isWished ? 'Removed from Wishlist' : 'Added to Wishlist', {
            type: isWished ? 'info' : 'success',
            position: toast.POSITION.BOTTOM_CENTER
        });
    };

    const reviewHandler = () => {
        const formData = new FormData();
        formData.append('rating', rating);
        formData.append('comment', comment);
        formData.append('productId', id);
        dispatch(createReview(formData))
    }

    // Fetch the product. When the :id changes we clear the previous product so
    // the skeleton shows for the new one; otherwise we leave prior state alone
    // (the old cleanup-based clear caused a fetch/clear loop and duplicate
    // toasts). getProduct() also dedupes concurrent requests for the same id.
    useEffect(() => {
        if (prevIdRef.current !== id) {
            prevIdRef.current = id;
            dispatch(clearProduct());
        }
        dispatch(getProduct(id));
    }, [dispatch, id]);

    // One toast per distinct error (no duplicate notifications on re-render).
    useEffect(() => {
        if (!error) return;
        if (lastErrorToastRef.current !== error) {
            lastErrorToastRef.current = error;
            toast(error, {
                position: toast.POSITION.BOTTOM_CENTER,
                type: 'error',
            });
        }
        dispatch(clearError());
    }, [error, dispatch]);

    useEffect(() => {
        if (!isReviewSubmitted) return;
        setShow(false)
        toast('Review Submitted successfully', {
            type: 'success',
            position: toast.POSITION.BOTTOM_CENTER,
            onOpen: () => dispatch(clearReviewSubmitted())
        })
        dispatch(getProduct(id))
    }, [isReviewSubmitted, dispatch, id])

    // record recently viewed
    useEffect(() => {
        if (!product._id) return;
        try {
            const raw = localStorage.getItem('vijaycart_recent');
            let recent = raw ? JSON.parse(raw) : [];
            recent = recent.filter(p => p._id !== product._id);
            recent.unshift(product);
            localStorage.setItem('vijaycart_recent', JSON.stringify(recent.slice(0, 12)));
        } catch { /* ignore */ }
    }, [product]);

    // fetch related products by category
    useEffect(() => {
        if (product.category) {
            dispatch(getProducts(null, null, product.category, null, 1, 100));
        }
    }, [dispatch, product.category]);

    // detect desktop hover capability for the zoom lens
    useEffect(() => {
        setCanZoom(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    }, []);

    // fetch full catalogue pool for similar products (single request; the
    // backend now honours `limit` instead of paginating 8 per page)
    const loadPool = useCallback(async () => {
        try {
            const res = await axios.get('/api/v1/products?limit=200');
            setPool(res.data.products || []);
        } catch { /* ignore */ } finally {
            setPoolLoaded(true);
        }
    }, []);

    useEffect(() => {
        loadPool();
    }, [loadPool]);

    const related = useMemo(
        () => (relatedProducts || []).filter(p => p._id !== product._id).slice(0, 10),
        [relatedProducts, product._id]
    );

    const similar = useMemo(() => {
        const relatedIds = new Set(related.map(p => p._id));
        return pool
            .filter(p => p._id !== product._id && !relatedIds.has(p._id))
            .sort((a, b) => {
                const aSame = a.seller === product.seller ? 0 : 1;
                const bSame = b.seller === product.seller ? 0 : 1;
                if (aSame !== bSame) return aSame - bSame;
                return Math.abs(a.price - product.price) - Math.abs(b.price - product.price);
            })
            .slice(0, 10);
    }, [pool, product, related]);

    const displayReviews = useMemo(() => {
        if (product.reviews && product.reviews.length) return product.reviews;
        return getDemoReviews(product);
    }, [product]);

    const highlights = useMemo(() => {
        if (product.highlights && product.highlights.length) {
            return product.highlights.slice(0, 6);
        }
        const list = [];
        if (product.description) {
            const sentences = product.description.split(/[.;]\s+/).map(s => s.trim()).filter(Boolean);
            list.push(...sentences.slice(0, 3));
        }
        list.push(`Sold by ${product.seller || 'VijayCart'} with 7-day easy returns`);
        list.push(`Free delivery by ${delivery.by}`);
        return list.slice(0, 6);
    }, [product, delivery]);

    const specGroups = useMemo(() => {
        const groups = [
            {
                title: 'General',
                rows: [
                    { k: 'Brand', v: product.brand || product.seller },
                    { k: 'Model', v: product.name },
                    { k: 'Category', v: product.category },
                    { k: 'Product ID', v: product._id },
                ],
            },
        ];
        if (product.specifications && product.specifications.length) {
            groups.push({
                title: 'Technical Details',
                rows: product.specifications.map(s => ({ k: s.label, v: s.value })),
            });
        }
        groups.push(
            {
                title: 'Seller & Support',
                rows: [
                    { k: 'Sold by', v: product.seller },
                    { k: 'Warranty', v: product.warranty || '1 Year Seller Warranty' },
                    { k: 'Returns', v: '7-Day Replacement Guarantee' },
                    { k: 'Easy Returns', v: 'No questions asked' },
                ],
            },
            {
                title: 'Other',
                rows: [
                    { k: 'Stock', v: product.stock > 0 ? `${product.stock} items in stock` : 'Out of Stock' },
                    { k: 'Ratings', v: `${ratingVal} / 5 (${product.numOfReviews || displayReviews.length} reviews)` },
                    { k: 'Delivery', v: `Free Delivery by ${delivery.by}` },
                    { k: 'Payment', v: 'COD, UPI, Cards & Net Banking' },
                ],
            }
        );
        return groups;
    }, [product, ratingVal, delivery, displayReviews.length]);

    const descriptionParts = useMemo(() => {
        if (!product.description) return { intro: '', features: [] };
        const sentences = product.description
            .split(/[.;]\s+/)
            .map(s => s.trim())
            .filter(Boolean);
        const features = product.features && product.features.length
            ? product.features
            : sentences.slice(1, 9);
        return {
            intro: sentences[0] || '',
            features,
        };
    }, [product.description, product.features]);

    const recentlyViewed = useMemo(() => {
        try {
            const raw = localStorage.getItem('vijaycart_recent');
            const list = raw ? JSON.parse(raw) : [];
            return list.filter(p => p._id !== product._id).slice(0, 8);
        } catch {
            return [];
        }
    }, [product._id]);

    const handleClose = () => setShow(false);

    // reset per-product state when navigating between products
    useEffect(() => {
        setActiveImage(0);
        setQuantity(1);
        setLightbox(null);
        setPinStatus(null);
    }, [id]);

    // show the sticky Add to Cart / Buy Now bar once the inline actions are out of view
    useEffect(() => {
        const el = actionsRef.current;
        if (!el || loading || typeof IntersectionObserver === 'undefined') {
            setStickyVisible(false);
            return;
        }
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => setStickyVisible(!entry.isIntersecting));
            },
            { threshold: 0, rootMargin: '-90px 0px 0px 0px' }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [loading, product._id]);

    const prevImage = (e) => { if (e) e.stopPropagation(); if (images.length) setActiveImage(a => (a - 1 + images.length) % images.length); };
    const nextImage = (e) => { if (e) e.stopPropagation(); if (images.length) setActiveImage(a => (a + 1) % images.length); };

    const handleZoomMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoom({ active: true, x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
    };

    const checkPincode = async () => {
        const pin = String(pincode || '').trim();
        if (!/^\d{6}$/.test(pin)) {
            setPinStatus({ error: 'Please enter a valid 6-digit pincode' });
            return;
        }
        setPinChecking(true);
        setPinStatus({ checking: true });
        try {
            const [pinRes, codRes] = await Promise.all([
                axios.get(`/api/v1/pincode/${pin}`),
                axios.get(`/api/v1/pincode/${pin}/cod?amount=${Math.round(Number(pricing.price) || 0)}`)
            ]);
            const data = pinRes.data.data || {};
            setPinStatus({
                ok: true,
                cod: !!codRes.data.available,
                codReason: codRes.data.reason || '',
                date: arrivalText(delivery.days),
                area: [data.area, data.district, data.state].filter(Boolean).join(', '),
                pin,
            });
        } catch (err) {
            setPinStatus({
                ok: false,
                pin,
                error: err?.response?.data?.message || 'Could not check this pincode right now. Please try again.',
            });
        } finally {
            setPinChecking(false);
        }
    };

    return (
        <Fragment>
            {notFound ? (
                <div className="empty-state mt-4">
                    <div className="empty-icon"><i className="fa fa-cube" aria-hidden="true"></i></div>
                    <h2 className="empty-title">Product Not Found</h2>
                    <p className="empty-sub">We couldn't find the product you were looking for. It may have been removed or the link may be incorrect.</p>
                    <Link to="/search/all" className="empty-cta"><i className="fa fa-shopping-bag mr-2" aria-hidden="true"></i>Browse Products</Link>
                </div>
            ) : loading ? <ProductDetailSkeleton /> :
                <Fragment>
                    <MetaData title={product.name} />
                    <div className="product-detail-layout">
                        <div className="row">
                            {/* Gallery */}
                            <div className="col-12 col-lg-5">
                                <div className="pd-gallery">
                                    {images.length > 1 && (
                                        <div className="gallery-thumbs">
                                            {images.map((img, i) => (
                                                <button
                                                    key={img._id || i}
                                                    type="button"
                                                    className={`gallery-thumb ${i === activeImage ? 'active' : ''}`}
                                                    onClick={() => setActiveImage(i)}
                                                    aria-label={`View image ${i + 1}`}
                                                >
                                                    <img src={img.image} alt={`${product.name} ${i + 1}`} loading="lazy" decoding="async" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div
                                        className="gallery-main"
                                        onMouseMove={canZoom ? handleZoomMove : undefined}
                                        onMouseLeave={() => setZoom(z => ({ ...z, active: false }))}
                                        onClick={() => { if (images.length) setLightbox(activeImage); }}
                                        role="button"
                                        tabIndex={0}
                                        aria-label="Enlarge product image"
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (images.length) setLightbox(activeImage); } }}
                                    >
                                        {canZoom && <span className="gallery-zoom-hint"><i className="fa fa-search-plus" aria-hidden="true"></i></span>}
                                        {images.length > 0 && images[activeImage] && (
                                            <img src={images[activeImage].image} alt={product.name} loading="eager" decoding="async" fetchPriority="high" />
                                        )}
                                        {canZoom && zoom.active && images[activeImage] && (
                                            <div
                                                className="pd-zoom"
                                                style={{
                                                    backgroundImage: `url(${images[activeImage].image})`,
                                                    backgroundPosition: `${zoom.x}% ${zoom.y}%`,
                                                }}
                                            ></div>
                                        )}
                                        {images.length > 1 && (
                                            <Fragment>
                                                <button type="button" className="gallery-nav gallery-nav--prev" onClick={prevImage} aria-label="Previous image"><i className="fa fa-chevron-left" aria-hidden="true"></i></button>
                                                <button type="button" className="gallery-nav gallery-nav--next" onClick={nextImage} aria-label="Next image"><i className="fa fa-chevron-right" aria-hidden="true"></i></button>
                                            </Fragment>
                                        )}
                                        {images.length > 1 && (
                                            <span className="gallery-count">{activeImage + 1} / {images.length}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="col-12 col-lg-7 mt-4 mt-lg-0">
                                <h1 className="pd-title">{product.name}</h1>
                                <div className="pd-meta">
                                    {product.brand && <span className="pd-badge-chip pd-brand-chip"><i className="fa fa-certificate" aria-hidden="true"></i>{product.brand}</span>}
                                    <span className="pd-badge-chip"><i className="fa fa-tag" aria-hidden="true"></i>{product.category || 'General'}</span>
                                    <span className="pd-rs-chip"><i className="fa fa-star" aria-hidden="true"></i> {ratingVal}</span>
                                    <span className="no-of-reviews">({product.numOfReviews || displayReviews.length} Ratings &amp; Reviews)</span>
                                </div>

                                <div className="pd-price-row">
                                    <span className="pd-price">{formatMoney(pricing.price)}</span>
                                    <span className="pd-mrp">{formatMoney(pricing.mrp)}</span>
                                    <span className="pd-discount">{pricing.discount}% OFF</span>
                                </div>
                                {pricing.saved > 0 && (
                                    <p className="pd-save mb-3"><i className="fa fa-tags mr-1" aria-hidden="true"></i> You save {formatMoney(pricing.saved)} on this order</p>
                                )}

                                <div className="offer-strip">
                                    <div className="offer-head"><i className="fa fa-gift mr-1" aria-hidden="true"></i> Available Offers</div>
                                    <div className="offer-row"><i className="fa fa-check-circle" aria-hidden="true"></i> Get 10% instant discount with VijayCart Pay</div>
                                    <div className="offer-row"><i className="fa fa-check-circle" aria-hidden="true"></i> No cost EMI available on credit cards above ₹10,000</div>
                                    <div className="offer-row"><i className="fa fa-check-circle" aria-hidden="true"></i> Extra 5% off on first order (new customers)</div>
                                </div>

                                <div className="delivery-box">
                                    <i className="fa fa-map-marker" aria-hidden="true"></i>
                                    <div className="delivery-box-body">
                                        <div className="delivery-box-top">
                                            <span className="delivery-label">Delivery</span>
                                            <span className="delivery-est">Free delivery by <strong>{delivery.by}</strong></span>
                                        </div>
                                        <div className="pin-check">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={6}
                                                value={pincode}
                                                onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '')); setPinStatus(null); }}
                                                placeholder="Enter delivery pincode"
                                                aria-label="Delivery pincode"
                                            />
                                            <button type="button" className="pin-check-btn" onClick={checkPincode} disabled={pinChecking}>
                                                {pinChecking ? <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> : 'Check'}
                                            </button>
                                        </div>
                                        {pinStatus && (
                                            <div className={`pin-status ${pinStatus.error ? 'err' : pinStatus.checking ? '' : pinStatus.ok ? 'ok' : 'no'}`}>
                                                {pinStatus.checking ? (
                                                    <span><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Checking delivery &amp; COD for {pinStatus.pin || pincode}…</span>
                                                ) : pinStatus.error ? (
                                                    <span>{pinStatus.error}</span>
                                                ) : pinStatus.ok ? (
                                                    <span>
                                                        <i className="fa fa-check-circle" aria-hidden="true"></i> Delivery by <strong>{pinStatus.date}</strong>
                                                        {pinStatus.area && <span className="pin-area"> · {pinStatus.area}</span>}
                                                        {pinStatus.cod
                                                            ? <span className="pin-cod"> · Cash on Delivery available</span>
                                                            : <span className="pin-nocod"> · {pinStatus.codReason || 'Cash on Delivery not available at this pincode'}</span>}
                                                    </span>
                                                ) : (
                                                    <span><i className="fa fa-times-circle" aria-hidden="true"></i> Delivery not available at {pinStatus.pin}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="d-flex align-items-center flex-wrap gap-3">
                                    <p className="mb-0">Status: <span className={product.stock > 0 ? 'greenColor' : 'redColor'} id="stock_status">{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span></p>
                                    <p id="product_id" className="mb-0">Product # {product._id}</p>
                                </div>

                                <hr style={{ borderColor: '#e0e0e0' }} />

                                <div className="qty-box">
                                    <span className="qty-label">Quantity</span>
                                    <div className="stockCounter d-inline-flex align-items-center">
                                        <span className="btn btn-danger minus" onClick={decreaseQty} aria-label="Decrease quantity">-</span>
                                        <input type="number" className="form-control count d-inline" value={quantity} readOnly />
                                        <span className="btn btn-primary plus" onClick={increaseQty} aria-label="Increase quantity">+</span>
                                    </div>
                                </div>

                                <div className="detail-actions" ref={actionsRef}>
                                    <button
                                        type="button"
                                        id="cart_btn"
                                        disabled={product.stock === 0}
                                        onClick={() => addToCart()}
                                        className="btn btn-primary w-100 w-sm-auto"
                                    ><i className="fa fa-shopping-cart mr-2" aria-hidden="true"></i>Add to Cart</button>
                                    <button
                                        type="button"
                                        disabled={product.stock === 0}
                                        onClick={buyNow}
                                        className="buy-now-btn w-100 w-sm-auto"
                                    ><i className="fa fa-bolt mr-2" aria-hidden="true"></i>Buy Now</button>
                                    <button
                                        type="button"
                                        onClick={toggleWish}
                                        aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
                                        className={`wishlist-btn detail-wish ${isWished ? 'active' : ''}`}
                                    ><i className={`fa ${isWished ? 'fa-heart' : 'fa-heart-o'}`} aria-hidden="true"></i></button>
                                </div>

                                <div className="pd-trust">
                                    <span><i className="fa fa-truck" aria-hidden="true"></i> Free Delivery</span>
                                    <span><i className="fa fa-rotate-left" aria-hidden="true"></i> 7-Day Replacement</span>
                                    <span><i className="fa fa-shield" aria-hidden="true"></i> Seller Warranty</span>
                                </div>

                                <p id="product_seller" className="mt-3 mb-0">Sold by: <strong>{product.seller}</strong></p>

                                {user ? (
                                    <button onClick={() => setShow(true)} id="review_btn" type="button" className="btn btn-primary mt-3">
                                        <i className="fa fa-star mr-2" aria-hidden="true"></i>Submit Your Review
                                    </button>
                                ) : (
                                    <div className="alert alert-danger mt-3"> Login to Post Review</div>
                                )}
                            </div>
                        </div>

                        {/* Highlights */}
                        <section className="pd-section">
                            <h2 className="pd-section-title">Highlights</h2>
                            <ul className="pd-hl-list">
                                {highlights.map((h, i) => (
                                    <li key={i}><i className="fa fa-check" aria-hidden="true"></i> {h}</li>
                                ))}
                            </ul>
                        </section>

                        {/* Specifications */}
                        <section className="pd-section">
                            <h2 className="pd-section-title">Specifications</h2>
                            <div className="spec-table-wrap">
                                {specGroups.map(g => (
                                    <div className="spec-group" key={g.title}>
                                        <h3 className="spec-group-title">{g.title}</h3>
                                        <table className="spec-table">
                                            <tbody>
                                                {g.rows.map(r => (
                                                    <tr key={r.k}>
                                                        <th scope="row">{r.k}</th>
                                                        <td>{r.v || '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Description */}
                        <section className="pd-section">
                            <h2 className="pd-section-title">Description</h2>
                            <div className="pd-desc-card">
                                {descriptionParts.intro && (
                                    <>
                                        <h3>Overview</h3>
                                        <p className="pd-desc">{descriptionParts.intro}</p>
                                    </>
                                )}
                                {descriptionParts.features.length > 0 && (
                                    <>
                                        <h3>Key Features</h3>
                                        <ul className="pd-feature-list">
                                            {descriptionParts.features.map((f, i) => (
                                                <li key={i}><i className="fa fa-check-circle" aria-hidden="true"></i> {f}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                                {!descriptionParts.intro && descriptionParts.features.length === 0 && (
                                    <p className="pd-desc mb-0">{product.description}</p>
                                )}
                            </div>
                        </section>

                        {/* Ratings & Reviews */}
                        <section className="pd-section">
                            <div className="pd-rev-head">
                                <div>
                                    <h2 className="pd-section-title mb-1">Ratings &amp; Reviews</h2>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="pd-rs-chip pd-rs-chip--lg">{ratingVal} <i className="fa fa-star" aria-hidden="true"></i></span>
                                        <span className="no-of-reviews">{product.numOfReviews || displayReviews.length} Reviews</span>
                                    </div>
                                </div>
                                {user ? (
                                    <button type="button" className="review-btn px-4" onClick={() => setShow(true)}><i className="fa fa-pencil mr-1" aria-hidden="true"></i>Write Review</button>
                                ) : (
                                    <Link to="/login" className="review-btn px-4"><i className="fa fa-star mr-1" aria-hidden="true"></i>Login to Review</Link>
                                )}
                            </div>
                            {displayReviews.length > 0
                                ? <ProductReview reviews={displayReviews} />
                                : <p className="text-muted mt-3">No reviews yet. Be the first to review this product!</p>}
                        </section>

                        {/* Similar products */}
                        {similar.length > 0 && (
                            <ProductCarousel
                                title={<span>Similar <span className="section-accent">Products</span></span>}
                                subtitle="Picked for you"
                                viewAll="/search/all"
                                products={similar}
                                loading={!poolLoaded}
                                error=""
                                emptyText="Similar products will appear here soon."
                            />
                        )}

                        {/* Related products */}
                        {related.length > 0 && (
                            <ProductCarousel
                                title={<span>Related <span className="section-accent">Products</span></span>}
                                subtitle="More from this category"
                                viewAll={`/search/all?category=${encodeURIComponent(product.category || '')}`}
                                products={related}
                                loading={relatedLoading}
                                error=""
                                emptyText="Related products will appear here soon."
                            />
                        )}

                        {/* Recently viewed */}
                        {recentlyViewed.length > 0 && (
                            <ProductCarousel
                                title={<span>Recently <span className="section-accent">Viewed</span></span>}
                                subtitle="Pick up where you left off"
                                viewAll="/search/all"
                                products={recentlyViewed}
                            />
                        )}
                    </div>

                    {/* Lightbox for the main gallery */}
                    {lightbox !== null && (
                        <GalleryLightbox
                            images={images.map(i => (typeof i === 'string' ? i : i.image))}
                            startIndex={lightbox}
                            title={product.name}
                            onClose={() => setLightbox(null)}
                        />
                    )}

                    {/* Sticky Add to Cart / Buy Now (mobile) */}
                    {!loading && product._id && stickyVisible && (
                        <div className="pd-sticky">
                            <div className="pd-sticky-inner">
                                <img className="pd-sticky-thumb" src={images[0]} alt="" />
                                <div className="pd-sticky-info">
                                    <span className="pd-sticky-name">{product.name}</span>
                                    <span className="pd-sticky-price">
                                        {formatMoney(pricing.price)}
                                        <s>{formatMoney(pricing.mrp)}</s>
                                        <em>{pricing.discount}% off</em>
                                    </span>
                                </div>
                                <div className="pd-sticky-actions">
                                    <button
                                        type="button"
                                        className="pd-sticky-add"
                                        disabled={product.stock === 0}
                                        onClick={() => addToCart()}
                                    ><i className="fa fa-shopping-cart" aria-hidden="true"></i> Add to Cart</button>
                                    <button
                                        type="button"
                                        className="pd-sticky-buy"
                                        disabled={product.stock === 0}
                                        onClick={buyNow}
                                    ><i className="fa fa-bolt" aria-hidden="true"></i> Buy Now</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Review Modal */}
                    <Modal show={show} onHide={handleClose}>
                        <Modal.Header closeButton>
                            <Modal.Title>Submit Review</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <ul className="stars">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <li
                                        key={star}
                                        value={star}
                                        onClick={() => setRating(star)}
                                        className={`star ${star <= rating ? 'orange' : ''}`}
                                        onMouseOver={(e) => e.target.classList.add('yellow')}
                                        onMouseOut={(e) => e.target.classList.remove('yellow')}
                                    ><i className="fa fa-star"></i></li>
                                ))}
                            </ul>
                            <textarea onChange={(e) => setComment(e.target.value)} name="review" id="review" className="form-control mt-3"></textarea>
                            <button disabled={loading} onClick={reviewHandler} aria-label="Close" className="btn my-3 float-right review-btn px-4 text-white">Submit</button>
                        </Modal.Body>
                    </Modal>
                </Fragment>}
        </Fragment>
    )
}
