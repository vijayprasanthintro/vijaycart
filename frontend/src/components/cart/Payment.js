import { Fragment, useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { orderCompleted, setOrderKey } from "../../slices/cartSlice";
import { validateShipping } from './Shipping';
import { createOrder } from '../../actions/orderActions';
import { clearError as clearOrderError } from "../../slices/orderSlice";
import { loadUser } from '../../actions/userActions';
import MetaData from "../layouts/MetaData";
import CheckoutSteps from "./CheckoutStep";
import CardForm from "./CardForm";
import { formatMoney, getDeliveryDay } from "../../utils/productHelper";

const METHODS = [
    { key: 'upi', label: 'UPI', icon: 'fa-mobile-screen', hint: 'Pay via Google Pay, PhonePe, Paytm & more' },
    { key: 'card', label: 'Credit / Debit Card', icon: 'fa-credit-card', hint: 'Visa, Mastercard, RuPay, Amex' },
    { key: 'netbanking', label: 'Net Banking', icon: 'fa-building-columns', hint: 'All major Indian banks supported' },
    { key: 'wallet', label: 'VijayCart Wallet', icon: 'fa-wallet', hint: 'Instant checkout using your balance' },
    { key: 'cod', label: 'Cash on Delivery', icon: 'fa-hand-holding-dollar', hint: 'Pay in cash when your order arrives' },
];

const UPI_APPS = [
    { key: 'gpay', name: 'Google Pay', icon: 'fa-google' },
    { key: 'phonepe', name: 'PhonePe', icon: 'fa-mobile-screen' },
    { key: 'paytm', name: 'Paytm', icon: 'fa-wallet' },
    { key: 'bhim', name: 'BHIM', icon: 'fa-landmark' },
];

const BANKS = [
    { id: 'sbi', name: 'State Bank of India', short: 'SBI' },
    { id: 'hdfc', name: 'HDFC Bank', short: 'HDFC' },
    { id: 'icici', name: 'ICICI Bank', short: 'ICICI' },
    { id: 'axis', name: 'Axis Bank', short: 'AXIS' },
    { id: 'kotak', name: 'Kotak Mahindra Bank', short: 'KOTAK' },
    { id: 'pnb', name: 'Punjab National Bank', short: 'PNB' },
    { id: 'boi', name: 'Bank of India', short: 'BOI' },
    { id: 'canara', name: 'Canara Bank', short: 'CANARA' },
    { id: 'fail', name: 'DEMO Bank (simulate failure)', short: 'DEMO' },
];

const SUPPORT = {
    email: 'help@vijaycart.com',
    phone: '+91 82204 77466',
};

const PROCESS_TEXT = {
    upi: 'Confirming your UPI payment…',
    card: 'Processing your card payment…',
    netbanking: 'Redirecting to your bank…',
    wallet: 'Deducting from your wallet…',
    cod: 'Placing your order…',
};

const METHOD_META = {
    upi: 'UPI',
    card: 'Credit / Debit Card',
    netbanking: 'Net Banking',
    wallet: 'VijayCart Wallet',
    cod: 'Cash on Delivery',
};

const simulateGateway = (shouldFail) => new Promise((resolve) => {
    const ref = 'TXN' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 7).toUpperCase();
    setTimeout(() => {
        if (shouldFail) {
            resolve({ ok: false, ref, message: 'Your bank or UPI provider declined the transaction. No amount was charged to your account.' });
        } else {
            resolve({ ok: true, ref });
        }
    }, 1700 + Math.random() * 900);
});

