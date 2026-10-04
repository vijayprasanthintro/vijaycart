import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSettings, updateSettings, clearSettingsState } from '../../actions/settingActions';
import { toast } from 'react-toastify';

export default function Settings() {
    const { settings, loading, error, isUpdated } = useSelector(state => state.settingState);
    const dispatch = useDispatch();

    const [form, setForm] = useState({
        storeName: '',
        storeTagline: '',
        currency: 'INR',
        supportEmail: '',
        supportPhone: '',
        announcement: '',
        shippingFee: 40,
        freeShippingAbove: 499,
        deliveryEstimateDays: 5,
        prepaidEnabled: true,
        stripeEnabled: true,
        codEnabled: true,
        codMaxAmount: 5000,
        codPincodes: '',
        metaTitle: '',
        metaDescription: '',
        enableRatings: true,
        enableWishlist: true,
        enableReviews: true,
        showDeliveryEstimate: true,
        lowStockThreshold: 5,
        defaultOrderStatus: 'Pending',
        enableWaitlist: false,
        waitlistMessage: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        dispatch(getSettings());
    }, [dispatch]);

    useEffect(() => {
        if (settings.storeName !== undefined) {
            setForm({
                storeName: settings.storeName || '',
                storeTagline: settings.storeTagline || '',
                currency: settings.currency || 'INR',
                supportEmail: settings.supportEmail || '',
                supportPhone: settings.supportPhone || '',
                announcement: settings.announcement || '',
                shippingFee: settings.shippingFee ?? 40,
                freeShippingAbove: settings.freeShippingAbove ?? 499,
                deliveryEstimateDays: settings.deliveryEstimateDays ?? 5,
                prepaidEnabled: settings.prepaidEnabled !== false,
                stripeEnabled: settings.stripeEnabled !== false,
                codEnabled: settings.codEnabled !== false,
                codMaxAmount: settings.codMaxAmount ?? 5000,
                codPincodes: Array.isArray(settings.codPincodes) ? settings.codPincodes.join(', ') : '',
                metaTitle: settings.metaTitle || '',
                metaDescription: settings.metaDescription || '',
                enableRatings: settings.enableRatings !== false,
                enableWishlist: settings.enableWishlist !== false,
                enableReviews: settings.enableReviews !== false,
                showDeliveryEstimate: settings.showDeliveryEstimate !== false,
                lowStockThreshold: settings.lowStockThreshold ?? 5,
                defaultOrderStatus: settings.defaultOrderStatus || 'Pending',
                enableWaitlist: settings.enableWaitlist === true,
                waitlistMessage: settings.waitlistMessage || ''
            });
        }
    }, [settings]);

    useEffect(() => {
        if (error) {
            toast(error, { type: 'error', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearSettingsState()) });
            return;
        }
        if (isUpdated) {
            toast('Settings saved', { type: 'success', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearSettingsState()) });
        }
    }, [dispatch, error, isUpdated]);

    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
    const setChecked = key => e => setForm(f => ({ ...f, [key]: e.target.checked }));

    const payload = () => ({
        ...form,
        shippingFee: Number(form.shippingFee),
        freeShippingAbove: Number(form.freeShippingAbove),
        deliveryEstimateDays: Number(form.deliveryEstimateDays),
        codMaxAmount: Number(form.codMaxAmount),
        lowStockThreshold: Math.max(1, Math.floor(Number(form.lowStockThreshold) || 5)),
        codEnabled: !!form.codEnabled,
        prepaidEnabled: !!form.prepaidEnabled,
        stripeEnabled: !!form.stripeEnabled,
        enableRatings: !!form.enableRatings,
        enableWishlist: !!form.enableWishlist,
        enableReviews: !!form.enableReviews,
        showDeliveryEstimate: !!form.showDeliveryEstimate,
        enableWaitlist: !!form.enableWaitlist,
        defaultOrderStatus: form.defaultOrderStatus === 'Confirmed' ? 'Confirmed' : 'Pending',
        codPincodes: String(form.codPincodes).split(',').map(p => p.trim().replace(/\D/g, '')).filter(p => p.length >= 3)
    });

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const res = await dispatch(updateSettings(payload()));
        setSaving(false);
        if (res && !res.success) toast(res.error, { type: 'error', position: toast.POSITION.BOTTOM_CENTER });
    };

    const SaveButton = () => (
        <button type="submit" className="ad-btn ad-btn--primary" disabled={saving}>
            {saving ? <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> : <i className="fa fa-check" aria-hidden="true"></i>}
            Save Changes
        </button>
    );

    const SectionHead = ({ icon, title, desc }) => (
        <div className="ad-section-head">
            <span className="ad-section-head__icon"><i className={`fa ${icon}`} aria-hidden="true"></i></span>
            <div>
                <h3>{title}</h3>
                <p>{desc}</p>
            </div>
        </div>
    );

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Settings</h1>
                    <p>Store configuration — General, Shipping, Payment, SEO &amp; more</p>
                </div>
            </div>

            {loading && !settings.storeName && (
                <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading settings…</div>
            )}

            {!loading && settings.storeName !== undefined && (
                <div className="ad-settings-grid">
                    {/* General */}
                    <div className="ad-card ad-settings-card">
                        <div className="ad-card__body">
                            <form className="ad-form" onSubmit={submit}>
                                <SectionHead icon="fa-shopping-bag" title="General" desc="Store identity &amp; support contact" />
                                <div className="ad-form--grid">
                                    <div className="ad-field">
                                        <label className="ad-label">Store Name</label>
                                        <input className="ad-input" value={form.storeName} onChange={set('storeName')} />
                                    </div>
                                    <div className="ad-field">
                                        <label className="ad-label">Tagline</label>
                                        <input className="ad-input" value={form.storeTagline} onChange={set('storeTagline')} />
                                    </div>
                                    <div className="ad-field">
                                        <label className="ad-label">Currency</label>
                                        <input className="ad-input" value="INR (₹)" disabled />
                                    </div>
                                    <div className="ad-field">
                                        <label className="ad-label">Support Email</label>
                                        <input className="ad-input" type="email" value={form.supportEmail} onChange={set('supportEmail')} />
                                    </div>
                                    <div className="ad-field">
                                        <label className="ad-label">Support Phone</label>
                                        <input className="ad-input" value={form.supportPhone} onChange={set('supportPhone')} />
                                    </div>
                                    <div className="ad-field">
                                        <label className="ad-label">Announcement Bar</label>
                                        <input className="ad-input" value={form.announcement} onChange={set('announcement')} placeholder="e.g. Free shipping over ₹499" />
                                    </div>
                                </div>
                                <div className="ad-form__foot">
                                    <SaveButton />
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Shipping & Delivery */}
                    <div className="ad-card ad-settings-card">
                        <div className="ad-card__body">
                            <form className="ad-form" onSubmit={submit}>
                                <SectionHead icon="fa-truck" title="Shipping &amp; Delivery" desc="Fees, free-shipping threshold &amp; estimates" />
                                <div className="ad-field">
                                    <label className="ad-label">Standard Shipping Fee (₹)</label>
                                    <input className="ad-input" type="number" min="0" value={form.shippingFee} onChange={set('shippingFee')} />
                                </div>
                                <div className="ad-field">
                                    <label className="ad-label">Free Shipping Above (₹)</label>
                                    <input className="ad-input" type="number" min="0" value={form.freeShippingAbove} onChange={set('freeShippingAbove')} />
                                </div>
                                <div className="ad-field">
                                    <label className="ad-label">Estimated Delivery Days</label>
                                    <input className="ad-input" type="number" min="1" value={form.deliveryEstimateDays} onChange={set('deliveryEstimateDays')} />
                                </div>
                                <p className="ad-help"><i className="fa fa-info-circle" aria-hidden="true"></i>&nbsp;Used to estimate delivery dates shown to customers at checkout.</p>
                                <div className="ad-form__foot">
                                    <SaveButton />
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="ad-card ad-settings-card">
                        <div className="ad-card__body">
                            <form className="ad-form" onSubmit={submit}>
                                <SectionHead icon="fa-credit-card" title="Payment" desc="Which payment methods customers can use" />
                                <div className="ad-toggle-row">
                                    <div className="ad-toggle-row__text">
                                        <span className="ad-toggle-row__title">Prepaid (UPI / Cards / Net Banking)</span>
                                        <span className="ad-toggle-row__desc">Allow online prepaid payments at checkout.</span>
                                    </div>
                                    <label className="ad-toggle">
                                        <input type="checkbox" checked={form.prepaidEnabled} onChange={setChecked('prepaidEnabled')} />
                                        <span className="ad-toggle__track"></span>
                                    </label>
                                </div>
                                <div className="ad-toggle-row">
                                    <div className="ad-toggle-row__text">
                                        <span className="ad-toggle-row__title">Stripe Card Payments</span>
                                        <span className="ad-toggle-row__desc">Accept international &amp; domestic cards via Stripe.</span>
                                    </div>
                                    <label className="ad-toggle">
                                        <input type="checkbox" checked={form.stripeEnabled} onChange={setChecked('stripeEnabled')} />
                                        <span className="ad-toggle__track"></span>
                                    </label>
                                </div>
                                <div className="ad-form__foot">
                                    <SaveButton />
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Cash on Delivery */}
                    <div className="ad-card ad-settings-card">
                        <div className="ad-card__body">
                            <form className="ad-form" onSubmit={submit}>
                                <SectionHead icon="fa-money" title="Cash on Delivery" desc="COD availability, limits &amp; pincodes" />
                                <div className="ad-toggle-row">
                                    <div className="ad-toggle-row__text">
                                        <span className="ad-toggle-row__title">Enable Cash on Delivery</span>
                                        <span className="ad-toggle-row__desc">Customers can pay cash when the order arrives.</span>
                                    </div>
                                    <label className="ad-toggle">
                                        <input type="checkbox" checked={form.codEnabled} onChange={setChecked('codEnabled')} />
                                        <span className="ad-toggle__track"></span>
                                    </label>
                                </div>
                                <div className="ad-form--grid">
                                    <div className="ad-field">
                                        <label className="ad-label">Max COD Order Amount (₹)</label>
                                        <input className="ad-input" type="number" min="0" step="100" value={form.codMaxAmount} onChange={set('codMaxAmount')} />
                                    </div>
                                    <div className="ad-field">
                                        <label className="ad-label">Allowed Pincodes <em className="ad-muted">(optional)</em></label>
                                        <input className="ad-input" value={form.codPincodes} onChange={set('codPincodes')} placeholder="560001, 110001, 400001" />
                                    </div>
                                </div>
                                <p className="ad-help"><i className="fa fa-info-circle" aria-hidden="true"></i>&nbsp;Leave pincodes empty to allow COD everywhere. Orders above the max amount (or outside listed pincodes) will only see prepaid methods at checkout.</p>
                                <div className="ad-form__foot">
                                    <SaveButton />
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* SEO & Discovery */}
                    <div className="ad-card ad-settings-card">
                        <div className="ad-card__body">
                            <form className="ad-form" onSubmit={submit}>
                                <SectionHead icon="fa-search" title="SEO &amp; Discovery" desc="How your store appears in search results" />
                                <div className="ad-field">
                                    <label className="ad-label">Meta Title</label>
                                    <input className="ad-input" value={form.metaTitle} onChange={set('metaTitle')} placeholder="VijayCart — Shop the best deals online" />
                                </div>
                                <div className="ad-field">
                                    <label className="ad-label">Meta Description</label>
                                    <textarea className="ad-input" rows="3" value={form.metaDescription} onChange={set('metaDescription')} placeholder="A short description Google shows under your store name."></textarea>
                                </div>
                                <p className="ad-help"><i className="fa fa-info-circle" aria-hidden="true"></i>&nbsp;Used for the browser tab, social shares and search engine snippets.</p>
                                <div className="ad-form__foot">
                                    <SaveButton />
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Storefront experience */}
                    <div className="ad-card ad-settings-card">
                        <div className="ad-card__body">
                            <form className="ad-form" onSubmit={submit}>
                                <SectionHead icon="fa-magic" title="Storefront Experience" desc="Which customer-facing features are live" />
                                <div className="ad-toggle-row">
                                    <div className="ad-toggle-row__text">
                                        <span className="ad-toggle-row__title">Product Ratings</span>
                                        <span className="ad-toggle-row__desc">Show star ratings on product cards.</span>
                                    </div>
                                    <label className="ad-toggle">
                                        <input type="checkbox" checked={form.enableRatings} onChange={setChecked('enableRatings')} />
                                        <span className="ad-toggle__track"></span>
                                    </label>
                                </div>
                                <div className="ad-toggle-row">
                                    <div className="ad-toggle-row__text">
                                        <span className="ad-toggle-row__title">Wishlist</span>
                                        <span className="ad-toggle-row__desc">Let customers save items for later.</span>
                                    </div>
                                    <label className="ad-toggle">
                                        <input type="checkbox" checked={form.enableWishlist} onChange={setChecked('enableWishlist')} />
                                        <span className="ad-toggle__track"></span>
                                    </label>
                                </div>
                                <div className="ad-toggle-row">
                                    <div className="ad-toggle-row__text">
                                        <span className="ad-toggle-row__title">Customer Reviews</span>
                                        <span className="ad-toggle-row__desc">Allow reviews on delivered products.</span>
                                    </div>
                                    <label className="ad-toggle">
                                        <input type="checkbox" checked={form.enableReviews} onChange={setChecked('enableReviews')} />
                                        <span className="ad-toggle__track"></span>
                                    </label>
                                </div>
                                <div className="ad-toggle-row">
                                    <div className="ad-toggle-row__text">
                                        <span className="ad-toggle-row__title">Delivery Estimate</span>
                                        <span className="ad-toggle-row__desc">Show the estimated delivery date at checkout.</span>
                                    </div>
                                    <label className="ad-toggle">
                                        <input type="checkbox" checked={form.showDeliveryEstimate} onChange={setChecked('showDeliveryEstimate')} />
                                        <span className="ad-toggle__track"></span>
                                    </label>
                                </div>
                                <div className="ad-form__foot">
                                    <SaveButton />
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Orders & stock */}
                    <div className="ad-card ad-settings-card">
                        <div className="ad-card__body">
                            <form className="ad-form" onSubmit={submit}>
                                <SectionHead icon="fa-sliders" title="Orders &amp; Stock" desc="Order defaults &amp; inventory alerts" />
                                <div className="ad-form--grid">
                                    <div className="ad-field">
                                        <label className="ad-label">Low Stock Alert Threshold</label>
                                        <input className="ad-input" type="number" min="1" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} />
                                    </div>
                                    <div className="ad-field">
                                        <label className="ad-label">New Order Status</label>
                                        <select className="ad-input" value={form.defaultOrderStatus} onChange={set('defaultOrderStatus')}>
                                            <option value="Pending">Pending — await confirmation</option>
                                            <option value="Confirmed">Confirmed — auto-confirm</option>
                                        </select>
                                    </div>
                                </div>
                                <p className="ad-help"><i className="fa fa-info-circle" aria-hidden="true"></i>&nbsp;The low-stock threshold drives dashboard alerts and the inventory page. Choose how new orders start in your fulfilment pipeline.</p>
                                <div className="ad-form__foot">
                                    <SaveButton />
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Launch & waitlist */}
                    <div className="ad-card ad-settings-card">
                        <div className="ad-card__body">
                            <form className="ad-form" onSubmit={submit}>
                                <SectionHead icon="fa-rocket" title="Launch &amp; Waitlist" desc="Pre-launch hype mode" />
                                <div className="ad-toggle-row">
                                    <div className="ad-toggle-row__text">
                                        <span className="ad-toggle-row__title">Enable Waitlist</span>
                                        <span className="ad-toggle-row__desc">Show a waitlist banner on the storefront.</span>
                                    </div>
                                    <label className="ad-toggle">
                                        <input type="checkbox" checked={form.enableWaitlist} onChange={setChecked('enableWaitlist')} />
                                        <span className="ad-toggle__track"></span>
                                    </label>
                                </div>
                                <div className="ad-field">
                                    <label className="ad-label">Waitlist Message</label>
                                    <input className="ad-input" value={form.waitlistMessage} onChange={set('waitlistMessage')} placeholder="e.g. We're launching soon — sign up for early access!" />
                                </div>
                                <div className="ad-form__foot">
                                    <SaveButton />
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </Fragment>
    );
}
