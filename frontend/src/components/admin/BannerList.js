import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    getAdminBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    reorderBanners,
    getBanners
} from '../../actions/bannerActions';
import { clearBannerState } from '../../slices/bannerSlice';
import { toast } from 'react-toastify';
import { resolveProductImage, imgOnError } from '../../utils/productHelper';

const GRADIENT_PRESETS = [
    { name: 'Midnight Navy', value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)' },
    { name: 'Deep Slate', value: 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 40%, #415a77 100%)' },
    { name: 'Royal Violet', value: 'linear-gradient(135deg, #2d1b69 0%, #4a1942 40%, #6b2fa0 100%)' },
    { name: 'Forest', value: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 40%, #40916c 100%)' },
    { name: 'Crimson Night', value: 'linear-gradient(135deg, #4a1942 0%, #6b2fa0 40%, #2d1b69 100%)' },
    { name: 'Ocean Blue', value: 'linear-gradient(135deg, #0f2027 0%, #203a43 40%, #2c5364 100%)' },
    { name: 'Sunset Ember', value: 'linear-gradient(135deg, #7a1c1c 0%, #b8362e 40%, #ff8c42 100%)' },
    { name: 'Aurora Indigo', value: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 45%, #6d28d9 100%)' }
];

const EMPTY_FORM = {
    title: '',
    subtitle: '',
    kicker: '',
    cta: 'Shop Now',
    linkTo: '/search/all',
    image: '',
    accent: '#ff6b35',
    gradient: GRADIENT_PRESETS[0].value,
    active: true
};

export default function BannerList() {
    const { banners = [], loading, saving, error, isCreated, isUpdated, isDeleted } = useSelector(state => state.bannerState);
    const dispatch = useDispatch();

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [useCustomGradient, setUseCustomGradient] = useState(false);

    useEffect(() => {
        dispatch(getAdminBanners());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast(error, { type: 'error', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearBannerState()) });
            return;
        }
        if (isCreated || isUpdated || isDeleted) {
            toast(isCreated ? 'Banner created successfully!' : isUpdated ? 'Banner updated successfully!' : 'Banner deleted successfully!', {
                type: 'success',
                position: toast.POSITION.BOTTOM_CENTER,
                onOpen: () => dispatch(clearBannerState())
            });
            setShowModal(false);
            setEditingId(null);
            setForm(EMPTY_FORM);
            // Refetch the admin grid (create returns {banner}, not {banners})
            // and the public hero store so both the dashboard and storefront
            // reflect the edit immediately.
            dispatch(getAdminBanners());
            dispatch(getBanners());
        }
    }, [dispatch, error, isCreated, isUpdated, isDeleted]);

    const openNew = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setUseCustomGradient(false);
        setShowModal(true);
    };

    const openEdit = (banner) => {
        setEditingId(banner._id);
        setForm({
            title: banner.title || '',
            subtitle: banner.subtitle || '',
            kicker: banner.kicker || '',
            cta: banner.cta || 'Shop Now',
            linkTo: banner.linkTo || '/search/all',
            image: banner.image || '',
            accent: banner.accent || '#ff6b35',
            gradient: banner.gradient || GRADIENT_PRESETS[0].value,
            active: banner.active !== false
        });
        setUseCustomGradient(!GRADIENT_PRESETS.some(g => g.value === banner.gradient));
        setShowModal(true);
    };

    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) {
            toast('Please enter a banner title', { type: 'warning', position: toast.POSITION.BOTTOM_CENTER });
            return;
        }
        const payload = {
            title: form.title.trim(),
            subtitle: form.subtitle.trim(),
            kicker: form.kicker.trim(),
            cta: form.cta.trim() || 'Shop Now',
            linkTo: form.linkTo.trim() || '/search/all',
            image: form.image.trim(),
            accent: form.accent || '#ff6b35',
            gradient: form.gradient,
            active: form.active
        };
        const res = editingId
            ? await dispatch(updateBanner(editingId, payload))
            : await dispatch(createBanner(payload));
        if (res && !res.success) toast(res.error, { type: 'error', position: toast.POSITION.BOTTOM_CENTER });
    };

    const remove = async (banner) => {
        if (!window.confirm(`Delete banner "${banner.title}"? This cannot be undone.`)) return;
        const res = await dispatch(deleteBanner(banner._id));
        if (res && !res.success) toast(res.error, { type: 'error', position: toast.POSITION.BOTTOM_CENTER });
    };

    const toggleActive = async (banner) => {
        const res = await dispatch(updateBanner(banner._id, { active: !banner.active }));
        if (res && !res.success) toast(res.error, { type: 'error', position: toast.POSITION.BOTTOM_CENTER });
    };

    const move = async (index, dir) => {
        const target = index + dir;
        if (target < 0 || target >= banners.length) return;
        const next = [...banners];
        [next[index], next[target]] = [next[target], next[index]];
        const res = await dispatch(reorderBanners(next.map(b => b._id)));
        if (res && !res.success) toast(res.error, { type: 'error', position: toast.POSITION.BOTTOM_CENTER });
    };

    const activeCount = banners.filter(b => b.active).length;

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Banners</h1>
                    <p>{banners.length} banners · {activeCount} active on homepage</p>
                </div>
                <div className="ad-toolbar">
                    <button type="button" className="ad-btn ad-btn--primary" onClick={openNew}>
                        <i className="fa fa-plus" aria-hidden="true"></i> New Banner
                    </button>
                </div>
            </div>

            {loading && banners.length === 0 ? (
                <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading banners…</div>
            ) : banners.length === 0 ? (
                <div className="ad-empty"><i className="fa fa-image" aria-hidden="true"></i><p>No banners yet. Create your first one!</p></div>
            ) : (
                <div className="ad-banner-grid">
                    {banners.map((banner, i) => (
                        <div className={`ad-banner-card ${!banner.active ? 'ad-banner-card--inactive' : ''}`} key={banner._id}>
                            <div className="ad-banner-card__preview" style={{ background: banner.gradient }}>
                                {banner.image && (
                                    <img src={resolveProductImage(banner.image)} alt="" onError={imgOnError} />
                                )}
                                <span className="ad-banner-card__badge">{banner.active ? 'Active' : 'Inactive'}</span>
                                <span className="ad-banner-card__index">#{i + 1}</span>
                            </div>
                            <div className="ad-banner-card__body">
                                <div className="ad-banner-card__kicker" style={{ color: banner.accent }}>
                                    {banner.kicker || 'Promo'}
                                </div>
                                <div className="ad-banner-card__title">{banner.title}</div>
                                {banner.subtitle && <div className="ad-banner-card__sub">{banner.subtitle}</div>}
                                <div className="ad-banner-card__cta">
                                    {banner.cta || 'Shop Now'} <i className="fa fa-arrow-right" aria-hidden="true"></i>
                                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--ad-text-3)', fontWeight: 600 }}>{banner.linkTo}</span>
                                </div>
                            </div>
                            <div className="ad-banner-card__foot">
                                <label className="ad-toggle" title="Show on homepage">
                                    <input type="checkbox" checked={banner.active !== false} onChange={() => toggleActive(banner)} />
                                    <span className="ad-toggle__track"></span>
                                </label>
                                <div className="ad-banner-card__actions">
                                    <button type="button" className="ad-btn ad-btn--ghost ad-btn--sm ad-btn--icon" title="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                                        <i className="fa fa-chevron-up" aria-hidden="true"></i>
                                    </button>
                                    <button type="button" className="ad-btn ad-btn--ghost ad-btn--sm ad-btn--icon" title="Move down" onClick={() => move(i, 1)} disabled={i === banners.length - 1}>
                                        <i className="fa fa-chevron-down" aria-hidden="true"></i>
                                    </button>
                                    <button type="button" className="ad-btn ad-btn--ghost ad-btn--sm ad-btn--icon" title="Edit" onClick={() => openEdit(banner)}>
                                        <i className="fa fa-pencil" aria-hidden="true"></i>
                                    </button>
                                    <button type="button" className="ad-btn ad-btn--danger ad-btn--sm ad-btn--icon" title="Delete" onClick={() => remove(banner)}>
                                        <i className="fa fa-trash" aria-hidden="true"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="ad-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="ad-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                        <div className="ad-modal__head">
                            <h3>{editingId ? 'Edit Banner' : 'New Banner'}</h3>
                            <button type="button" className="ad-modal__close" onClick={() => setShowModal(false)} aria-label="Close"><i className="fa fa-times" aria-hidden="true"></i></button>
                        </div>

                        <form className="ad-form" onSubmit={submit}>
                            <div className="ad-field">
                                <label className="ad-label">Title *</label>
                                <input className="ad-input" value={form.title} onChange={set('title')} placeholder="Up to 70% Off" maxLength="60" />
                            </div>
                            <div className="ad-form--grid">
                                <div className="ad-field">
                                    <label className="ad-label">Kicker / Eyebrow</label>
                                    <input className="ad-input" value={form.kicker} onChange={set('kicker')} placeholder="Mega Sale" maxLength="40" />
                                </div>
                                <div className="ad-field">
                                    <label className="ad-label">CTA Button</label>
                                    <input className="ad-input" value={form.cta} onChange={set('cta')} placeholder="Shop Now" maxLength="24" />
                                </div>
                            </div>
                            <div className="ad-field">
                                <label className="ad-label">Subtitle</label>
                                <input className="ad-input" value={form.subtitle} onChange={set('subtitle')} placeholder="Top brands, biggest discounts" maxLength="160" />
                            </div>
                            <div className="ad-field">
                                <label className="ad-label">Link Destination</label>
                                <input className="ad-input" value={form.linkTo} onChange={set('linkTo')} placeholder="/search/all?category=Electronics" />
                            </div>
                            <div className="ad-field">
                                <label className="ad-label">Background Image URL</label>
                                <input className="ad-input" value={form.image} onChange={set('image')} placeholder="/images/products/smartphone-1.jpg" />
                                <p className="ad-help">Leave empty to show the gradient background only.</p>
                            </div>
                            <div className="ad-form--grid">
                                <div className="ad-field">
                                    <label className="ad-label">Accent Color</label>
                                    <input type="color" className="ad-input" style={{ height: 42, padding: 4 }} value={form.accent} onChange={set('accent')} />
                                </div>
                                <div className="ad-field">
                                    <label className="ad-label">Status</label>
                                    <select className="ad-select" value={form.active ? '1' : '0'} onChange={e => setForm(f => ({ ...f, active: e.target.value === '1' }))}>
                                        <option value="1">Active</option>
                                        <option value="0">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="ad-field">
                                <label className="ad-label">Background Gradient</label>
                                <select className="ad-select" value={useCustomGradient ? 'custom' : form.gradient} onChange={e => {
                                    if (e.target.value === 'custom') {
                                        setUseCustomGradient(true);
                                    } else {
                                        setUseCustomGradient(false);
                                        setForm(f => ({ ...f, gradient: e.target.value }));
                                    }
                                }}>
                                    {GRADIENT_PRESETS.map(g => (
                                        <option key={g.name} value={g.value}>{g.name}</option>
                                    ))}
                                    <option value="custom">Custom…</option>
                                </select>
                                {useCustomGradient && (
                                    <textarea className="ad-textarea" rows={2} value={form.gradient} onChange={set('gradient')} placeholder="linear-gradient(135deg, #111 0%, #222 100%)" />
                                )}
                            </div>

                            <div className="ad-field">
                                <label className="ad-label">Live Preview</label>
                                <div className="ad-banner-card__preview" style={{ background: form.gradient }}>
                                    {form.image && <img src={resolveProductImage(form.image)} alt="" onError={imgOnError} />}
                                    <div style={{ position: 'relative', zIndex: 1, padding: '0.6rem 0.8rem', color: '#fff' }}>
                                        <div style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: form.accent }}>{form.kicker || 'Promo'}</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{form.title || 'Banner title'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="ad-modal__actions">
                                <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="ad-btn ad-btn--primary" disabled={saving}>
                                    {saving ? <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> : <i className="fa fa-check" aria-hidden="true"></i>}
                                    {editingId ? 'Save Changes' : 'Create Banner'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Fragment>
    );
}
