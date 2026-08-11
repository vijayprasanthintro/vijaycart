import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { applySeller, getMySellerApplication } from '../../actions/sellerActions';
import { clearSellerState } from '../../slices/sellerSlice';

const STORE_CATEGORIES = [
    'Electronics', 'Mobile Phones', 'Fashion', 'Home & Kitchen',
    'Beauty/Health', 'Sports', 'Books', 'Groceries', 'Others'
];

const STATUS_META = {
    pending: { label: 'Under Review', tone: 'warn' },
    approved: { label: 'Approved', tone: 'ok' },
    rejected: { label: 'Rejected', tone: 'bad' }
};

export default function SellerApply() {
    const { user, isAuthenticated } = useSelector(state => state.authState);
    const { application, submitting, error, isSubmitted } = useSelector(state => state.sellerState);
    const dispatch = useDispatch();

    const [form, setForm] = useState({
        storeName: '',
        storeCategory: '',
        storePhone: '',
        storeCity: '',
        gstin: ''
    });

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(getMySellerApplication());
        }
        return () => dispatch(clearSellerState());
    }, [isAuthenticated, dispatch]);

    useEffect(() => {
        if (error) {
            toast(error, { type: 'error', position: toast.POSITION.BOTTOM_CENTER });
            dispatch(clearSellerState());
        }
    }, [error, dispatch]);

    useEffect(() => {
        if (isSubmitted) {
            toast(application?.message || 'Your seller application has been submitted.', {
                type: 'success',
                position: toast.POSITION.BOTTOM_CENTER,
                onOpen: () => {
                    dispatch(getMySellerApplication());
                    dispatch(clearSellerState());
                }
            });
        }
    }, [isSubmitted, application, dispatch]);

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: name === 'storePhone' ? value.replace(/\D/g, '').slice(0, 10) : value }));
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            await dispatch(applySeller(form));
        } catch {
            // error toast handled via sellerState.error
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="sa-page">
                <div className="sa-hero">
                    <h1>Become a Seller on VijayCart</h1>
                    <p>Reach lakhs of customers. List your products, track sales and grow your business.</p>
                </div>
                <div className="sa-login-cta">
                    <h2>Sign in to get started</h2>
                    <p>You need a VijayCart account to apply as a seller.</p>
                    <Link to="/login" className="vc-btn vc-btn--primary">Sign In / Register</Link>
                </div>
                <div className="sa-perks">
                    <div><i className="fa fa-line-chart" aria-hidden="true"></i><b>Grow fast</b><span>Zero listing fees to start</span></div>
                    <div><i className="fa fa-rupee" aria-hidden="true"></i><b>On-time payouts</b><span>Regular settlement cycles</span></div>
                    <div><i className="fa fa-users" aria-hidden="true"></i><b>Large reach</b><span>Millions of active shoppers</span></div>
                </div>
            </div>
        );
    }

    if (user?.role === 'seller') {
        return (
            <div className="sa-page">
                <div className="sa-status sa-status--ok">
                    <i className="fa fa-briefcase" aria-hidden="true"></i>
                    <h1>You are already a seller</h1>
                    <p>Your seller account is active on VijayCart.</p>
                </div>
            </div>
        );
    }

    const meta = STATUS_META[application?.status];

    if (application && application.status !== 'rejected') {
        return (
            <div className="sa-page">
                <div className={`sa-status sa-status--${meta.tone}`}>
                    <i className={application.status === 'approved' ? 'fa fa-check-circle' : 'fa fa-clock-o'} aria-hidden="true"></i>
                    <h1>Application {meta.label}</h1>
                    <p>
                        {application.status === 'approved'
                            ? 'Congratulations! Your seller account is active on VijayCart.'
                            : 'Our team is reviewing your application. We will update you here once it is approved.'}
                    </p>
                    {application.adminNote && <div className="sa-note">{application.adminNote}</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="sa-page">
            <div className="sa-hero">
                <h1>Become a Seller on VijayCart</h1>
                <p>Reach lakhs of customers. List your products, track sales and grow your business.</p>
            </div>

            {application?.status === 'rejected' && (
                <div className="sa-status sa-status--bad">
                    <i className="fa fa-times-circle" aria-hidden="true"></i>
                    <h1>Your application was not approved</h1>
                    <p>{application.adminNote || 'Our team could not approve this application. You can update the details and apply again.'}</p>
                </div>
            )}

            <div className="sa-grid">
                <form onSubmit={submitHandler} className="sa-form">
                    <h2>Seller Application</h2>

                    <div className="form-group">
                        <label htmlFor="sa_store_name">Store Name</label>
                        <input
                            type="text"
                            id="sa_store_name"
                            className="form-control"
                            name="storeName"
                            value={form.storeName}
                            onChange={onChange}
                            required
                            placeholder="e.g. TechGuru Electronics"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="sa_store_category">Store Category</label>
                        <select
                            id="sa_store_category"
                            className="form-control"
                            name="storeCategory"
                            value={form.storeCategory}
                            onChange={onChange}
                            required
                        >
                            <option value="" disabled>Select a category</option>
                            {STORE_CATEGORIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="sa_store_phone">Store Contact Number</label>
                        <input
                            type="tel"
                            id="sa_store_phone"
                            className="form-control"
                            name="storePhone"
                            inputMode="numeric"
                            maxLength="10"
                            value={form.storePhone}
                            onChange={onChange}
                            required
                            placeholder="10-digit mobile number"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="sa_store_city">Store City</label>
                        <input
                            type="text"
                            id="sa_store_city"
                            className="form-control"
                            name="storeCity"
                            value={form.storeCity}
                            onChange={onChange}
                            required
                            placeholder="e.g. Bengaluru"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="sa_gstin">GSTIN (optional)</label>
                        <input
                            type="text"
                            id="sa_gstin"
                            className="form-control"
                            name="gstin"
                            value={form.gstin}
                            onChange={onChange}
                            maxLength="15"
                            placeholder="15-character GST number"
                        />
                    </div>

                    <button type="submit" className="vc-btn vc-btn--primary" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                </form>

                <aside className="sa-side">
                    <h3>How it works</h3>
                    <ol className="sa-steps">
                        <li><b>Apply</b><span>Fill in your store details in a minute.</span></li>
                        <li><b>Get approved</b><span>Our team reviews and verifies your store.</span></li>
                        <li><b>List products</b><span>Start adding products and manage your catalogue.</span></li>
                        <li><b>Earn</b><span>Receive orders and get paid on time.</span></li>
                    </ol>
                </aside>
            </div>
        </div>
    );
}
