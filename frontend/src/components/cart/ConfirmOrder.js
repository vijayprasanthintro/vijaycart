import MetaData from '../layouts/MetaData';
import { Fragment, useEffect, useState } from 'react';
import { validateShipping } from './Shipping';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import CheckoutSteps from './CheckoutStep';
import { setCoupon, clearCoupon, setOrderKey } from '../../slices/cartSlice';
import { formatMoney, getPricing, getDeliveryLabel, getDeliveryDay, resolveProductImage, imgOnError } from '../../utils/productHelper';
import { toast } from 'react-toastify';
import axios from 'axios';

const generateOrderKey = () =>
    (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `ord_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const TYPES = {
    home: { label: 'Home', icon: 'fa-house' },
    work: { label: 'Work', icon: 'fa-briefcase' },
    other: { label: 'Other', icon: 'fa-location-dot' },
};

const SUPPORT = {
    email: 'help@vijaycart.com',
    phone: '+91 82204 77466',
};

const COUPON_EXAMPLES = ['VJ10', 'SAVE20', 'FREESHIP'];

export default function ConfirmOrder () {
    const { shippingInfo, items:cartItems, coupon, orderKey } = useSelector(state => state.cartState);
    const { user } = useSelector(state => state.authState);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [couponInput, setCouponInput] = useState(coupon ? coupon.code : '');
    const [couponBusy, setCouponBusy] = useState(false);
    const [couponError, setCouponError] = useState('');

    const itemsPrice = cartItems.reduce((acc, item)=> (acc + item.price * item.quantity),0);
    const mrpPrice = cartItems.reduce((acc, item)=> (acc + getPricing({ _id: item.product, price: item.price }).mrp * item.quantity),0);
    const youSave = Math.max(0, mrpPrice - itemsPrice);
    const shippingPrice = itemsPrice > 499 ? 0 : 40;
    let taxPrice = Number(0.05 * itemsPrice);
    const couponDiscount = coupon ? Math.min(Number(coupon.discount) || 0, itemsPrice) : 0;
    const totalPrice = Number(itemsPrice + shippingPrice + taxPrice - couponDiscount).toFixed(2);
    taxPrice = Number(taxPrice).toFixed(2)
    const totalQty = cartItems.reduce((acc, item)=> (acc + item.quantity),0);
    const type = shippingInfo.type ? (TYPES[shippingInfo.type] || TYPES.other) : null;

    const applyCoupon = async (e) => {
        e.preventDefault();
        const code = couponInput.trim();
        if (!code) {
            setCouponError('Please enter a coupon code');
            return;
        }
        setCouponBusy(true);
        setCouponError('');
        try {
            const { data } = await axios.post('/api/v1/coupon/validate', { code, amount: itemsPrice });
            const applied = {
                code: data.coupon.code,
                discount: Number(data.discount),
                discountType: data.coupon.discountType,
                description: data.coupon.description || '',
            };
            dispatch(setCoupon(applied));
            toast.success(`Coupon ${data.coupon.code} applied — you save ${formatMoney(data.discount)}!`);
        } catch (err) {
            setCouponError(err?.response?.data?.message || 'Could not apply this coupon');
            toast.error(err?.response?.data?.message || 'Could not apply this coupon');
        } finally {
            setCouponBusy(false);
        }
    };

    const removeCoupon = () => {
        dispatch(clearCoupon());
        setCouponInput('');
        setCouponError('');
        toast.info('Coupon removed');
    };

    const processPayment = () => {
        const data = {
            itemsPrice,
            shippingPrice,
            taxPrice,
            totalPrice,
            couponCode: coupon ? coupon.code : '',
            discountPrice: couponDiscount
        }
        sessionStorage.setItem('orderInfo', JSON.stringify(data))
        // Idempotency key for this checkout session. Generated once here and
        // reused on every payment attempt so retries (refresh, double-click,
        // network error) can never create a second order on the server.
        if (!orderKey) {
            dispatch(setOrderKey(generateOrderKey()))
        }
        navigate('/payment')
    }

    useEffect(()=>{
        validateShipping(shippingInfo, navigate)
    },[shippingInfo, navigate])

    return (
        <Fragment>
            <MetaData title={'Order Summary'} />
            <CheckoutSteps confirmOrder />
            <div className="co-layout">
                <div className="row">
                    <div className="col-12 col-lg-8">
                        <div className="co-card">
                            <div className="co-card-head">
                                <div><i className="fa fa-location-dot mr-2" aria-hidden="true"></i>Delivery Address</div>
                                <Link to="/shipping" className="co-change"><i className="fa fa-pencil mr-1" aria-hidden="true"></i>Change</Link>
                            </div>
                            <div className="co-address">
                                <div className="co-address-name">
                                    {shippingInfo.name || user.name}
                                    {type && <span className={`addr-tag ${shippingInfo.type}`}><i className={`fa ${type.icon} mr-1`} aria-hidden="true"></i>{type.label}</span>}
                                </div>
                                <p className="co-address-line">{shippingInfo.address}{shippingInfo.landmark ? `, ${shippingInfo.landmark}` : ''}, {shippingInfo.city}, {shippingInfo.state} {shippingInfo.postalCode}</p>
                                <div className="addr-meta"><i className="fa fa-phone" aria-hidden="true"></i>{shippingInfo.phoneNo} &middot; {shippingInfo.country}</div>
                                {shippingInfo.instructions && <div className="addr-meta addr-inst"><i className="fa fa-note-sticky mr-1" aria-hidden="true"></i>{shippingInfo.instructions}</div>}
                                <div className="de-pill"><i className="fa fa-truck mr-1" aria-hidden="true"></i>Delivery by <b>{getDeliveryLabel(shippingInfo.postalCode)}</b></div>
                            </div>
                        </div>

                        <div className="co-card">
                            <div className="co-card-head">
                                <div><i className="fa fa-shopping-bag mr-2" aria-hidden="true"></i>Items in your order <span className="section-accent">({totalQty})</span></div>
                            </div>
                            {cartItems.map((item, idx) => {
                                const lineTotal = formatMoney(item.price * item.quantity);
                                return (
                                    <div className="co-item" key={item.product} style={{ animationDelay: `${idx * 0.06}s` }}>
                                        <Link to={`/product/${item.product}`} className="co-item-img">
                                            <img src={resolveProductImage(item.image)} alt={item.name} loading="lazy" onError={imgOnError} />
                                        </Link>
                                        <div className="co-item-body">
                                            <Link to={`/product/${item.product}`} className="co-item-name">{item.name}</Link>
                                            <div className="co-item-meta">
                                                <span className="co-item-qty">Qty: {item.quantity}</span>
                                                <span className="co-item-price">{formatMoney(item.price)}</span>
                                            </div>
                                        </div>
                                        <div className="co-item-total">{lineTotal}</div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="co-card co-support">
                            <div className="co-card-head">
                                <div><i className="fa fa-headset mr-2" aria-hidden="true"></i>Need help with your order?</div>
                            </div>
                            <div className="co-support-body">
                                <div className="co-support-item">
                                    <i className="fa fa-envelope" aria-hidden="true"></i>
                                    <span><b>Email support</b>Write to us at <a href={`mailto:${SUPPORT.email}`}>{SUPPORT.email}</a> — we reply within 24 hours.</span>
                                </div>
                                <div className="co-support-item">
                                    <i className="fa fa-phone" aria-hidden="true"></i>
                                    <span><b>Call us</b>Reach our helpline at <a href={`tel:${SUPPORT.phone.replace(/\s/g, '')}`}>{SUPPORT.phone}</a> (Mon–Sat, 9 AM – 7 PM).</span>
                                </div>
                                <div className="co-support-item">
                                    <i className="fa fa-circle-question" aria-hidden="true"></i>
                                    <span><b>Order help</b>Track, cancel or return your order anytime from the <Link to="/orders">My Orders</Link> page.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-lg-4 my-4 my-lg-0">
                        <div className="cart-summary co-summary">
                            <div className="cart-summary-head">Price Details</div>
                            <div className="summary-row">
                                <span>Price ({totalQty} item{totalQty === 1 ? '' : 's'})</span>
                                <b>{formatMoney(mrpPrice)}</b>
                            </div>
                            <div className="summary-row">
                                <span>Discount</span>
                                <b className="text-gold">&minus;{formatMoney(youSave)}</b>
                            </div>
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <b>{formatMoney(itemsPrice)}</b>
                            </div>
                            <div className="summary-row">
                                <span>Delivery Charges</span>
                                <b>{shippingPrice === 0 ? <span className="free-shipping-note">FREE</span> : formatMoney(shippingPrice)}</b>
                            </div>
                            <div className="summary-row">
                                <span>Tax (5%)</span>
                                <b>{formatMoney(taxPrice)}</b>
                            </div>
                            {coupon && couponDiscount > 0 && (
                                <div className="summary-row summary-coupon-row">
                                    <span><i className="fa fa-tag mr-1" aria-hidden="true"></i>Coupon ({coupon.code})</span>
                                    <b className="text-coupon">&minus;{formatMoney(couponDiscount)}</b>
                                </div>
                            )}
                            <div className="summary-row summary-total">
                                <span>Total Amount</span>
                                <b>{formatMoney(totalPrice)}</b>
                            </div>
                            <div className="summary-save-note"><i className="fa fa-check-circle mr-1" aria-hidden="true"></i>You will save <strong>{formatMoney(youSave + couponDiscount)}</strong> on this order</div>

                            <div className={`co-coupon ${coupon ? 'applied' : ''}`}>
                                {coupon ? (
                                    <div className="co-coupon-applied">
                                        <div className="co-coupon-applied-info">
                                            <i className="fa fa-check-circle" aria-hidden="true"></i>
                                            <span><b>{coupon.code}</b>{coupon.description ? ` — ${coupon.description}` : ''}</span>
                                        </div>
                                        <button type="button" className="co-coupon-remove" onClick={removeCoupon}><i className="fa fa-times mr-1" aria-hidden="true"></i>Remove</button>
                                    </div>
                                ) : (
                                    <form onSubmit={applyCoupon} noValidate>
                                        <label className="co-coupon-label" htmlFor="co_coupon">Have a coupon code?</label>
                                        <div className="co-coupon-input">
                                            <i className="fa fa-tag" aria-hidden="true"></i>
                                            <input
                                                id="co_coupon"
                                                type="text"
                                                placeholder="Enter coupon code"
                                                value={couponInput}
                                                onChange={e => setCouponInput(e.target.value.toUpperCase())}
                                                disabled={couponBusy}
                                            />
                                            <button type="submit" className="co-coupon-btn" disabled={couponBusy}>
                                                {couponBusy ? <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> : 'Apply'}
                                            </button>
                                        </div>
                                        {couponError && <p className="co-coupon-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{couponError}</p>}
                                        <div className="co-coupon-examples">
                                            <span>Try:</span>
                                            {COUPON_EXAMPLES.map(c => (
                                                <button key={c} type="button" onClick={() => setCouponInput(c)}>{c}</button>
                                            ))}
                                        </div>
                                    </form>
                                )}
                            </div>

                            <div className="de-pill de-pill--summary"><i className="fa fa-truck mr-1" aria-hidden="true"></i>Delivery by <b>{getDeliveryDay(shippingInfo.postalCode)}</b> &middot; Free</div>
                            <button className="checkout-btn w-100" onClick={processPayment}>
                                <i className="fa fa-lock mr-2" aria-hidden="true"></i>Proceed to Payment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    )
}
