import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createCoupon, deleteCoupon, getCoupons, updateCoupon } from '../../actions/couponActions';
import { clearCouponState } from '../../actions/couponActions';
import { toast } from 'react-toastify';

const EMPTY = {
    code: '',
    description: '',
    discountType: 'percent',
    discountValue: 10,
    minAmount: 0,
    maxDiscount: 0,
    validFrom: '',
    validUntil: '',
    usageLimit: 0,
    active: true
};

export default function CouponList() {
    const { coupons = [], loading, error, isCreated, isUpdated, isDeleted } = useSelector(state => state.couponState);
    const dispatch = useDispatch();

    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        dispatch(getCoupons());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast(error, { type: 'error', position: toast.POSITION.BOTTOM_CENTER });
            dispatch(clearCouponState);
            return;
        }
        if (isCreated) {
            toast('Coupon created', { type: 'success', position: toast.POSITION.BOTTOM_CENTER });
            dispatch(clearCouponState);
            setModal(false);
        }
        if (isUpdated) {
            toast('Coupon updated', { type: 'success', position: toast.POSITION.BOTTOM_CENTER });
            dispatch(clearCouponState);
            setModal(false);
        }
        if (isDeleted) {
            toast('Coupon deleted', { type: 'success', position: toast.POSITION.BOTTOM_CENTER });
            dispatch(clearCouponState);
        }
    }, [dispatch, error, isCreated, isUpdated, isDeleted]);

    const openCreate = () => { setEditing(null); setForm({ ...EMPTY, code: '', discountValue: 10 }); setModal(true); };

    const openEdit = (c) => {
        setEditing(c);
        setForm({
            code: c.code,
            description: c.description || '',
            discountType: c.discountType,
            discountValue: c.discountValue,
            minAmount: c.minAmount || 0,
            maxDiscount: c.maxDiscount || 0,
            validFrom: c.validFrom ? new Date(c.validFrom).toISOString().slice(0, 10) : '',
            validUntil: c.validUntil ? new Date(c.validUntil).toISOString().slice(0, 10) : '',
            usageLimit: c.usageLimit || 0,
            active: c.active !== undefined ? c.active : true
        });
        setModal(true);
    };

    const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        if (!form.code.trim()) { toast('Please enter a coupon code', { type: 'warning' }); return; }
        if (Number(form.discountValue) <= 0) { toast('Please enter a valid discount value', { type: 'warning' }); return; }
        setSaving(true);
        const payload = {
            ...form,
            discountValue: Number(form.discountValue),
            minAmount: Number(form.minAmount),
            maxDiscount: Number(form.maxDiscount),
            usageLimit: Number(form.usageLimit),
            validFrom: form.validFrom || undefined,
            validUntil: form.validUntil || undefined,
            active: form.active
        };
        const res = editing
            ? await dispatch(updateCoupon(editing._id, payload))
            : await dispatch(createCoupon(payload));
        setSaving(false);
        if (res && !res.success) toast(res.error, { type: 'error' });
    };

    const remove = (c) => {
        if (window.confirm(`Delete coupon "${c.code}"?`)) dispatch(deleteCoupon(c._id));
    };

    const copyCode = (code) => {
        navigator.clipboard?.writeText(code);
        toast(`Copied ${code}`, { type: 'success', position: toast.POSITION.BOTTOM_CENTER });
    };

    const isActive = (c) => {
        if (!c.active) return false;
        if (c.validUntil && new Date(c.validUntil).getTime() < Date.now()) return false;
        return true;
    };

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Coupons</h1>
                    <p>Discounts &amp; promotions · {coupons.length} coupons</p>
                </div>
                <button type="button" className="ad-btn ad-btn--primary" onClick={openCreate}><i className="fa fa-plus" aria-hidden="true"></i> New Coupon</button>
            </div>

            <div className="ad-card">
                <div className="ad-card__body ad-card__body--flush">
                    {loading && coupons.length === 0 ? (
                        <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading coupons…</div>
                    ) : coupons.length === 0 ? (
                        <div className="ad-empty"><i className="fa fa-ticket" aria-hidden="true"></i><p>No coupons yet. Create your first promotion.</p></div>
                    ) : (
                        <div className="ad-table-wrap">
                            <table className="ad-table">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Discount</th>
                                        <th>Min Order</th>
                                        <th>Valid Until</th>
                                        <th>Used</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {coupons.map(c => (
                                        <tr key={c._id}>
                                            <td>
                                                <span className="ad-chip ad-td-mono">{c.code}</span>
                                                <button type="button" className="ad-btn ad-btn--link" onClick={() => copyCode(c.code)}><i className="fa fa-copy" aria-hidden="true"></i></button>
                                            </td>
                                            <td><span className="ad-td-strong">{c.discountType === 'percent' ? `${c.discountValue}%` : `₹${c.discountValue}`}</span>
                                                {c.maxDiscount > 0 && <span className="ad-stat__label"> (max ₹{c.maxDiscount})</span>}
                                            </td>
                                            <td>{c.minAmount > 0 ? `₹${c.minAmount}` : '—'}</td>
                                            <td><span className="ad-stat__label">{c.validUntil ? new Date(c.validUntil).toLocaleDateString('en-IN') : 'Never'}</span></td>
                                            <td>{c.usageLimit > 0 ? `${c.usedCount}/${c.usageLimit}` : `${c.usedCount}`}</td>
                                            <td>
                                                <span className={`ad-badge ${isActive(c) ? 'ad-badge--success' : 'ad-badge--muted'}`}>
                                                    {isActive(c) ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="ad-toolbar">
                                                    <button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={() => openEdit(c)}><i className="fa fa-pencil" aria-hidden="true"></i></button>
                                                    <button type="button" className="ad-btn ad-btn--danger ad-btn--sm ad-btn--icon" onClick={() => remove(c)}><i className="fa fa-trash" aria-hidden="true"></i></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {modal && (
                <div className="ad-modal-overlay" onClick={() => setModal(false)}>
                    <div className="ad-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                        <div className="ad-modal__head">
                            <h3>{editing ? `Edit Coupon — ${editing.code}` : 'New Coupon'}</h3>
                            <button type="button" className="ad-modal__close" onClick={() => setModal(false)}><i className="fa fa-times" aria-hidden="true"></i></button>
                        </div>
                        <form className="ad-form" onSubmit={submit}>
                            <div className="ad-form--grid">
                                <div className="ad-field">
                                    <label className="ad-label">Code</label>
                                    <input className="ad-input" value={form.code} onChange={set('code')} placeholder="SAVE10" autoFocus />
                                </div>
                                <div className="ad-field">
                                    <label className="ad-label">Discount Type</label>
                                    <select className="ad-select" value={form.discountType} onChange={set('discountType')}>
                                        <option value="percent">Percent (%)</option>
                                        <option value="flat">Flat (₹)</option>
                                    </select>
                                </div>
                                <div className="ad-field">
                                    <label className="ad-label">Discount Value</label>
                                    <input className="ad-input" type="number" value={form.discountValue} onChange={set('discountValue')} />
                                </div>
                                <div className="ad-field">
                                    <label className="ad-label">Min Order Amount</label>
                                    <input className="ad-input" type="number" value={form.minAmount} onChange={set('minAmount')} />
                                </div>
                                <div className="ad-field">
                                    <label className="ad-label">Max Discount (percent only)</label>
                                    <input className="ad-input" type="number" value={form.maxDiscount} onChange={set('maxDiscount')} />
                                </div>
                                <div className="ad-field">
                                    <label className="ad-label">Usage Limit (0 = unlimited)</label>
                                    <input className="ad-input" type="number" value={form.usageLimit} onChange={set('usageLimit')} />
                                </div>
                                <div className="ad-field">
                                    <label className="ad-label">Valid From</label>
                                    <input className="ad-input" type="date" value={form.validFrom} onChange={set('validFrom')} />
                                </div>
                                <div className="ad-field">
                                    <label className="ad-label">Valid Until</label>
                                    <input className="ad-input" type="date" value={form.validUntil} onChange={set('validUntil')} />
                                </div>
                            </div>
                            <div className="ad-field ad-field--full">
                                <label className="ad-label">Description</label>
                                <input className="ad-input" value={form.description} onChange={set('description')} placeholder="Short description shown to customers" />
                            </div>
                            <div className="ad-toggle-row">
                                <span className="ad-label" style={{ margin: 0 }}>Coupon active</span>
                                <div className="ad-toggle">
                                    <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                                    <span className="ad-toggle__slider"></span>
                                </div>
                            </div>
                            <div className="ad-modal__actions">
                                <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setModal(false)}>Cancel</button>
                                <button type="submit" className="ad-btn ad-btn--primary" disabled={saving}>
                                    {saving ? <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> : <i className="fa fa-check" aria-hidden="true"></i>}
                                    {editing ? 'Save Changes' : 'Create Coupon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Fragment>
    );
}
