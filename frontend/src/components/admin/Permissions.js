import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSettings, updateSettings } from '../../actions/settingActions';
import { clearSettingsState } from '../../actions/settingActions';
import { toast } from 'react-toastify';

const MODULE_GROUPS = [
    {
        group: 'Admin Modules',
        modules: [
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'orders', label: 'Orders' },
            { key: 'products', label: 'Products' },
            { key: 'categories', label: 'Categories' },
            { key: 'coupons', label: 'Coupons' },
            { key: 'delivery', label: 'Delivery Boys' },
            { key: 'users', label: 'Users' },
            { key: 'analytics', label: 'Analytics' },
            { key: 'revenue', label: 'Revenue' },
            { key: 'inventory', label: 'Inventory' },
            { key: 'reviews', label: 'Reviews' },
            { key: 'settings', label: 'Settings' },
            { key: 'permissions', label: 'Permissions' }
        ]
    },
    {
        group: 'Customer Modules',
        modules: [
            { key: 'browse', label: 'Browse & Search' },
            { key: 'checkout', label: 'Checkout' },
            { key: 'track', label: 'Track Orders' },
            { key: 'reviews', label: 'Leave Reviews' },
            { key: 'wishlist', label: 'Wishlist' }
        ]
    }
];

const ROLES = [
    { key: 'admin', label: 'Admin' },
    { key: 'deliveryboy', label: 'Delivery Boy' },
    { key: 'user', label: 'User' }
];

const ALL_KEYS = MODULE_GROUPS.flatMap(g => g.modules.map(m => m.key));

const DEFAULTS = {
    admin: Object.fromEntries(ALL_KEYS.map(k => [k, true])),
    deliveryboy: Object.fromEntries(ALL_KEYS.map(k => ['orders', 'delivery', 'track'].includes(k))),
    user: Object.fromEntries(ALL_KEYS.map(k => ['browse', 'checkout', 'track', 'reviews', 'wishlist'].includes(k)))
};

export default function Permissions() {
    const { settings, loading, error, isUpdated } = useSelector(state => state.settingState);
    const dispatch = useDispatch();

    const [matrix, setMatrix] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        dispatch(getSettings());
    }, [dispatch]);

    useEffect(() => {
        if (settings.permissions && Object.keys(settings.permissions).length > 0) {
            const merged = {};
            ROLES.forEach(r => {
                merged[r.key] = { ...DEFAULTS[r.key], ...(settings.permissions[r.key] || {}) };
            });
            setMatrix(merged);
        } else if (settings.storeName !== undefined) {
            setMatrix(JSON.parse(JSON.stringify(DEFAULTS)));
        }
    }, [settings.storeName, settings.permissions]);

    useEffect(() => {
        if (error) {
            toast(error, { type: 'error', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearSettingsState()) });
        }
        if (isUpdated) {
            toast('Permissions saved', { type: 'success', position: toast.POSITION.BOTTOM_CENTER, onOpen: () => dispatch(clearSettingsState()) });
        }
    }, [dispatch, error, isUpdated]);

    const toggle = (role, module) => {
        setMatrix(m => ({
            ...m,
            [role]: { ...m[role], [module]: !m[role][module] }
        }));
    };

    const save = async () => {
        setSaving(true);
        const res = await dispatch(updateSettings({ permissions: matrix }));
        setSaving(false);
        if (res && !res.success) toast(res.error, { type: 'error' });
    };

    const reset = () => setMatrix(JSON.parse(JSON.stringify(DEFAULTS)));

    return (
        <Fragment>
            <div className="ad-page-head">
                <div>
                    <h1>Permissions</h1>
                    <p>Roles &amp; module access matrix</p>
                </div>
                <div className="ad-toolbar">
                    <button type="button" className="ad-btn ad-btn--ghost" onClick={reset}><i className="fa fa-undo" aria-hidden="true"></i> Reset Defaults</button>
                    <button type="button" className="ad-btn ad-btn--primary" onClick={save} disabled={!matrix || saving}>
                        {saving ? <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> : <i className="fa fa-check" aria-hidden="true"></i>}
                        Save Permissions
                    </button>
                </div>
            </div>

            {loading && !matrix ? (
                <div className="ad-loading"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Loading permissions…</div>
            ) : (
                <div className="ad-card">
                    <div className="ad-card__head">
                        <h3 className="ad-card__title"><i className="fa fa-shield-alt" aria-hidden="true"></i> Access Matrix</h3>
                        <span className="ad-help"><i className="fa fa-info-circle mr-1" aria-hidden="true"></i>Toggle which modules each role can access.</span>
                    </div>
                    <div className="ad-card__body">
                        {MODULE_GROUPS.map(group => (
                            <div key={group.group} style={{ marginBottom: '1.2rem' }}>
                                <h4 className="ad-label" style={{ fontSize: '0.78rem', marginBottom: '0.5rem' }}>{group.group}</h4>
                                <div className="ad-table-wrap">
                                    <table className="ad-perm">
                                        <thead>
                                            <tr>
                                                <th>Module</th>
                                                {ROLES.map(r => <th key={r.key}>{r.label}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.modules.map(mod => (
                                                <tr key={mod.key}>
                                                    <td>{mod.label}</td>
                                                    {ROLES.map(r => (
                                                        <td key={r.key}>
                                                            <label className="ad-toggle">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!matrix?.[r.key]?.[mod.key]}
                                                                    onChange={() => toggle(r.key, mod.key)}
                                                                />
                                                                <span className="ad-toggle__slider"></span>
                                                            </label>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Fragment>
    );
}
