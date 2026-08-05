import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import MetaData from "../layouts/MetaData";
import CheckoutSteps from "./CheckoutStep";
import { getDeliveryLabel, formatMoney } from "../../utils/productHelper";
import { openInvoice } from "../../utils/invoice";

const METHOD_META = {
    upi: { label: 'UPI', icon: 'fa-mobile-screen' },
    card: { label: 'Credit / Debit Card', icon: 'fa-credit-card' },
    netbanking: { label: 'Net Banking', icon: 'fa-building-columns' },
    wallet: { label: 'VijayCart Wallet', icon: 'fa-wallet' },
    cod: { label: 'Cash on Delivery', icon: 'fa-hand-holding-dollar' },
};

export default function OrderSuccess() {
    const { orderDetail } = useSelector(state => state.orderState);
    const estSeed = (orderDetail.shippingInfo && orderDetail.shippingInfo.postalCode) || orderDetail._id || '';
    const isCod = orderDetail.paymentMethod === 'cod';
    const method = METHOD_META[orderDetail.paymentMethod] || (orderDetail.paymentInfo && orderDetail.paymentInfo.status === 'succeeded' ? { label: 'Card', icon: 'fa-credit-card' } : null);

    return (
        <>
            <MetaData title={'Order Confirmed'} />
            <CheckoutSteps confirmation />
            <div className="os-wrap">
                <div className="os-icon">
                    <i className="fa fa-check" aria-hidden="true"></i>
                </div>
                <h2 className="os-title">Order Placed Successfully!</h2>
                {orderDetail && orderDetail._id && (
                    <div className="os-id"><i className="fa fa-hashtag mr-1" aria-hidden="true"></i>Order ID: {orderDetail._id}</div>
                )}

                {orderDetail && orderDetail._id && (
                    <div className="os-meta">
                        <div className="os-meta-item">
                            <i className="fa fa-money-bill-wave" aria-hidden="true"></i>
                            <span>
                                <b>{formatMoney(orderDetail.totalPrice)}</b>
                                {isCod ? ' payable on delivery' : ' paid'}
                            </span>
                        </div>
                        {method && (
                            <div className="os-meta-item">
                                <i className={`fa ${method.icon}`} aria-hidden="true"></i>
                                <span><b>{method.label}</b>{isCod ? ' · pay in cash at your door' : ' · payment confirmed'}</span>
                            </div>
                        )}
                        {orderDetail.couponCode && (
                            <div className="os-meta-item">
                                <i className="fa fa-tag" aria-hidden="true"></i>
                                <span>Coupon <b>{orderDetail.couponCode}</b> applied</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="os-delivery"><i className="fa fa-truck mr-1" aria-hidden="true"></i>Delivery by <b>{getDeliveryLabel(estSeed)}</b></div>
                <p className="os-sub">
                    {isCod
                        ? 'Your order is confirmed and will be delivered soon. Please keep the amount ready for cash payment on delivery — thank you for shopping with VijayCart.'
                        : 'Your payment was successful and your premium products are on their way. A confirmation has been sent to your account — thank you for shopping with VijayCart.'}
                </p>
                <div className="os-actions">
                    {orderDetail && orderDetail._id && (
                        <Link to={`/order/${orderDetail._id}`} className="os-track"><i className="fa fa-map-marker mr-1" aria-hidden="true"></i>Track Order</Link>
                    )}
                    {orderDetail && orderDetail._id && (
                        <button type="button" className="os-invoice" onClick={() => openInvoice(orderDetail)}>
                            <i className="fa fa-file-invoice mr-1" aria-hidden="true"></i>Download Invoice
                        </button>
                    )}
                    <Link to="/orders" className="checkout-btn"><i className="fa fa-box-open mr-2" aria-hidden="true"></i>View My Orders</Link>
                    <Link to="/" className="os-continue"><i className="fa fa-home mr-1" aria-hidden="true"></i>Continue Shopping</Link>
                </div>

                <div className="os-support">
                    <i className="fa fa-headset" aria-hidden="true"></i>
                    <span>Need help with this order? Email <a href="mailto:help@vijaycart.com">help@vijaycart.com</a> or call <a href="tel:+918220477466">+91 82204 77466</a></span>
                </div>
            </div>
        </>
    )
}
