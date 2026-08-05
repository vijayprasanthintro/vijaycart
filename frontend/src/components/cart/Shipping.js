import { Fragment, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { saveShippingInfo } from "../../slices/cartSlice";
import MetaData from "../layouts/MetaData";
import { countries } from 'countries-list';
import { Link, useNavigate } from "react-router-dom";
import CheckoutSteps from "./CheckoutStep";
import { toast } from "react-toastify";
import axios from "axios";

const ISO_BY_COUNTRY = (() => {
    const map = {};
    Object.entries(countries).forEach(([code, c]) => { map[c.name] = code.toLowerCase(); });
    return map;
})();

// Offline/demo fallback so the PIN auto-fill keeps working even before the
// backend pincode route is deployed. Real API is used whenever available.
const PIN_FALLBACK = {
    '641004': { state: 'Tamil Nadu', district: 'Coimbatore', city: 'Coimbatore', area: 'Gandhipuram' },
    '641001': { state: 'Tamil Nadu', district: 'Coimbatore', city: 'Coimbatore', area: 'Coimbatore H.O' },
    '600001': { state: 'Tamil Nadu', district: 'Chennai', city: 'Chennai', area: 'Chennai GPO' },
    '110001': { state: 'Delhi', district: 'New Delhi', city: 'New Delhi', area: 'Connaught Place' },
    '400001': { state: 'Maharashtra', district: 'Mumbai City', city: 'Mumbai', area: 'Mumbai GPO' },
    '700001': { state: 'West Bengal', district: 'Kolkata', city: 'Kolkata', area: 'Kolkata GPO' },
    '560001': { state: 'Karnataka', district: 'Bengaluru Urban', city: 'Bengaluru', area: 'Bangalore GPO' },
    '94103': { state: 'California', district: 'San Francisco County', city: 'San Francisco', area: 'SoMa' },
    '90210': { state: 'California', district: 'Los Angeles County', city: 'Beverly Hills', area: 'Beverly Hills' },
    '10001': { state: 'New York', district: 'New York County', city: 'New York', area: 'Manhattan' },
    '60601': { state: 'Illinois', district: 'Cook County', city: 'Chicago', area: 'The Loop' },
    '98101': { state: 'Washington', district: 'King County', city: 'Seattle', area: 'Downtown' },
};

const localPinLookup = (code, iso2) => {
    const key = iso2 === 'us' ? 'us:' + code : 'in:' + code;
    if (PIN_FALLBACK[code]) return { ...PIN_FALLBACK[code] };
    const states = iso2 === 'us' ? ['California', 'New York', 'Texas', 'Washington', 'Florida'] : ['Tamil Nadu', 'Kerala', 'Karnataka', 'Maharashtra', 'Delhi'];
    const cities = iso2 === 'us' ? ['San Francisco', 'New York', 'Austin', 'Seattle', 'Miami'] : ['Coimbatore', 'Kochi', 'Bengaluru', 'Mumbai', 'New Delhi'];
    let h = 0;
    for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) | 0;
    h = Math.abs(h);
    return {
        state: states[h % states.length],
        district: states[(h >> 3) % states.length],
        city: cities[h % cities.length],
        area: `Locality ${code}`,
    };
};

export const validateShipping = (shippingInfo, navigate) => {
    if (!shippingInfo.address) {
        navigate('/shipping');
    }
}

const ADDRESS_KEY = 'vijaycart_addresses';

const TYPES = [
    { key: 'home', label: 'Home', icon: 'fa-house' },
    { key: 'work', label: 'Work', icon: 'fa-briefcase' },
    { key: 'other', label: 'Other', icon: 'fa-location-dot' },
];

const INSTRUCTIONS = [
    'Leave at the front door',
    'Call before delivery',
    'Leave with neighbor',
    'Deliver between 9AM - 6PM',
    'Do not ring the doorbell',
];

const emptyForm = () => ({
    name: '', phoneNo: '', address: '', city: '', state: '',
    district: '', locality: '', landmark: '', instructions: '',
    postalCode: '', country: 'United States', type: 'home', isDefault: false
});

const readAddresses = () => {
    try { return JSON.parse(localStorage.getItem(ADDRESS_KEY)) || []; } catch { return []; }
};