export default function Payment() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const orderInfo = JSON.parse(sessionStorage.getItem('orderInfo'))
    const { user } = useSelector(state => state.authState)
    const { items: cartItems, shippingInfo, orderKey } = useSelector(state => state.cartState)
    const { error: orderError } = useSelector(state => state.orderState)

    const total = Number(orderInfo ? orderInfo.totalPrice : 0);
    const discountPrice = Number(orderInfo ? orderInfo.discountPrice : 0);

    const [method, setMethod] = useState('upi');
    const [processing, setProcessing] = useState(null);
    const [failure, setFailure] = useState(null);
    const [methodError, setMethodError] = useState({});

    // UPI
    const [upiId, setUpiId] = useState('');
    const [upiApp, setUpiApp] = useState('gpay');
    // Net Banking
    const [nbBank, setNbBank] = useState('');
    // Wallet
    const [walletBalance, setWalletBalance] = useState(null);
    // Stripe
    const [stripePromise, setStripePromise] = useState(null);
    const [cardUnavailable, setCardUnavailable] = useState('');
    // COD availability for the shipping pincode
    const [codCheck, setCodCheck] = useState({ loading: false, available: null, reason: '', maxAmount: 5000 });

    const paymentData = {
        amount: Math.round(total * 100),
        shipping: {
            name: user.name,
            address: {
                city: shippingInfo.city,
                postal_code: shippingInfo.postalCode,
                country: shippingInfo.country,
                state: shippingInfo.state,
                line1: shippingInfo.address
            },
            phone: shippingInfo.phoneNo
        }
    }

    useEffect(() => {
        validateShipping(shippingInfo, navigate)
        if (orderError) {
            toast(orderError, {
                position: toast.POSITION.BOTTOM_CENTER,
                type: 'error',
                onOpen: () => { dispatch(clearOrderError()) }
            })
        }
    }, [dispatch, navigate, orderError, shippingInfo])

    const ensureStripe = useCallback(async () => {
        if (stripePromise) return stripePromise;
        const { data } = await axios.get('/api/v1/stripeapi');
        const p = loadStripe(data.stripeApiKey);
        setStripePromise(p);
        return p;
    }, [stripePromise]);

    useEffect(() => {
        if (method === 'card') {
            ensureStripe().catch(() => setCardUnavailable('Card payments are unavailable right now. Please choose another method.'));
        }
    }, [method, ensureStripe]);

    useEffect(() => {
        let active = true;
        if (method === 'wallet' && walletBalance === null) {
            axios.get('/api/v1/wallet')
                .then(res => { if (active) setWalletBalance(Number(res?.data?.balance)); })
                .catch(() => { if (active) setWalletBalance(Number(user.walletBalance) || 500); });
        }
        return () => { active = false; };
    }, [method, walletBalance, user.walletBalance]);

    // COD availability for the delivery pincode (reads store settings server-side).
    useEffect(() => {
        const postal = String(shippingInfo.postalCode || '').replace(/[^0-9]/g, '');
        if (!postal || postal.length < 3) {
            setCodCheck({ loading: false, available: null, reason: '', maxAmount: 5000 });
            return;
        }
        let active = true;
        setCodCheck(c => ({ ...c, loading: true }));
        axios.get(`/api/v1/pincode/${postal}/cod?amount=${Math.round(Number(total) || 0)}`)
            .then(res => {
                if (active) setCodCheck({
                    loading: false,
                    available: !!res?.data?.available,
                    reason: res?.data?.reason || '',
                    maxAmount: Number(res?.data?.maxAmount) || 5000
                });
            })
            .catch(() => {
                if (active) setCodCheck({ loading: false, available: null, reason: 'Could not verify COD availability for your pincode.', maxAmount: 5000 });
            });
        return () => { active = false; };
    }, [shippingInfo.postalCode, total]);

    // If the selected method becomes unavailable (e.g. amount exceeds the COD
    // limit as the cart changes), fall back to the default method.
    useEffect(() => {
        if (method === 'cod' && codCheck.available === false) setMethod('upi');
    }, [method, codCheck.available]);

    const generateOrderKey = () =>
        (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : `ord_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const buildOrder = (paymentInfo, paymentMethod, key) => ({
        orderItems: cartItems,
        shippingInfo,
        itemsPrice: orderInfo ? orderInfo.itemsPrice : 0,
        shippingPrice: orderInfo ? orderInfo.shippingPrice : 0,
        taxPrice: orderInfo ? orderInfo.taxPrice : 0,
        totalPrice: total,
        discountPrice,
        couponCode: orderInfo ? orderInfo.couponCode : '',
        paymentInfo,
        paymentMethod,
        // Idempotency key so a retried submit can never duplicate the order.
        orderKey: key
    });

    const completePayment = async (paymentInfo, paymentMethod) => {
        // Guarantee an idempotency key exists for this checkout session even
        // if the user navigated straight here (e.g. after a refresh).
        const key = orderKey || generateOrderKey();
        if (!orderKey) dispatch(setOrderKey(key));
        const order = buildOrder(paymentInfo, paymentMethod, key);
        try {
            await dispatch(createOrder(order));
            dispatch(orderCompleted());
            navigate('/order/success');
        } catch (err) {
            // The request may have failed AFTER the server already created the
            // order (dropped connection / timeout / cold start). Retrying with
            // the SAME idempotency key makes the backend return the existing
            // order instead of creating a duplicate, so a confirmed payment
            // always reaches the success page — never only after going back.
            try {
                await dispatch(createOrder(order));
                dispatch(orderCompleted());
                navigate('/order/success');
            } catch (retryErr) {
                toast.error(retryErr?.response?.data?.message || 'Your order could not be created. Please retry.');
                setProcessing(null);
            }
        }
    };

    const handleUpIPay = async () => {
        const vpa = upiId.trim().toLowerCase();
        if (!/^[a-z0-9._-]{3,}@[a-z]{2,}$/.test(vpa)) {
            setMethodError(p => ({ ...p, upi: 'Enter a valid UPI ID, e.g. yourname@upi' }));
            return;
        }
        setMethodError(p => ({ ...p, upi: '' }));
        setFailure(null);
        setProcessing('upi');
        const res = await simulateGateway(vpa.includes('fail'));
        if (!res.ok) {
            setFailure({ method: 'upi', message: res.message, ref: res.ref });
            setProcessing(null);
            return;
        }
        toast.success('Payment Successful!');
        await completePayment({ id: res.ref, status: 'succeeded' }, 'upi');
    };

    const handleNetBankingPay = async () => {
        if (!nbBank) {
            setMethodError(p => ({ ...p, netbanking: 'Please select your bank to continue' }));
            return;
        }
        setMethodError(p => ({ ...p, netbanking: '' }));
        setFailure(null);
        setProcessing('netbanking');
        const res = await simulateGateway(nbBank === 'fail');
        if (!res.ok) {
            setFailure({ method: 'netbanking', message: res.message, ref: res.ref });
            setProcessing(null);
            return;
        }
        toast.success('Payment Successful!');
        await completePayment({ id: res.ref, status: 'succeeded' }, 'netbanking');
    };

    const handleWalletPay = async () => {
        const balance = Number(walletBalance) || 0;
        if (balance < total) {
            setMethodError(p => ({ ...p, wallet: `Insufficient wallet balance. You need ${formatMoney(total - balance)} more.` }));
            return;
        }
        setMethodError(p => ({ ...p, wallet: '' }));
        setFailure(null);
        setProcessing('wallet');
        try {
            const { data } = await axios.post('/api/v1/payment/wallet', { amount: total });
            setWalletBalance(Number(data.balance));
            dispatch(loadUser());
            toast.success('Payment Successful!');
            await completePayment({ id: 'WAL' + Date.now().toString(36).toUpperCase(), status: 'succeeded' }, 'wallet');
        } catch (err) {
            const msg = err?.response?.data?.message || 'Wallet payment failed. Please try again.';
            setFailure({ method: 'wallet', message: msg, ref: '' });
            setProcessing(null);
            toast.error(msg);
        }
    };

    const handleCodPlace = async () => {
        if (codCheck.available === false) {
            toast.error(codCheck.reason || 'Cash on Delivery is not available for this order.');
            return;
        }
        setFailure(null);
        setProcessing('cod');
        await completePayment({ id: 'COD' + Date.now().toString(36).toUpperCase(), status: 'COD' }, 'cod');
    };

    const handleCardSuccess = (paymentInfo) => {
        toast.success('Payment Successful!');
        completePayment(paymentInfo, 'card');
    };

    const handleCardFailure = (msg) => {
        setFailure({ method: 'card', message: msg, ref: '' });
    };

    const retryPayment = () => {
        setFailure(null);
        setMethodError({});
    };

    if (!orderInfo) {
        return (
            <Fragment>
                <MetaData title={'Payment'} />
                <CheckoutSteps payment />
                <div className="empty-state mt-4">
                    <div className="empty-icon"><i className="fa fa-credit-card" aria-hidden="true"></i></div>
                    <h2 className="empty-title">No order to pay for</h2>
                    <p className="empty-sub">Your checkout session has expired. Please review your cart and place the order again.</p>
                    <button type="button" className="empty-cta" onClick={() => navigate('/cart')}><i className="fa fa-shopping-cart mr-2" aria-hidden="true"></i>Go to Cart</button>
                </div>
            </Fragment>
        )
    }

    return (
        <Fragment>
            <MetaData title={'Payment'} />
            <CheckoutSteps payment />
            <div className="co-layout">
                <div className="row">
                    <div className="col-12 col-lg-7">
                        <div className="co-card pay-card">
                            <div className="co-card-head">
                                <div><i className="fa fa-credit-card mr-2" aria-hidden="true"></i>Payment Options</div>
                                <span className="pay-secure"><i className="fa fa-lock mr-1" aria-hidden="true"></i>100% Secure</span>
                            </div>

                            <div className="pm-methods">
                                {METHODS.map(m => {
                                    const codDisabled = m.key === 'cod' && codCheck.available === false;
                                    const hint = m.key !== 'cod' ? m.hint
                                        : codCheck.loading ? 'Checking availability at your pincode…'
                                        : codDisabled ? codCheck.reason
                                        : m.hint;
                                    return (
                                        <button
                                            type="button"
                                            key={m.key}
                                            className={`pm-method ${method === m.key ? 'active' : ''} ${codDisabled ? 'pm-method--disabled' : ''}`}
                                            disabled={codDisabled}
                                            onClick={() => { if (codDisabled) return; setMethod(m.key); setFailure(null); setMethodError({}); }}
                                        >
                                            <span className="pm-radio" aria-hidden="true">{method === m.key && <span></span>}</span>
                                            <i className={`fa ${m.icon}`} aria-hidden="true"></i>
                                            <span className="pm-method-body">
                                                <b>{m.label}</b>
                                                <small>{hint}</small>
                                            </span>
                                            {method === m.key && <i className="fa fa-chevron-down pm-chev" aria-hidden="true"></i>}
                                        </button>
                                    );
                                })}
                            </div>

                            {failure && (
                                <div className="pm-failure">
                                    <div className="pm-failure-ico"><i className="fa fa-circle-xmark" aria-hidden="true"></i></div>
                                    <div className="pm-failure-body">
                                        <b>Payment Failed</b>
                                        <p>{failure.message}</p>
                                        {failure.ref && <span className="pm-failure-ref">Reference: {failure.ref}</span>}
                                        <div className="pm-failure-actions">
                                            <button type="button" className="checkout-btn" onClick={retryPayment}>
                                                <i className="fa fa-rotate-right mr-1" aria-hidden="true"></i>Retry Payment
                                            </button>
                                            <button type="button" className="pm-failure-alt" onClick={retryPayment}>
                                                Try another method
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!failure && (
                                <div className="pm-panel">
                                    {method === 'upi' && (
                                        <div className="pm-upi">
                                            <div className="pm-upi-apps">
                                                {UPI_APPS.map(app => (
                                                    <button
                                                        type="button"
                                                        key={app.key}
                                                        className={`pm-upi-app ${upiApp === app.key ? 'active' : ''}`}
                                                        onClick={() => setUpiApp(app.key)}
                                                    >
                                                        <i className={`fa ${app.icon}`} aria-hidden="true"></i>
                                                        <span>{app.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="upi_id">Enter your UPI ID</label>
                                                <input
                                                    id="upi_id"
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="yourname@upi"
                                                    value={upiId}
                                                    onChange={e => setUpiId(e.target.value)}
                                                />
                                                {methodError.upi && <p className="form-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{methodError.upi}</p>}
                                                <p className="pay-hint text-left mt-2"><i className="fa fa-info-circle mr-1" aria-hidden="true"></i>Demo: use <b>name@upi</b> for success. Adding <b>fail</b> to the ID (e.g. <b>fail@upi</b>) simulates a failed payment.</p>
                                            </div>
                                            <button type="button" className="checkout-btn w-100" onClick={handleUpIPay} disabled={processing}>
                                                <i className="fa fa-lock mr-2" aria-hidden="true"></i>Pay {formatMoney(total)} via {UPI_APPS.find(a => a.key === upiApp).name}
                                            </button>
                                        </div>
                                    )}

                                    {method === 'card' && (
                                        <div>
                                            {cardUnavailable ? (
                                                <p className="form-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{cardUnavailable}</p>
                                            ) : !stripePromise ? (
                                                <p className="pay-hint"><i className="fa fa-spinner fa-spin mr-1" aria-hidden="true"></i>Loading secure card gateway…</p>
                                            ) : (
                                                <Elements stripe={stripePromise}>
                                                    <CardForm
                                                        paymentData={paymentData}
                                                        billing={{ name: user.name, email: user.email }}
                                                        orderTotal={total}
                                                        onSuccess={handleCardSuccess}
                                                        onFailure={handleCardFailure}
                                                        onProcessing={(v) => setProcessing(v ? 'card' : null)}
                                                    />
                                                </Elements>
                                            )}
                                        </div>
                                    )}

                                    {method === 'netbanking' && (
                                        <div>
                                            <div className="pm-bank-grid">
                                                {BANKS.map(bank => (
                                                    <button
                                                        type="button"
                                                        key={bank.id}
                                                        className={`pm-bank ${nbBank === bank.id ? 'active' : ''}`}
                                                        onClick={() => setNbBank(bank.id)}
                                                    >
                                                        <span className="pm-bank-short">{bank.short}</span>
                                                        <span className="pm-bank-name">{bank.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            {methodError.netbanking && <p className="form-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{methodError.netbanking}</p>}
                                            <button type="button" className="checkout-btn w-100" onClick={handleNetBankingPay} disabled={processing}>
                                                <i className="fa fa-lock mr-2" aria-hidden="true"></i>Pay {formatMoney(total)} via Net Banking
                                            </button>
                                        </div>
                                    )}

                                    {method === 'wallet' && (
                                        <div className="pm-wallet">
                                            <div className="pm-wallet-balance">
                                                <i className="fa fa-wallet" aria-hidden="true"></i>
                                                <div>
                                                    <span className="pm-wallet-label">Wallet Balance</span>
                                                    <b className="pm-wallet-amt">{walletBalance === null ? <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> : formatMoney(walletBalance)}</b>
                                                </div>
                                            </div>
                                            <div className="pm-wallet-total">
                                                <span>Payable amount</span>
                                                <b>{formatMoney(total)}</b>
                                            </div>
                                            {methodError.wallet && <p className="form-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{methodError.wallet}</p>}
                                            <button type="button" className="checkout-btn w-100" onClick={handleWalletPay} disabled={processing || walletBalance === null}>
                                                <i className="fa fa-lock mr-2" aria-hidden="true"></i>Pay {formatMoney(total)} from Wallet
                                            </button>
                                            <p className="pay-hint"><i className="fa fa-info-circle mr-1" aria-hidden="true"></i>Wallet balance is deducted instantly. Earn 2% back on every wallet order.</p>
                                        </div>
                                    )}

                                    {method === 'cod' && (
                                        <div className="pm-cod">
                                            {codCheck.loading ? (
                                                <p className="pay-hint"><i className="fa fa-spinner fa-spin mr-1" aria-hidden="true"></i>Checking Cash on Delivery availability at your pincode…</p>
                                            ) : (
                                                <Fragment>
                                                    <div className="pm-cod-note">
                                                        <i className="fa fa-hand-holding-dollar" aria-hidden="true"></i>
                                                        <p>Please keep <b>{formatMoney(total)}</b> ready in cash when your order arrives. Our delivery partner will collect the payment at your doorstep.</p>
                                                    </div>
                                                    <ul className="pm-cod-list">
                                                        <li><i className="fa fa-check" aria-hidden="true"></i>No advance payment needed</li>
                                                        <li><i className="fa fa-check" aria-hidden="true"></i>Inspect your order before paying</li>
                                                        <li><i className="fa fa-check" aria-hidden="true"></i>Available for orders up to {formatMoney(codCheck.maxAmount)}</li>
                                                    </ul>
                                                    <button type="button" className="checkout-btn w-100" onClick={handleCodPlace} disabled={processing}>
                                                        <i className="fa fa-box mr-2" aria-hidden="true"></i>Place Order — Pay {formatMoney(total)} on Delivery
                                                    </button>
                                                </Fragment>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="co-card co-support">
                            <div className="co-card-head">
                                <div><i className="fa fa-headset mr-2" aria-hidden="true"></i>Payment Support</div>
                            </div>
                            <div className="co-support-body">
                                <div className="co-support-item">
                                    <i className="fa fa-envelope" aria-hidden="true"></i>
                                    <span>Payment issues? Email <a href={`mailto:${SUPPORT.email}`}>{SUPPORT.email}</a> and we will resolve it within 24 hours.</span>
                                </div>
                                <div className="co-support-item">
                                    <i className="fa fa-phone" aria-hidden="true"></i>
                                    <span>Call <a href={`tel:${SUPPORT.phone.replace(/\s/g, '')}`}>{SUPPORT.phone}</a> for instant help with your payment.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-lg-5 my-4 my-lg-0">
                        <div className="cart-summary co-summary">
                            <div className="cart-summary-head">Order Summary</div>
                            <div className="summary-row">
                                <span>Items</span>
                                <b>{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</b>
                            </div>
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <b>{orderInfo ? formatMoney(orderInfo.itemsPrice) : formatMoney(0)}</b>
                            </div>
                            <div className="summary-row">
                                <span>Delivery Charges</span>
                                <b>{orderInfo && Number(orderInfo.shippingPrice) === 0 ? <span className="free-shipping-note">FREE</span> : (orderInfo ? formatMoney(orderInfo.shippingPrice) : formatMoney(0))}</b>
                            </div>
                            <div className="summary-row">
                                <span>Tax</span>
                                <b>{orderInfo ? formatMoney(orderInfo.taxPrice) : formatMoney(0)}</b>
                            </div>
                            {discountPrice > 0 && (
                                <div className="summary-row summary-coupon-row">
                                    <span><i className="fa fa-tag mr-1" aria-hidden="true"></i>Coupon {orderInfo.couponCode ? `(${orderInfo.couponCode})` : 'Discount'}</span>
                                    <b className="text-coupon">&minus;{formatMoney(discountPrice)}</b>
                                </div>
                            )}
                            <div className="summary-row summary-total">
                                <span>Total Amount</span>
                                <b>{formatMoney(total)}</b>
                            </div>
                            <div className="pm-method-confirm">
                                <span>Paying via</span>
                                <b><i className={`fa ${METHODS.find(m => m.key === method).icon} mr-1`} aria-hidden="true"></i>{METHOD_META[method]}</b>
                            </div>
                            <div className="co-pay-address">
                                <div className="co-pay-address-label">Delivering to</div>
                                <div className="co-pay-address-line">
                                    {shippingInfo.name || user.name} &middot; {shippingInfo.city}, {shippingInfo.state} {shippingInfo.postalCode}
                                </div>
                                <div className="de-pill"><i className="fa fa-truck mr-1" aria-hidden="true"></i>Delivery by <b>{getDeliveryDay(shippingInfo.postalCode)}</b></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {processing && (
                <div className="pp-overlay">
                    <div className="pp-modal">
                        <div className="pp-spinner"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i></div>
                        <b className="pp-title">{PROCESS_TEXT[processing]}</b>
                        <p className="pp-sub">Please do not close or refresh this page while your payment is being processed.</p>
                    </div>
                </div>
            )}
        </Fragment>
    )
}
