import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSettings, updateSettings } from '../../actions/settingActions';
import { clearSettingsState } from '../../actions/settingActions';
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
        shippingFee: 40,
        freeShippingAbove: 499,
        deliveryEstimateDays: 5,
        announcement: '',
        codEnabled: true,
        codMaxAmount: 5000,
        codPincodes: ''
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
                shippingFee: settings.shippingFee ?? 40,
                freeShippingAbove: settings.freeShippingAbove ?? 499,
                deliveryEstimateDays: settings.deliveryEstimateDays ?? 5,
                announcement: settings.announcement || '',
                codEnabled: settings.codEnabled !== false,
                codMaxAmount: settings.codMaxAmount ?? 5000,
                codPincodes: Array.isArray(settings.codPincodes) ? settings.codPincodes.join(', ') : ''
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

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const res = await dispatch(updateSettings({
            ...form,
            shippingFee: Number(form.shippingFee),
            freeShippingAbove: Number(form.freeShippingAbove),
            deliveryEstimateDays: Number(form.deliveryEstimateDays),
            codMaxAmount: Number(form.codMaxAmount),
            codEnabled: !!form.codEnabled,
            codPincodes: String(form.codPincodes).split(',').map(p => p.trim().replace(/\D/g, '')).filter(p => p.length >= 3)
        }));
        setSaving(false);
        if (res && !res.success) toast(res.error, { type: 'error' });
    };

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Settings</h1>
                    <p>Store configuration</p>
                </div>
            </div>

            {loading && !settings.storeName && (
                <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading settings…</div>
            )}

            <div className="ad-split">
                <div className="ad-card">
                    <div className="ad-card__head"><h3 className="ad-card__title"><i className="fa fa-store" aria-hidden="true"></i> Store Details</h3></div>
                    <div className="ad-card__body">
                        <form className="ad-form" onSubmit={submit}>
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
                            <div className="ad-modal__actions" style={{ marginTop: 0 }}>
                                <button type="submit" className="ad-btn ad-btn--primary" disabled={saving}>
                                    {saving ? <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> : <i className="fa fa-check" aria-hidden="true"></i>}
                                    Save Settings
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="ad-card">
                    <div className="ad-card__head"><h3 className="ad-card__title"><i className="fa fa-truck" aria-hidden="true"></i> Shipping &amp; Delivery</h3></div>
                    <div className="ad-card__body">
                        <form className="ad-form" onSubmit={submit}>
                            <div className="ad-field">
                                <label className="ad-label">Standard Shipping Fee (₹)</label>
                                <input className="ad-input" type="number" value={form.shippingFee} onChange={set('shippingFee')} />
                            </div>
                            <div className="ad-field">
                                <label className="ad-label">Free Shipping Above (₹)</label>
                                <input className="ad-input" type="number" value={form.freeShippingAbove} onChange={set('freeShippingAbove')} />
                            </div>
                            <div className="ad-field">
                                <label className="ad-label">Estimated Delivery Days</label>
                                <input className="ad-input" type="number" value={form.deliveryEstimateDays} onChange={set('deliveryEstimateDays')} />
                            </div>
                            <p className="ad-help"><i className="fa fa-info-circle mr-1" aria-hidden="true"></i>These values are used to estimate delivery dates shown to customers at checkout.</p>
                            <div className="ad-modal__actions" style={{ marginTop: 0 }}>
                                <button type="submit" className="ad-btn ad-btn--primary" disabled={saving}>
                                    {saving ? <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> : <i className="fa fa-check" aria-hidden="true"></i>}
                                    Save Settings
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="ad-card">
                    <div className="ad-card__head"><h3 className="ad-card__title"><i className="fa fa-hand-holding-dollar" aria-hidden="true"></i> Cash on Delivery</h3></div>
                    <div className="ad-card__body">
                        <form className="ad-form" onSubmit={submit}>
                            <div className="ad-field">
                                <label className="ad-toggle">
                                    <input type="checkbox" checked={form.codEnabled} onChange={setChecked('codEnabled')} />
                                    <span className="ad-toggle__track"></span>
                                    <span className="ad-toggle__label">Enable Cash on Delivery</span>
                                </label>
                            </div>
                            <div className="ad-field">
                                <label className="ad-label">Max COD Order Amount (₹)</label>
                                <input className="ad-input" type="number" min="0" step="100" value={form.codMaxAmount} onChange={set('codMaxAmount')} />
                            </div>
                            <div className="ad-field">
                                <label className="ad-label">Allowed Pincodes <em className="ad-muted">(optional)</em></label>
                                <textarea className="ad-input" rows="3" value={form.codPincodes} onChange={set('codPincodes')} placeholder="560001, 110001, 400001" />
                            </div>
                            <p className="ad-help"><i className="fa fa-info-circle mr-1" aria-hidden="true"></i>Leave pincodes empty to allow COD everywhere. Orders above the max amount (or outside listed pincodes) will only see prepaid methods at checkout.</p>
                            <div className="ad-modal__actions" style={{ marginTop: 0 }}>
                                <button type="submit" className="ad-btn ad-btn--primary" disabled={saving}>
                                    {saving ? <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> : <i className="fa fa-check" aria-hidden="true"></i>}
                                    Save Settings
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}
