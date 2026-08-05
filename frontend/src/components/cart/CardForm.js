import { useState } from "react";
import { useElements, useStripe } from "@stripe/react-stripe-js";
import { CardNumberElement, CardExpiryElement, CardCvcElement } from "@stripe/react-stripe-js";
import axios from "axios";
import { toast } from "react-toastify";
import { formatMoney } from "../../utils/productHelper";

const cardStyle = {
    base: {
        color: '#212121',
        fontFamily: "'Inter', sans-serif",
        fontSize: '16px',
        '::placeholder': { color: '#a3a3a3' }
    }
};

export default function CardForm({ paymentData, billing, orderTotal, onSuccess, onFailure, onProcessing }) {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);

    const submitHandler = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            toast('Payment gateway is still loading. Please wait a moment and try again.', {
                type: 'warning',
                position: toast.POSITION.BOTTOM_CENTER
            });
            return;
        }

        setProcessing(true);
        onProcessing(true);
        try {
            const { data } = await axios.post('/api/v1/payment/process', paymentData)
            const clientSecret = data.client_secret
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardNumberElement),
                    billing_details: {
                        name: billing.name,
                        email: billing.email
                    }
                }
            })

            if (result.error) {
                onFailure(result.error.message);
                toast(result.error.message, { type: 'error', position: toast.POSITION.BOTTOM_CENTER });
                return;
            }

            if (result.paymentIntent.status !== 'succeeded') {
                onFailure('Payment was not completed. Please try again.');
                toast('Payment was not completed. Please try again.', { type: 'warning', position: toast.POSITION.BOTTOM_CENTER });
                return;
            }

            onSuccess({ id: result.paymentIntent.id, status: result.paymentIntent.status });
        } catch (error) {
            const msg = error?.response?.data?.message || error?.message || 'Payment failed';
            onFailure(msg);
            toast(msg, { type: 'error', position: toast.POSITION.BOTTOM_CENTER });
        } finally {
            setProcessing(false);
            onProcessing(false);
        }
    }

    return (
        <form onSubmit={submitHandler} noValidate>
            <div className="form-group">
                <label htmlFor="card_num_field">Card Number</label>
                <CardNumberElement
                    id="card_num_field"
                    className="pay-stripe-field"
                    options={{ style: cardStyle }}
                />
            </div>

            <div className="row">
                <div className="col-6">
                    <div className="form-group">
                        <label htmlFor="card_exp_field">Expiry Date</label>
                        <CardExpiryElement
                            id="card_exp_field"
                            className="pay-stripe-field"
                            options={{ style: cardStyle }}
                        />
                    </div>
                </div>
                <div className="col-6">
                    <div className="form-group">
                        <label htmlFor="card_cvc_field">CVC</label>
                        <CardCvcElement
                            id="card_cvc_field"
                            className="pay-stripe-field"
                            options={{ style: cardStyle }}
                        />
                    </div>
                </div>
            </div>

            <button type="submit" className="checkout-btn w-100" disabled={processing}>
                {processing ? <><i className="fa fa-spinner fa-spin mr-2" aria-hidden="true"></i>Processing...</>
                    : <><i className="fa fa-lock mr-2" aria-hidden="true"></i>Pay {formatMoney(orderTotal)}</>}
            </button>
            <p className="pay-hint mt-3"><i className="fa fa-info-circle mr-1" aria-hidden="true"></i>Test card: 4242 4242 4242 4242, any future expiry, any CVC. Use 4000 0000 0000 0002 to simulate a declined payment.</p>
        </form>
    )
}
