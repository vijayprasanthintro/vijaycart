import { Fragment, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { decreaseCartItemQty, increaseCartItemQty, removeItemFromCart } from '../../slices/cartSlice';
import { addCartItem } from '../../actions/cartActions';
import { getPricing, formatMoney, getDelivery } from '../../utils/productHelper';
import { toast } from 'react-toastify';

const SAVED_KEY = 'vijaycart_saved';
const FREE_SHIPPING_THRESHOLD = 499;
const SHIPPING_CHARGE = 40;

export default function Cart() {
    const { items } = useSelector(state => state.cartState)
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [saved, setSaved] = useState(() => {
        try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || []; } catch { return []; }
    });

    useEffect(() => {
        try { localStorage.setItem(SAVED_KEY, JSON.stringify(saved)); } catch { /* ignore */ }
    }, [saved]);

    const increaseQty = (item) => {
        if (item.stock === 0 || item.quantity >= item.stock) return;
        dispatch(increaseCartItemQty(item.product))
    }
    const decreaseQty = (item) => {
        if (item.quantity === 1) return;
        dispatch(decreaseCartItemQty(item.product))
    }

    const saveForLater = (item) => {
        setSaved(prev => [{ ...item }, ...prev]);
        dispatch(removeItemFromCart(item.product));
        toast('Saved for later', { type: 'info', position: toast.POSITION.BOTTOM_CENTER });
    };

    const moveBackToCart = (item) => {
        dispatch(addCartItem(item.product, item.quantity));
        setSaved(prev => prev.filter(i => i.product !== item.product));
        toast('Moved to Cart', { type: 'success', position: toast.POSITION.BOTTOM_CENTER });
    };

    const removeSaved = (id) => {
        setSaved(prev => prev.filter(i => i.product !== id));
        toast('Removed', { type: 'info', position: toast.POSITION.BOTTOM_CENTER });
    };

    const totalQty = items.reduce((acc, item) => acc + item.quantity, 0);
    const itemsPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const mrpPrice = items.reduce((acc, item) => acc + getPricing({ _id: item.product, price: item.price }).mrp * item.quantity, 0);
    const youSave = Math.max(0, mrpPrice - itemsPrice);
    const freeShipping = itemsPrice > FREE_SHIPPING_THRESHOLD;
    const shippingPrice = freeShipping ? 0 : SHIPPING_CHARGE;
    const totalPrice = itemsPrice + shippingPrice;
    const freeProgress = Math.min(100, Math.round((itemsPrice / FREE_SHIPPING_THRESHOLD) * 100));

    const checkoutHandler = () => {
        if (items.length === 0) return;
        navigate('/login?redirect=shipping');
    }

    const renderStockWarn = (item) => {
        const stock = Number(item.stock);
        if (stock <= 0) {
            return <div className="cart-stock-warn out"><i className="fa fa-exclamation-triangle" aria-hidden="true"></i> Out of stock</div>;
        }
        if (item.quantity >= stock) {
            return <div className="cart-stock-warn low"><i className="fa fa-exclamation-circle" aria-hidden="true"></i> Only {stock} left in stock</div>;
        }
        if (stock <= 5) {
            return <div className="cart-stock-warn low"><i className="fa fa-exclamation-circle" aria-hidden="true"></i> Only {stock} left</div>;
        }
        return null;
    };

    const renderItemCard = (item, isSaved) => {
        const pricing = getPricing({ _id: item.product, price: item.price });
        const delivery = getDelivery(item);
        const outOfStock = Number(item.stock) <= 0;
        const lineTotal = formatMoney(item.price * (item.quantity || 1));
        return (
            <div className="cart-item" key={item.product}>
                <div className="cart-item-main">
                    <Link to={`/product/${item.product}`} className="cart-item-img" title={item.name}>
                        <img src={item.image} alt={item.name} loading="lazy" />
                    </Link>
                    <div className="cart-item-body">
                        <Link to={`/product/${item.product}`} className="item-name">{item.name}</Link>
                        <div className="cart-price-line">
                            <span className="card-item-price">{formatMoney(item.price)}</span>
                            <span className="cart-mrp">{formatMoney(pricing.mrp)}</span>
                            <span className="cart-discount">-{pricing.discount}%</span>
                        </div>
                        <div className="cart-delivery"><i className="fa fa-truck" aria-hidden="true"></i> Free delivery by <strong>{delivery.by}</strong></div>
                        {renderStockWarn(item)}
                    </div>
                </div>
                <div className="cart-item-footer">
                    {isSaved ? (
                        <Fragment>
                            <span className="cart-line-total" style={{ marginRight: 'auto' }}>{lineTotal}</span>
                            <div className="cart-item-actions">
                                <button type="button" className="cart-move-btn" disabled={outOfStock} onClick={() => moveBackToCart(item)}>
                                    <i className="fa fa-shopping-cart mr-1" aria-hidden="true"></i>Move to Cart
                                </button>
                                <button type="button" aria-label="Remove saved item" className="delete-cart-item" onClick={() => removeSaved(item.product)}><i className="fa fa-trash"></i></button>
                            </div>
                        </Fragment>
                    ) : (
                        <Fragment>
                            <div className="qty-stepper">
                                <button type="button" className="qty-btn" onClick={() => decreaseQty(item)} disabled={item.quantity === 1} aria-label="Decrease quantity">−</button>
                                <input type="number" className="qty-input" value={item.quantity} readOnly aria-label="Quantity" />
                                <button type="button" className="qty-btn" onClick={() => increaseQty(item)} disabled={outOfStock || item.quantity >= Number(item.stock)} aria-label="Increase quantity">+</button>
                            </div>
                            <div className="cart-line-total"><span>Total</span><b>{lineTotal}</b></div>
                            <div className="cart-item-actions">
                                <button type="button" className="save-later-btn" onClick={() => saveForLater(item)}><i className="fa fa-clock-o mr-1" aria-hidden="true"></i>Save for later</button>
                                <button type="button" aria-label="Remove item" className="delete-cart-item" onClick={() => dispatch(removeItemFromCart(item.product))}><i className="fa fa-trash"></i></button>
                            </div>
                        </Fragment>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Fragment>
            <div className="cart-head">
                <h1 className="cart-title">My Cart <span className="cart-title-count">({items.length} item{items.length === 1 ? '' : 's'})</span></h1>
                <Link to="/search/all" className="cart-head-shopping d-none d-lg-inline-flex"><i className="fa fa-arrow-left mr-1" aria-hidden="true"></i>Continue Shopping</Link>
            </div>

            {items.length === 0 && saved.length === 0 ? (
                <div className="empty-state mt-4">
                    <div className="empty-icon"><i className="fa fa-shopping-cart" aria-hidden="true"></i></div>
                    <h2 className="empty-title">Your Cart is Empty</h2>
                    <p className="empty-sub">Looks like you haven't added anything yet. Explore our collections and find something you love.</p>
                    <Link to="/search/all" className="empty-cta"><i className="fa fa-shopping-bag mr-2" aria-hidden="true"></i>Start Shopping</Link>
                </div>
            ) : (
                <Fragment>
                    <div className="cart-layout">
                        <div className="row">
                            <div className="col-12 col-lg-8">
                                {items.length > 0 && (
                                    <div className="cart-free-bar">
                                        <i className="fa fa-truck" aria-hidden="true"></i>
                                        <div className="cart-free-body">
                                            <span>
                                                {freeShipping
                                                    ? <Fragment>Yay! You have unlocked <strong>FREE delivery</strong>.</Fragment>
                                                    : <Fragment>Add <strong>{formatMoney(FREE_SHIPPING_THRESHOLD - itemsPrice)}</strong> more to get <strong>FREE delivery</strong>.</Fragment>}
                                            </span>
                                            <div className="cart-free-progress" aria-hidden="true"><span style={{ width: `${freeProgress}%` }}></span></div>
                                        </div>
                                    </div>
                                )}

                                {items.length === 0 && (
                                    <div className="empty-state mt-2">
                                        <div className="empty-icon" style={{ width: 56, height: 56, fontSize: '1.4rem' }}><i className="fa fa-shopping-cart" aria-hidden="true"></i></div>
                                        <h2 className="empty-title" style={{ fontSize: '1.2rem' }}>Your cart is empty</h2>
                                        <p className="empty-sub">Checkout will start after you add items to your cart.</p>
                                    </div>
                                )}

                                {items.map(item => renderItemCard(item, false))}

                                {saved.length > 0 && (
                                    <div className="cart-save-later">
                                        <div className="section-head">
                                            <h2 className="section-title" style={{ fontSize: '1.2rem' }}>Saved for Later <span className="section-accent">({saved.length})</span></h2>
                                        </div>
                                        {saved.map(item => renderItemCard(item, true))}
                                    </div>
                                )}
                            </div>

                            <div className="col-12 col-lg-4 my-4 my-lg-0">
                                <div className="cart-summary">
                                    <div className="cart-summary-head">Price Details</div>
                                    <div className="summary-row">
                                        <span>Price ({totalQty} item{totalQty === 1 ? '' : 's'})</span>
                                        <b>{formatMoney(mrpPrice)}</b>
                                    </div>
                                    <div className="summary-row">
                                        <span>Discount</span>
                                        <b className="text-gold">−{formatMoney(youSave)}</b>
                                    </div>
                                    <div className="summary-row">
                                        <span>Delivery Charges</span>
                                        <b>{shippingPrice === 0 ? <span className="free-shipping-note">FREE</span> : formatMoney(shippingPrice)}</b>
                                    </div>
                                    <div className="summary-row summary-total">
                                        <span>Total Amount</span>
                                        <b>{formatMoney(totalPrice)}</b>
                                    </div>
                                    <div className="summary-save-note"><i className="fa fa-check-circle mr-1" aria-hidden="true"></i>You will save <strong>{formatMoney(youSave)}</strong> on this order</div>
                                    <button className="checkout-btn cart-checkout-btn" disabled={items.length === 0} onClick={checkoutHandler}>
                                        <i className="fa fa-lock mr-2" aria-hidden="true"></i>Proceed to Checkout
                                    </button>
                                    <Link to="/search/all" className="cart-continue"><i className="fa fa-arrow-left mr-1" aria-hidden="true"></i>Continue Shopping</Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {items.length > 0 && (
                        <div className="cart-mobile-bar d-lg-none">
                            <div className="cart-mobile-total">
                                <span>Total ({totalQty} items)</span>
                                <b>{formatMoney(totalPrice)}</b>
                            </div>
                            <button type="button" className="cart-mobile-checkout" onClick={checkoutHandler}>
                                Checkout <i className="fa fa-arrow-right" aria-hidden="true"></i>
                            </button>
                        </div>
                    )}
                </Fragment>
            )}
        </Fragment>
    )
}