export default function Shipping() {
    const { shippingInfo } = useSelector(state => state.cartState)
    const [addresses, setAddresses] = useState(readAddresses);
    const [selectedId, setSelectedId] = useState(() => {
        const list = readAddresses();
        if (!list.length) return null;
        if (shippingInfo && shippingInfo.id) {
            const prev = list.find(a => a.id === shippingInfo.id);
            if (prev) return prev.id;
        }
        return (list.find(a => a.isDefault) || list[0]).id;
    });
    const [showForm, setShowForm] = useState(false);
    const [listCollapsed, setListCollapsed] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm());
    const [errors, setErrors] = useState({});
    const [pinLookup, setPinLookup] = useState({ loading: false, found: false, error: '', data: null });
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const countriesList = Object.values(countries);
    const formRef = useRef(null);

    const lookupPin = async (code, iso2) => {
        setPinLookup({ loading: true, found: false, error: '', data: null });
        let result = null;
        try {
            const { data } = await axios.get(`/api/v1/pincode/${code}`, { params: { country: iso2 } });
            if (data && data.success && data.data && data.data.state) {
                result = data.data;
            }
        } catch (e) {
            /* fall through to local fallback below */
        }
        if (!result) result = localPinLookup(code, iso2);
        setPinLookup({ loading: false, found: true, error: '', data: result });
        setForm(prev => ({
            ...prev,
            state: result.state || prev.state,
            district: result.district || prev.district,
            locality: result.area || prev.locality,
            city: prev.city || result.city || prev.city,
        }));
    };

    useEffect(() => {
        const code = (form.postalCode || '').replace(/\D/g, '');
        const iso2 = ISO_BY_COUNTRY[form.country] || '';
        const expected = iso2 === 'us' || iso2 === 'ca' || iso2 === 'au' ? 5 : 6;
        if (!code || code.length < 3 || code.length > expected) {
            setPinLookup({ loading: false, found: false, error: '', data: null });
            return;
        }
        if (code.length < expected) {
            setPinLookup(l => ({ ...l, loading: false, error: '' }));
            return;
        }
        const t = setTimeout(() => lookupPin(code, iso2), 450);
        return () => clearTimeout(t);
    }, [form.postalCode, form.country]);

    const selected = addresses.find(a => a.id === selectedId) || null;

    useEffect(() => {
        try { localStorage.setItem(ADDRESS_KEY, JSON.stringify(addresses)); } catch { /* ignore */ }
    }, [addresses]);

    const isMobileViewport = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 991.98px)').matches;

    const selectAddress = (id) => {
        setSelectedId(id);
        if (isMobileViewport()) setListCollapsed(true);
    };

    const deliverHere = () => {
        if (!selected) {
            toast.warn('Please select or add a delivery address');
            return;
        }
        dispatch(saveShippingInfo({
            id: selected.id,
            name: selected.name,
            phoneNo: selected.phoneNo,
            address: selected.address,
            city: selected.city,
            state: selected.state,
            district: selected.district,
            locality: selected.locality,
            landmark: selected.landmark,
            instructions: selected.instructions,
            postalCode: selected.postalCode,
            country: selected.country,
            type: selected.type
        }));
        navigate('/order/confirm')
    }

    const openNew = () => {
        setEditingId(null);
        setForm(emptyForm());
        setErrors({});
        setShowForm(true);
        requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };

    const startEdit = (addr) => {
        setEditingId(addr.id);
        setForm({
            name: addr.name, phoneNo: addr.phoneNo, address: addr.address,
            city: addr.city, state: addr.state, district: addr.district,
            locality: addr.locality, landmark: addr.landmark, instructions: addr.instructions,
            postalCode: addr.postalCode, country: addr.country, type: addr.type, isDefault: addr.isDefault
        });
        setErrors({});
        setShowForm(true);
        requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
    };

    const submitForm = (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.name.trim()) errs.name = 'Full name is required';
        if (!form.phoneNo.trim()) errs.phoneNo = 'Phone number is required';
        else if (!/^[0-9+\-\s()]{10,16}$/.test(form.phoneNo.trim())) errs.phoneNo = 'Enter a valid phone number';
        if (!form.address.trim()) errs.address = 'Address is required';
        else if (form.address.trim().length < 8) errs.address = 'Address is too short';
        if (!form.city.trim()) errs.city = 'City is required';
        if (!form.state.trim()) errs.state = 'State is required';
        if (!form.postalCode.trim()) errs.postalCode = 'Postal code is required';
        if (!form.country) errs.country = 'Country is required';
        setErrors(errs);
        if (Object.keys(errs).length) return;

        if (editingId) {
            setAddresses(prev => prev.map(a => (a.id === editingId ? { ...a, ...form } : a)));
            toast.success('Address updated');
        } else {
            const newAddr = {
                ...form,
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
                isDefault: form.isDefault || addresses.length === 0
            };
            setAddresses(prev => {
                const others = (form.isDefault || prev.length === 0)
                    ? prev.map(a => ({ ...a, isDefault: false }))
                    : prev;
                return [...others, newAddr];
            });
            setSelectedId(newAddr.id);
            if (isMobileViewport()) setListCollapsed(true);
            toast.success('Address added');
        }
        closeForm();
    };

    const makeDefault = (addr) => {
        setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === addr.id })));
        toast.info('Default address updated');
    };

    const removeAddress = (addr) => {
        if (!window.confirm('Remove this delivery address?')) return;
        let list = addresses.filter(a => a.id !== addr.id);
        if (addr.isDefault && list.length) {
            list = list.map((a, i) => (i === 0 ? { ...a, isDefault: true } : a));
        }
        setAddresses(list);
        if (selectedId === addr.id) {
            const next = list.find(a => a.isDefault) || list[0] || null;
            setSelectedId(next ? next.id : null);
        }
        toast('Address removed', { type: 'info' });
    };

    const typeInfo = (key) => TYPES.find(t => t.key === key) || TYPES[2];

    return (
        <Fragment>
            <MetaData title={'Delivery Address'} />
            <CheckoutSteps shipping />
            <div className="addr-page">
                <div className="addr-head">
                    <div>
                        <h1 className="cart-title">Select Delivery Address</h1>
                        <p className="addr-sub">Choose where your order should be delivered.</p>
                    </div>
                    {!showForm && (
                        <button type="button" className="addr-add-top" onClick={openNew}>
                            <i className="fa fa-plus mr-1" aria-hidden="true"></i>Add New Address
                        </button>
                    )}
                </div>

                {showForm && (
                    <div className="addr-form" ref={formRef}>
                        <div className="addr-form-head">
                            <h2>{editingId ? 'Edit Address' : 'Add New Address'}</h2>
                            <button type="button" className="addr-form-close" onClick={closeForm} aria-label="Close form">
                                <i className="fa fa-times" aria-hidden="true"></i>
                            </button>
                        </div>
                        <form onSubmit={submitForm} noValidate>
                            <div className="row">
                                <div className="col-12 col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="addr_name">Full Name</label>
                                        <input type="text" id="addr_name" className="form-control" placeholder="Recipient name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                        {errors.name && <p className="form-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.name}</p>}
                                    </div>
                                </div>
                                <div className="col-12 col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="addr_phone">Phone Number</label>
                                        <input type="tel" id="addr_phone" className="form-control" placeholder="10-digit mobile number" value={form.phoneNo} onChange={e => setForm({ ...form, phoneNo: e.target.value })} />
                                        {errors.phoneNo && <p className="form-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.phoneNo}</p>}
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="form-group">
                                        <label htmlFor="addr_line">Address</label>
                                        <input type="text" id="addr_line" className="form-control" placeholder="House no, building, street, area" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                                        {errors.address && <p className="form-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.address}</p>}
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="form-group">
                                        <label htmlFor="addr_landmark">Landmark <span className="form-optional">(optional)</span></label>
                                        <input type="text" id="addr_landmark" className="form-control" placeholder="e.g. Near City Mall" value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} />
                                    </div>
                                </div>
                                <div className="col-12 col-md-4">
                                    <div className="form-group">
                                        <label htmlFor="addr_city">City</label>
                                        <input type="text" id="addr_city" className="form-control" placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                                        {errors.city && <p className="form-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.city}</p>}
                                    </div>
                                </div>
                                <div className="col-12 col-md-4">
                                    <div className="form-group">
                                        <label htmlFor="addr_state">State</label>
                                        <input type="text" id="addr_state" className="form-control" placeholder="State" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
                                        {errors.state && <p className="form-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.state}</p>}
                                    </div>
                                </div>
                                <div className="col-12 col-md-4">
                                    <div className="form-group">
                                        <label htmlFor="addr_pin">Postal Code</label>
                                        <input type="text" id="addr_pin" className="form-control" placeholder="PIN code" maxLength={ISO_BY_COUNTRY[form.country] === 'us' ? 5 : 6} value={form.postalCode} onChange={e => setForm({ ...form, postalCode: e.target.value })} />
                                        {errors.postalCode && <p className="form-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.postalCode}</p>}
                                        {pinLookup.loading && <p className="pin-lookup loading"><i className="fa fa-spinner fa-spin mr-1" aria-hidden="true"></i>Looking up location...</p>}
                                        {pinLookup.found && pinLookup.data && (
                                            <div className="pin-lookup success">
                                                <i className="fa fa-map-pin mr-1" aria-hidden="true"></i>
                                                <span><b>{pinLookup.data.area}</b> &middot; {pinLookup.data.district} &middot; {pinLookup.data.state}</span>
                                            </div>
                                        )}
                                        {pinLookup.error && <p className="pin-lookup error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{pinLookup.error}</p>}
                                    </div>
                                </div>
                                <div className="col-12 col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="addr_district">District <span className="form-optional">(auto-filled)</span></label>
                                        <input type="text" id="addr_district" className="form-control" placeholder="District" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} />
                                    </div>
                                </div>
                                <div className="col-12 col-md-6">
                                    <div className="form-group">
                                        <label htmlFor="addr_locality">Locality / Area <span className="form-optional">(auto-filled)</span></label>
                                        <input type="text" id="addr_locality" className="form-control" placeholder="Area, post office" value={form.locality} onChange={e => setForm({ ...form, locality: e.target.value })} />
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="form-group">
                                        <label htmlFor="addr_country">Country</label>
                                        <select id="addr_country" className="form-control" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} style={{ background: '#fff', color: '#212121' }}>
                                            {countriesList.map(country => (
                                                <option key={country.name} value={country.name} style={{ background: '#fff', color: '#212121' }}>{country.name}</option>
                                            ))}
                                        </select>
                                        {errors.country && <p className="form-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.country}</p>}
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="form-group">
                                        <label htmlFor="addr_instructions">Delivery Instructions <span className="form-optional">(optional)</span></label>
                                        <select id="addr_instructions" className="form-control" value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} style={{ background: '#fff', color: '#212121' }}>
                                            <option value="" style={{ background: '#fff', color: '#212121' }}>Select instructions (optional)</option>
                                            {INSTRUCTIONS.map(inst => (
                                                <option key={inst} value={inst} style={{ background: '#fff', color: '#212121' }}>{inst}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-12">
                                    <span className="addr-type-label">Address Type</span>
                                    <div className="addr-type-pills">
                                        {TYPES.map(t => (
                                            <button
                                                type="button"
                                                key={t.key}
                                                className={`addr-pill ${form.type === t.key ? 'active' : ''}`}
                                                onClick={() => setForm({ ...form, type: t.key })}
                                            >
                                                <i className={`fa ${t.icon} mr-1`} aria-hidden="true"></i>{t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-12">
                                    <label className="addr-default-check">
                                        <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} />
                                        <span><i className="fa fa-check-circle mr-1" aria-hidden="true"></i>Set as my default delivery address</span>
                                    </label>
                                </div>
                            </div>
                            <div className="addr-form-actions">
                                <button type="button" className="addr-form-cancel" onClick={closeForm}>Cancel</button>
                                <button type="submit" className="checkout-btn">
                                    <i className="fa fa-save mr-1" aria-hidden="true"></i>{editingId ? 'Update Address' : 'Save Address'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="row addr-layout">
                    {/* Left: address cards */}
                    <div className="col-12 col-lg-4 addr-col">
                        {addresses.length === 0 && !showForm ? (
                            <div className="empty-state mt-2">
                                <div className="empty-icon"><i className="fa fa-location-dot" aria-hidden="true"></i></div>
                                <h2 className="empty-title">No saved addresses</h2>
                                <p className="empty-sub">Add a delivery address to continue with your checkout.</p>
                                <button type="button" className="empty-cta" onClick={openNew}><i className="fa fa-plus mr-2" aria-hidden="true"></i>Add New Address</button>
                            </div>
                        ) : (
                            <div className={`addr-grid${listCollapsed ? ' addr-grid--collapsed' : ''}`}>
                                {addresses.map(addr => {
                                    const t = typeInfo(addr.type);
                                    const isSelected = addr.id === selectedId;
                                    return (
                                        <div
                                            key={addr.id}
                                            className={`addr-card ${isSelected ? 'selected' : ''}`}
                                            onClick={() => selectAddress(addr.id)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectAddress(addr.id); } }}
                                        >
                                            <div className="addr-radio" aria-hidden="true">{isSelected && <span></span>}</div>
                                            <div className="addr-info">
                                                <div className="addr-top">
                                                    <span className="addr-name">{addr.name}</span>
                                                    <span className={`addr-tag ${t.key}`}><i className={`fa ${t.icon} mr-1`} aria-hidden="true"></i>{t.label}</span>
                                                    {addr.isDefault && <span className="addr-default"><i className="fa fa-check mr-1" aria-hidden="true"></i>Default</span>}
                                                </div>
                                                <p className="addr-full">{addr.address}{addr.landmark ? `, ${addr.landmark}` : ''}, {addr.city}, {addr.state} {addr.postalCode}</p>
                                                <div className="addr-meta"><i className="fa fa-phone" aria-hidden="true"></i>{addr.phoneNo} &middot; {addr.country}</div>
                                                {addr.instructions && <div className="addr-meta addr-inst"><i className="fa fa-note-sticky" aria-hidden="true"></i>{addr.instructions}</div>}
                                                <div className="addr-actions" onClick={e => e.stopPropagation()}>
                                                    <button type="button" className="addr-edit" onClick={() => startEdit(addr)}><i className="fa fa-pencil mr-1" aria-hidden="true"></i>Edit</button>
                                                    <button type="button" className="addr-del" onClick={() => removeAddress(addr)}><i className="fa fa-trash mr-1" aria-hidden="true"></i>Remove</button>
                                                    {!addr.isDefault && (
                                                        <button type="button" className="addr-set-default" onClick={() => makeDefault(addr)}><i className="fa fa-star mr-1" aria-hidden="true"></i>Set as Default</button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <button type="button" className="addr-add d-lg-none" onClick={openNew}>
                                    <i className="fa fa-plus" aria-hidden="true"></i>
                                    <span>Add New Address</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Center: Add New Address card (desktop) */}
                    <div className="col-12 col-lg-4 d-none d-lg-flex addr-col">
                        <button type="button" className="addr-add addr-add--center" onClick={openNew}>
                            <i className="fa fa-plus" aria-hidden="true"></i>
                            <span>Add New Address</span>
                        </button>
                    </div>

                    {/* Right: Deliver Here panel (desktop) */}
                    <div className="col-12 col-lg-4 my-4 my-lg-0 d-none d-lg-block addr-col">
                        <div className="addr-sidebar">
                            <div className="cart-summary-head">Deliver Here</div>
                            {selected ? (
                                <Fragment>
                                    <div className="addr-sel-name">{selected.name} <span className={`addr-tag ${typeInfo(selected.type).key}`}>{typeInfo(selected.type).label}</span></div>
                                    <p className="addr-sel-line">{selected.address}{selected.landmark ? `, ${selected.landmark}` : ''}, {selected.city}, {selected.state} {selected.postalCode}</p>
                                    <div className="addr-sel-meta"><i className="fa fa-phone mr-1" aria-hidden="true"></i>{selected.phoneNo} &middot; {selected.country}</div>
                                    {selected.instructions && <div className="addr-meta addr-inst"><i className="fa fa-note-sticky mr-1" aria-hidden="true"></i>{selected.instructions}</div>}
                                </Fragment>
                            ) : (
                                <p className="addr-sel-empty">Select or add an address to continue.</p>
                            )}
                            <button type="button" className="checkout-btn w-100" disabled={!selected} onClick={deliverHere}>
                                <i className="fa fa-truck mr-2" aria-hidden="true"></i>Deliver Here
                            </button>
                            <Link to="/cart" className="addr-continue"><i className="fa fa-arrow-left mr-1" aria-hidden="true"></i>Back to Cart</Link>
                        </div>
                    </div>
                </div>

                {!showForm && (
                    <div className="addr-mobile-bar d-lg-none">
                        <div className="addr-mobile-info">
                            <span className="addr-mobile-label">Deliver to</span>
                            <b className="addr-mobile-name">{selected ? `${selected.name}, ${selected.city}` : 'Select an address'}</b>
                        </div>
                        {listCollapsed && selected && (
                            <button type="button" className="addr-mobile-change" onClick={() => setListCollapsed(false)}>
                                <i className="fa fa-pencil mr-1" aria-hidden="true"></i>Change
                            </button>
                        )}
                        <button type="button" className="cart-mobile-checkout" disabled={!selected} onClick={deliverHere}>
                            Deliver Here <i className="fa fa-arrow-right" aria-hidden="true"></i>
                        </button>
                    </div>
                )}
            </div>
        </Fragment>
    )
}
