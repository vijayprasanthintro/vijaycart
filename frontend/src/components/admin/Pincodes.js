import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { getSettings, updateSettings } from '../../actions/settingActions';
import { toast } from 'react-toastify';

export default function Pincodes() {
    const { settings } = useSelector(state => state.settingState);
    const dispatch = useDispatch();

    const [pincodes, setPincodes] = useState([]);
    const [newCode, setNewCode] = useState('');
    const [lookup, setLookup] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        dispatch(getSettings());
    }, [dispatch]);

    useEffect(() => {
        if (Array.isArray(settings.codPincodes)) setPincodes(settings.codPincodes);
    }, [settings]);

    const addCode = () => {
        const code = newCode.replace(/\D/g, '');
        if (code.length !== 6) {
            toast('Enter a valid 6-digit pincode', { type: 'error', position: toast.POSITION.BOTTOM_CENTER });
            return;
        }
        if (pincodes.includes(code)) {
            toast('Pincode already on the list', { type: 'warning', position: toast.POSITION.BOTTOM_CENTER });
            return;
        }
        setPincodes(p => [...p, code]);
        setNewCode('');
    };

    const removeCode = code => setPincodes(p => p.filter(c => c !== code));

    const save = async () => {
        setSaving(true);
        const res = await dispatch(updateSettings({ codPincodes: pincodes }));
        setSaving(false);
        if (res && !res.success) {
            toast(res.error, { type: 'error', position: toast.POSITION.BOTTOM_CENTER });
        } else {
            toast('Pincode list saved', { type: 'success', position: toast.POSITION.BOTTOM_CENTER });
        }
    };

    const addToAllowList = code => {
        if (!code || pincodes.includes(code)) return;
        setPincodes(p => [...p, code]);
        toast(`${code} added — press Save to apply`, { type: 'success', position: toast.POSITION.BOTTOM_CENTER });
    };

    const doLookup = async () => {
        const code = lookup.replace(/\D/g, '');
        if (code.length < 3) {
            toast('Enter a valid pincode', { type: 'error', position: toast.POSITION.BOTTOM_CENTER });
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const loc = await axios.get(`/api/v1/pincode/${code}?country=in`);
            let cod = null;
            try {
                const c = await axios.get(`/api/v1/pincode/${code}/cod?amount=${Number(settings.codMaxAmount) || 5000}`);
                cod = c.data;
            } catch { cod = null; }
            setResult({ code, ...(loc.data.data || {}), source: loc.data.source, cod });
        } catch (error) {
            toast(error?.response?.data?.message || 'Could not look up that pincode', { type: 'error', position: toast.POSITION.BOTTOM_CENTER });
        } finally {
            setLoading(false);
        }
    };

    const sourceLabel = { live: 'Live postal lookup', bundled: 'Bundled database', generated: 'Derived estimate' };

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Pincode &amp; COD</h1>
                    <p>Manage serviceable pincodes and check Cash on Delivery availability</p>
                </div>
            </div>

            <div className="ad-split">
                {/* Serviceable pincodes */}
                <div className="ad-card ad-card--lift">
                    <div className="ad-card__head">
                        <h3 className="ad-card__title"><i className="fa fa-map-marker" aria-hidden="true"></i> Serviceable Pincodes</h3>
                        <span className="ad-help"><i className="fa fa-info-circle mr-1" aria-hidden="true"></i>{pincodes.length} listed</span>
                    </div>
                    <div className="ad-card__body">
                        <div className="ad-help ad-help--box">
                            <i className="fa fa-hand-holding-dollar" aria-hidden="true"></i>
                            &nbsp;COD is {settings.codEnabled === false ? 'disabled store-wide' : 'enabled'} · max order amount {settings.codMaxAmount ? `₹${Number(settings.codMaxAmount).toLocaleString('en-IN')}` : '₹5,000'}.
                            When a list is present, COD is only offered at these pincodes.
                        </div>

                        <div className="ad-bulk-bar ad-bulk-bar--standalone">
                            <input
                                className="ad-input ad-input--sm"
                                placeholder="Add 6-digit pincode"
                                inputMode="numeric"
                                maxLength={6}
                                value={newCode}
                                onChange={e => setNewCode(e.target.value.replace(/\D/g, ''))}
                                onKeyDown={e => { if (e.key === 'Enter') addCode(); }}
                            />
                            <button type="button" className="ad-btn ad-btn--soft ad-btn--sm" onClick={addCode}><i className="fa fa-plus" aria-hidden="true"></i> Add</button>
                            <button type="button" className="ad-btn ad-btn--primary ad-btn--sm" onClick={save} disabled={saving}>
                                {saving ? <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> : <i className="fa fa-check" aria-hidden="true"></i>} Save
                            </button>
                        </div>

                        {pincodes.length === 0 ? (
                            <div className="ad-empty ad-empty--small"><i className="fa fa-globe" aria-hidden="true"></i><p>No allow-list — COD is available at all pincodes.</p></div>
                        ) : (
                            <div className="ad-pincode-chips">
                                {pincodes.map(code => (
                                    <span className="ad-chip ad-chip--remove" key={code}>
                                        <i className="fa fa-map-pin" aria-hidden="true"></i>{code}
                                        <button type="button" onClick={() => removeCode(code)} aria-label={`Remove ${code}`}><i className="fa fa-times" aria-hidden="true"></i></button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Lookup */}
                <div className="ad-card ad-card--lift">
                    <div className="ad-card__head">
                        <h3 className="ad-card__title"><i className="fa fa-search-location" aria-hidden="true"></i> Pincode Lookup</h3>
                        <span className="ad-help">Live postal database</span>
                    </div>
                    <div className="ad-card__body">
                        <div className="ad-bulk-bar ad-bulk-bar--standalone">
                            <input
                                className="ad-input ad-input--sm"
                                placeholder="e.g. 560001"
                                inputMode="numeric"
                                value={lookup}
                                onChange={e => setLookup(e.target.value.replace(/\D/g, ''))}
                                onKeyDown={e => { if (e.key === 'Enter') doLookup(); }}
                            />
                            <button type="button" className="ad-btn ad-btn--primary ad-btn--sm" onClick={doLookup} disabled={loading}>
                                {loading ? <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> : <i className="fa fa-search" aria-hidden="true"></i>} Lookup
                            </button>
                        </div>

                        {!result && !loading && (
                            <div className="ad-empty ad-empty--small"><i className="fa fa-location-arrow" aria-hidden="true"></i><p>Check any pincode for city / state details and COD availability.</p></div>
                        )}
                        {loading && (
                            <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Looking up pincode…</div>
                        )}
                        {result && (
                            <div className="ad-pincode-result">
                                <div className="ad-pincode-result__head">
                                    <span className="ad-pincode-result__code ad-td-mono">{result.code}</span>
                                    <span className="ad-badge ad-badge--primary">{sourceLabel[result.source] || 'Lookup'}</span>
                                </div>
                                <div className="ad-pincode-result__grid">
                                    <div><span className="ad-stat__label">State</span><b>{result.state || '—'}</b></div>
                                    <div><span className="ad-stat__label">District</span><b>{result.district || '—'}</b></div>
                                    <div><span className="ad-stat__label">City / Block</span><b>{result.city || '—'}</b></div>
                                    <div><span className="ad-stat__label">Area</span><b>{result.area || '—'}</b></div>
                                </div>
                                {result.cod && (
                                    <div className={`ad-pincode-result__cod ${result.cod.available ? 'ad-pincode-result__cod--ok' : 'ad-pincode-result__cod--no'}`}>
                                        <i className={`fa ${result.cod.available ? 'fa-check-circle' : 'fa-times-circle'}`} aria-hidden="true"></i>
                                        <div>
                                            <b>COD {result.cod.available ? 'available' : 'not available'}</b>
                                            <span>{result.cod.available
                                                ? `Orders up to ₹${Number(result.cod.maxAmount).toLocaleString('en-IN')} can be paid in cash here.`
                                                : (result.cod.reason || 'Cash on Delivery is not offered at this pincode.')}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="ad-pincode-result__actions">
                                    {!pincodes.includes(result.code) ? (
                                        <button type="button" className="ad-btn ad-btn--soft ad-btn--sm" onClick={() => addToAllowList(result.code)}>
                                            <i className="fa fa-plus" aria-hidden="true"></i> Add to allow-list
                                        </button>
                                    ) : (
                                        <span className="ad-badge ad-badge--success"><i className="fa fa-check" aria-hidden="true"></i> On allow-list</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Fragment>
    );
}
