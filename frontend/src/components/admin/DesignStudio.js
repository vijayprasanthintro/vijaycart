import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
    getDesigns,
    applyDesign,
    saveDesign,
    resetDesign
} from '../../actions/settingActions';
import {
    DEFAULT_DESIGN_ID,
    FONT_OPTIONS,
    COLOR_FIELDS,
    RANGE_FIELDS,
    BUTTON_STYLE_OPTIONS,
    CARD_STYLE_OPTIONS,
    IMAGE_RATIO_OPTIONS,
    asHex,
    resolveTokens,
    designSwatches
} from '../../designs/designUtils';
import StorefrontPreview from './StorefrontPreview';

const DEVICES = [
    { id: 'desktop', label: 'Desktop', icon: 'fa-desktop', width: 1440, height: 980 },
    { id: 'tablet', label: 'Tablet', icon: 'fa-tablet', width: 820, height: 1020 },
    { id: 'mobile', label: 'Mobile', icon: 'fa-mobile', width: 390, height: 820 }
];

const DEVICE_MAP = DEVICES.reduce((map, item) => {
    map[item.id] = item;
    return map;
}, {});

function stableStringify(value) {
    if (!value || typeof value !== 'object') return JSON.stringify(value);
    return JSON.stringify(Object.keys(value).sort().reduce((acc, key) => {
        acc[key] = value[key];
        return acc;
    }, {}));
}

function formatDate(value) {
    if (!value) return 'Not applied yet';
    try {
        return new Date(value).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (error) {
        return 'Recently';
    }
}

/* ------------------------------------------------------------------ */
/* Thumbnail                                                           */
/* ------------------------------------------------------------------ */

function DesignThumb({ design }) {
    const t = design.tokens || {};
    const catColors = [t.primary, t.secondary, t.accent, t.primarySoft, t.secondarySoft, t.surfaceAlt, t.primary, t.secondary];

    return (
        <div
            className="ds-thumb"
            data-design={design.id}
            style={{ background: t.background, color: t.text }}
            aria-hidden="true"
        >
            <div className="ds-thumb__nav" style={{ background: t.navBg, color: t.navText }}>
                <span className="ds-thumb__nav-dot" />
                <span className="ds-thumb__nav-dot" />
                <span className="ds-thumb__search" />
                <span style={{ fontSize: 5, opacity: 0.8 }}>Cart</span>
            </div>
            <div className="ds-thumb__cats">
                {catColors.map((color, index) => (
                    <span
                        key={index}
                        className="ds-thumb__cat"
                        style={{ background: color, border: `1px solid ${t.border || 'transparent'}` }}
                    />
                ))}
            </div>
            <div className="ds-thumb__hero" style={{ background: t.heroGradient }}>
                <div className="ds-thumb__hero-copy">
                    <span className="ds-thumb__line ds-thumb__line--sm" style={{ background: t.secondary }} />
                    <span className="ds-thumb__line ds-thumb__line--xs" style={{ background: '#fff' }} />
                    <span className="ds-thumb__line ds-thumb__line--sm" style={{ background: '#fff' }} />
                </div>
                <span className="ds-thumb__hero-art" />
            </div>
            <div className="ds-thumb__grid">
                {[0, 1, 2, 3].map((index) => (
                    <div className="ds-thumb__product" key={index}>
                        <div
                            className="ds-thumb__img"
                            style={{ background: t.surfaceAlt, color: t.text }}
                        >
                            <i className="fa fa-mobile" />
                        </div>
                        <span className="ds-thumb__bar" style={{ background: t.text }} />
                        <span className="ds-thumb__bar ds-thumb__bar--short" style={{ background: t.primary }} />
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Scaled live preview frame                                           */
/* ------------------------------------------------------------------ */

function PreviewFrame({ design, tokens, device }) {
    const hostRef = useRef(null);
    const [scale, setScale] = useState(1);
    const spec = DEVICE_MAP[device] || DEVICE_MAP.desktop;

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return undefined;

        const compute = () => {
            const available = host.clientWidth - 16;
            const next = Math.max(0.2, Math.min(1, available / spec.width));
            setScale(next);
        };

        compute();
        let observer = null;
        if (typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(compute);
            observer.observe(host);
        }
        window.addEventListener('resize', compute);
        return () => {
            if (observer) observer.disconnect();
            window.removeEventListener('resize', compute);
        };
    }, [spec.width]);

    const screenWidth = Math.round(spec.width * scale);
    const screenHeight = Math.round(spec.height * scale);

    return (
        <div className="ds-frame-host" ref={hostRef}>
            <div
                className={`ds-frame ds-frame--${device}`}
                style={{ width: screenWidth + 16 }}
            >
                <div className="ds-screen" style={{ width: screenWidth, height: screenHeight }}>
                    <div
                        className="ds-page"
                        style={{
                            width: spec.width,
                            height: spec.height,
                            transform: `scale(${scale})`
                        }}
                    >
                        <StorefrontPreview design={design} tokens={tokens} device={device} />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Studio                                                              */
/* ------------------------------------------------------------------ */

export default function DesignStudio() {
    const dispatch = useDispatch();
    const settingsState = useSelector((state) => state.settingState) || {};
    const settings = settingsState.settings || {};
    const activeState = settings.design || {};
    const activeId = activeState.designId || DEFAULT_DESIGN_ID;
    const activeCustomization = useMemo(
        () => activeState.customization || {},
        [activeState.customization]
    );
    const activeTokens = activeState.tokens;

    const [designs, setDesigns] = useState([]);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [catalogError, setCatalogError] = useState('');

    const [selectedId, setSelectedId] = useState(null);
    const [customization, setCustomization] = useState({});
    const [customByDesign, setCustomByDesign] = useState({});
    const [history, setHistory] = useState([]);
    const [future, setFuture] = useState([]);

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [device, setDevice] = useState('desktop');
    const [fullPreview, setFullPreview] = useState(false);
    const [busy, setBusy] = useState(null);

    const workbenchRef = useRef(null);
    const initializedRef = useRef(false);

    /* Load the catalog once. */
    useEffect(() => {
        let mounted = true;
        setCatalogLoading(true);
        dispatch(getDesigns()).then((result) => {
            if (!mounted) return;
            if (result.success && result.designs.length) {
                setDesigns(result.designs);
                setCatalogError('');
            } else {
                setCatalogError(result.error || 'Could not load the design catalog.');
            }
            setCatalogLoading(false);
        });
        return () => { mounted = false; };
    }, [dispatch]);

    /* Choose the initially selected design once settings have settled. */
    useEffect(() => {
        if (initializedRef.current || !designs.length || selectedId) return;
        const settled = !!settings.design || !!settingsState.error;
        if (!settled) return;
        const initial = designs.some((d) => d.id === activeId) ? activeId : designs[0].id;
        initializedRef.current = true;
        setSelectedId(initial);
        setCustomization(initial === activeId ? activeCustomization : {});
    }, [designs, selectedId, settings.design, settingsState.error, activeId, activeCustomization]);

    /* Remember per-design edits while the admin compares templates. */
    useEffect(() => {
        if (!selectedId) return;
        setCustomByDesign((prev) => ({ ...prev, [selectedId]: customization }));
    }, [selectedId, customization]);

    const selectedDesign = useMemo(
        () => designs.find((d) => d.id === selectedId) || null,
        [designs, selectedId]
    );
    const activeDesign = useMemo(
        () => designs.find((d) => d.id === activeId) || null,
        [designs, activeId]
    );

    const previewTokens = useMemo(
        () => resolveTokens(selectedDesign ? selectedDesign.tokens : {}, customization),
        [selectedDesign, customization]
    );

    const categories = useMemo(() => {
        const set = new Set(designs.map((d) => d.category));
        return ['All', ...Array.from(set)];
    }, [designs]);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return designs.filter((design) => {
            if (category !== 'All' && design.category !== category) return false;
            if (!query) return true;
            const haystack = [
                design.name, design.shortName, design.category, design.description,
                design.tagline, ...(design.tags || [])
            ].join(' ').toLowerCase();
            return haystack.includes(query);
        });
    }, [designs, search, category]);

    const isActive = selectedId === activeId;
    const isDirty = !isActive
        || stableStringify(customization) !== stableStringify(activeCustomization);

    const activeSwatches = designSwatches(
        activeTokens || (activeDesign ? activeDesign.tokens : previewTokens)
    );

    /* ---------------- history ---------------- */

    const pushHistory = useCallback((snapshot) => {
        setHistory((prev) => [...prev.slice(-49), snapshot]);
        setFuture([]);
    }, []);

    const setCustom = useCallback((key, value) => {
        pushHistory({ selectedId, customization });
        setCustomization((prev) => ({ ...prev, [key]: value }));
    }, [pushHistory, selectedId, customization]);

    const selectDesign = useCallback((id, options = {}) => {
        if (!id) return;
        if (id !== selectedId) {
            pushHistory({ selectedId, customization });
            setSelectedId(id);
            setCustomization(
                customByDesign[id] !== undefined
                    ? customByDesign[id]
                    : (id === activeId ? activeCustomization : {})
            );
        }
        if (options.scroll) {
            window.setTimeout(() => {
                if (workbenchRef.current) {
                    workbenchRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 80);
        }
    }, [pushHistory, selectedId, customization, customByDesign, activeId, activeCustomization]);

    const undo = useCallback(() => {
        if (!history.length) return;
        const previous = history[history.length - 1];
        setFuture((prev) => [{ selectedId, customization }, ...prev].slice(0, 50));
        setHistory((prev) => prev.slice(0, -1));
        setSelectedId(previous.selectedId);
        setCustomization(previous.customization);
    }, [history, selectedId, customization]);

    const redo = useCallback(() => {
        if (!future.length) return;
        const next = future[0];
        setHistory((prev) => [...prev.slice(-49), { selectedId, customization }]);
        setFuture((prev) => prev.slice(1));
        setSelectedId(next.selectedId);
        setCustomization(next.customization);
    }, [future, selectedId, customization]);

    useEffect(() => {
        const onKeyDown = (event) => {
            const tag = (event.target && event.target.tagName) || '';
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
            const mod = event.ctrlKey || event.metaKey;
            if (mod && event.key.toLowerCase() === 'z') {
                event.preventDefault();
                if (event.shiftKey) redo(); else undo();
            } else if (mod && event.key.toLowerCase() === 'y') {
                event.preventDefault();
                redo();
            } else if (event.key === 'Escape') {
                setFullPreview(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [undo, redo]);

    /* ---------------- actions ---------------- */

    const handleApply = useCallback(async (designId = selectedId, custom = customization) => {
        if (!designId || busy) return;
        setBusy('apply');
        const result = await dispatch(applyDesign(designId, custom));
        setBusy(null);
        if (result.success) {
            toast.success('Design applied to your live storefront.');
            setSelectedId(designId);
            setCustomization(custom);
        } else {
            toast.error(result.error || 'Could not apply the design.');
        }
    }, [busy, dispatch, selectedId, customization]);

    const handleSave = useCallback(async () => {
        if (!selectedId || busy) return;
        setBusy('save');
        const result = await dispatch(saveDesign(selectedId, customization));
        setBusy(null);
        if (result.success) {
            toast.success('Design saved.');
        } else {
            toast.error(result.error || 'Could not save the design.');
        }
    }, [busy, dispatch, selectedId, customization]);

    const handleExport = useCallback(() => {
        const payload = { version: 1, designId: selectedId, customization, exportedAt: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vijaycart-theme-${selectedId || 'custom'}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Theme exported.');
    }, [selectedId, customization]);

    const handleImport = useCallback(async (event) => {
        const file = event.target.files && event.target.files[0];
        if (event.target) event.target.value = '';
        if (!file) return;
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            const imported = parsed.customization || parsed.tokens || parsed;
            if (!imported || typeof imported !== 'object' || Array.isArray(imported)) throw new Error('Invalid theme file');
            pushHistory({ selectedId, customization });
            if (parsed.designId && designs.some((d) => d.id === parsed.designId)) setSelectedId(parsed.designId);
            setCustomization((prev) => ({ ...prev, ...imported }));
            toast.success('Theme imported. Review preview, then Save/Apply.');
        } catch (err) {
            toast.error(err.message || 'Import failed.');
        }
    }, [selectedId, customization, designs, pushHistory]);

    const handleReset = useCallback(async () => {
        if (busy) return;
        const target = activeState.previousDesignId
            ? (designs.find((d) => d.id === activeState.previousDesignId)?.name || 'the previous design')
            : 'the default design';
        if (!window.confirm(`Restore ${target} on the live storefront?`)) return;
        setBusy('reset');
        const result = await dispatch(resetDesign());
        setBusy(null);
        if (result.success) {
            toast.success('Previous design restored.');
            const nextId = result.settings?.design?.designId;
            if (nextId) {
                setSelectedId(nextId);
                setCustomization(result.settings.design.customization || {});
            }
        } else {
            toast.error(result.error || 'Could not reset the design.');
        }
    }, [busy, dispatch, activeState.previousDesignId, designs]);

    const resetCustomization = useCallback(() => {
        pushHistory({ selectedId, customization });
        setCustomization({});
        toast.info('Customization reset to the template defaults.');
    }, [pushHistory, selectedId, customization]);

    const hasUnsavedChanges = Object.keys(customization).length > 0;
    useEffect(() => {
        if (!hasUnsavedChanges) return undefined;
        const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [hasUnsavedChanges]);

    const openPreview = useCallback((id) => {
        if (id && id !== selectedId) selectDesign(id);
        setFullPreview(true);
    }, [selectedId, selectDesign]);

    const customFor = (designId) => (
        designId === selectedId
            ? customization
            : (customByDesign[designId] || {})
    );

    /* ---------------- render helpers ---------------- */

    const rangeValue = (key) => {
        const raw = customization[key];
        if (raw !== undefined && raw !== null && raw !== '') return Number(raw);
        if (!selectedDesign) return 0;
        const token = selectedDesign.tokens[key];
        if (key === 'shadow') {
            // Design tokens store shadows as CSS strings, not a 0–2 strength.
            if (!token || token === 'none') return 0;
            return 1;
        }
        const numeric = Number(token);
        return Number.isFinite(numeric) ? numeric : 0;
    };

    const renderRange = (field) => {
        const value = rangeValue(field.key);
        const pct = Math.max(0, Math.min(100, ((value - field.min) / (field.max - field.min)) * 100));
        return (
            <div className="ds-field" key={field.key}>
                <label htmlFor={`ds-${field.key}`}>
                    {field.label}
                    <span>{field.key === 'animationIntensity' ? `${Math.round(value * 100)}%` : `${value}${field.unit}`}</span>
                </label>
                <input
                    id={`ds-${field.key}`}
                    className="ds-range"
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={value}
                    onChange={(event) => setCustom(field.key, Number(event.target.value))}
                    style={{
                        background: `linear-gradient(90deg, var(--ad-primary) ${pct}%, var(--ad-surface-3) ${pct}%)`
                    }}
                />
            </div>
        );
    };

    const hexToRgb = (hex) => {
        const h = asHex(hex, '#000000').replace('#', '');
        const n = parseInt(h, 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    };
    const rgbToHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Number(v) || 0)).toString(16).padStart(2, '0')).join('');
    const luminance = (hex) => {
        const { r, g, b } = hexToRgb(hex);
        const lin = [r, g, b].map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
        return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
    };
    const contrastRatio = (a, b) => {
        const l1 = luminance(a); const l2 = luminance(b);
        const hi = Math.max(l1, l2); const lo = Math.min(l1, l2);
        return (hi + 0.05) / (lo + 0.05);
    };

    const renderColor = (field) => {
        const raw = customization[field.key] !== undefined
            ? customization[field.key]
            : (selectedDesign ? selectedDesign.tokens[field.key] : '#2563eb');
        const value = asHex(raw, '#2563eb');
        const rgb = hexToRgb(value);
        const hasOverride = customization[field.key] !== undefined;
        return (
            <div className="ds-color" key={field.key} title={field.hint}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'center' }}>
                    <label htmlFor={`ds-color-${field.key}`}>{field.label}</label>
                    {hasOverride && (
                        <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm" style={{ padding: '0 6px', fontSize: 10 }} onClick={() => {
                            setCustomization((prev) => { const next = { ...prev }; delete next[field.key]; return next; });
                        }}>Reset</button>
                    )}
                </div>
                <div className="ds-color__control" style={{ gap: 6, flexWrap: 'wrap' }}>
                    <input
                        id={`ds-color-${field.key}`}
                        type="color"
                        value={value}
                        onChange={(event) => setCustom(field.key, event.target.value)}
                        aria-label={field.label}
                    />
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => { const v = e.target.value.trim(); if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) setCustom(field.key, asHex(v, value)); }}
                        aria-label={`${field.label} hex`}
                        style={{ width: 82, fontSize: 11, padding: '2px 4px', border: '1px solid var(--ad-border,#dbe3ee)', borderRadius: 6 }}
                    />
                    <span style={{ fontSize: 10, color: 'var(--ad-text-3,#64748b)' }}>RGB</span>
                    {['r','g','b'].map((ch, i) => (
                        <input key={ch} type="number" min="0" max="255" value={rgb[ch]}
                            onChange={(e) => { const next = { ...rgb, [ch]: e.target.value }; setCustom(field.key, rgbToHex(next.r, next.g, next.b)); }}
                            aria-label={`${field.label} ${ch}`}
                            style={{ width: 46, fontSize: 11, padding: '2px 4px', border: '1px solid var(--ad-border,#dbe3ee)', borderRadius: 6 }}
                        />
                    ))}
                </div>
                {(() => {
                    const bg = asHex(previewTokens.background || '#ffffff', '#ffffff');
                    const cr = contrastRatio(value, bg);
                    return cr < 3 ? <div style={{ fontSize: 10, color: '#b45309' }}>Low contrast vs background ({cr.toFixed(1)}:1)</div> : null;
                })()}
            </div>
        );
    };

    const selectedSpec = DEVICE_MAP[device] || DEVICE_MAP.desktop;

    return (
        <div className="ds-studio">
            {/* ---------------- Header ---------------- */}
            <section className="ds-hero">
                <div className="ds-hero__main">
                    <div>
                        <span className="ds-hero__eyebrow">
                            <i className="fa fa-paint-brush" aria-hidden="true"></i>
                            Website Design Studio
                        </span>
                        <h1>Ten premium storefronts. One click to go live.</h1>
                        <p>
                            Preview and fine-tune every design without touching the live store.
                            Only <strong>Apply Design</strong> changes what customers see.
                        </p>
                    </div>
                    <div className="ds-hero__actions">
                        <button
                            type="button"
                            className="ds-btn ds-btn--ghost ds-icon-btn"
                            onClick={undo}
                            disabled={!history.length}
                            aria-label="Undo"
                            title="Undo (Ctrl+Z)"
                        >
                            <i className="fa fa-undo" aria-hidden="true"></i>
                        </button>
                        <button
                            type="button"
                            className="ds-btn ds-btn--ghost ds-icon-btn"
                            onClick={redo}
                            disabled={!future.length}
                            aria-label="Redo"
                            title="Redo (Ctrl+Shift+Z)"
                        >
                            <i className="fa fa-repeat" aria-hidden="true"></i>
                        </button>
                        <button
                            type="button"
                            className="ds-btn ds-btn--ghost"
                            onClick={handleReset}
                            disabled={busy === 'reset'}
                        >
                            <i className={`fa ${busy === 'reset' ? 'fa-spinner fa-spin' : 'fa-history'}`} aria-hidden="true"></i>
                            Reset previous
                        </button>
                        <button
                            type="button"
                            className="ds-btn ds-btn--accent"
                            onClick={handleSave}
                            disabled={!selectedDesign || busy === 'save'}
                        >
                            <i className={`fa ${busy === 'save' ? 'fa-spinner fa-spin' : 'fa-floppy-o'}`} aria-hidden="true"></i>
                            Save design
                        </button>
                        <button
                            type="button"
                            className="ds-btn ds-btn--primary"
                            onClick={() => handleApply()}
                            disabled={!selectedDesign || busy === 'apply'}
                        >
                            <i className={`fa ${busy === 'apply' ? 'fa-spinner fa-spin' : 'fa-check-circle'}`} aria-hidden="true"></i>
                            Apply design
                        </button>
                    </div>
                </div>

                <div className="ds-hero__active">
                    <span className="ds-hero__swatches">
                        {activeSwatches.map((color, index) => (
                            <span key={`${color}-${index}`} style={{ background: color }} />
                        ))}
                    </span>
                    <div>
                        <div className="ds-hero__active-name">
                            {activeDesign ? activeDesign.name : 'Premium eMox Inspired'}
                            <span className="ds-live-dot" style={{ marginLeft: 8 }}>Live</span>
                            {isDirty && (
                                <span
                                    className="ds-chip is-active"
                                    style={{ marginLeft: 8, padding: '0.14rem 0.5rem', fontSize: '0.58rem', background: '#f59e0b', borderColor: '#f59e0b' }}
                                >
                                    Unsaved preview
                                </span>
                            )}
                        </div>
                        <div className="ds-hero__active-meta">
                            Applied {formatDate(activeState.appliedAt)} · {activeState.previousDesignId ? 'Reset target available' : 'No previous design'}
                        </div>
                    </div>
                </div>
            </section>

            {/* ---------------- Toolbar ---------------- */}
            <div className="ds-toolbar">
                <div className="ds-search">
                    <i className="fa fa-search" aria-hidden="true"></i>
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search designs, styles or moods…"
                        aria-label="Search designs"
                    />
                </div>
                <div className="ds-chips">
                    {categories.map((item) => (
                        <button
                            key={item}
                            type="button"
                            className={`ds-chip${category === item ? ' is-active' : ''}`}
                            onClick={() => setCategory(item)}
                        >
                            {item}
                        </button>
                    ))}
                </div>
                <span className="ds-count">{filtered.length} of {designs.length} designs</span>
            </div>

            {/* ---------------- Gallery ---------------- */}
            {catalogLoading ? (
                <div className="ds-skeleton-grid" aria-busy="true" aria-label="Loading designs">
                    {[0, 1, 2, 3, 4, 5].map((item) => <div className="ds-skeleton-card" key={item} />)}
                </div>
            ) : catalogError ? (
                <div className="ds-empty">
                    <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>
                    <h3>Design catalog unavailable</h3>
                    <p>{catalogError}</p>
                    <button
                        type="button"
                        className="ds-btn ds-btn--soft"
                        onClick={() => window.location.reload()}
                    >
                        <i className="fa fa-refresh" aria-hidden="true"></i> Retry
                    </button>
                </div>
            ) : (
                <>
                    {filtered.length === 0 ? (
                        <div className="ds-empty">
                            <i className="fa fa-search" aria-hidden="true"></i>
                            <h3>No designs match your search</h3>
                            <p>Try a different keyword or choose another category.</p>
                            <button
                                type="button"
                                className="ds-btn ds-btn--soft"
                                onClick={() => { setSearch(''); setCategory('All'); }}
                            >
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <div className="ds-gallery">
                            {filtered.map((design) => {
                                const live = design.id === activeId;
                                const selected = design.id === selectedId;
                                return (
                                    <article
                                        key={design.id}
                                        className={`ds-card${selected ? ' is-selected' : ''}${live ? ' is-live' : ''}`}
                                        onClick={() => selectDesign(design.id)}
                                    >
                                        <span className="ds-card__select">
                                            <i className={`fa ${selected ? 'fa-check' : 'fa-circle-o'}`} aria-hidden="true"></i>
                                        </span>
                                        <DesignThumb design={design} />
                                        <div className="ds-card__body">
                                            <div className="ds-card__top">
                                                <h3 className="ds-card__name">{design.name}</h3>
                                                <span className="ds-card__cat">{design.category}</span>
                                            </div>
                                            <p className="ds-card__desc">{design.description}</p>
                                            <div className="ds-card__tags">
                                                {(design.tags || []).slice(0, 4).map((tag) => (
                                                    <span className="ds-card__tag" key={tag}>{tag}</span>
                                                ))}
                                            </div>
                                            <div className="ds-card__actions">
                                                <button
                                                    type="button"
                                                    className="ds-btn ds-btn--soft ds-btn--sm"
                                                    onClick={(event) => { event.stopPropagation(); openPreview(design.id); }}
                                                >
                                                    <i className="fa fa-eye" aria-hidden="true"></i> Preview
                                                </button>
                                                <button
                                                    type="button"
                                                    className="ds-btn ds-btn--soft ds-btn--sm"
                                                    onClick={(event) => { event.stopPropagation(); selectDesign(design.id, { scroll: true }); }}
                                                >
                                                    <i className="fa fa-sliders" aria-hidden="true"></i> Customize
                                                </button>
                                                <button
                                                    type="button"
                                                    className="ds-btn ds-btn--primary ds-btn--sm"
                                                    onClick={(event) => { event.stopPropagation(); handleApply(design.id, customFor(design.id)); }}
                                                    disabled={!!busy}
                                                >
                                                    <i className="fa fa-check" aria-hidden="true"></i> Apply
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* ---------------- Workbench ---------------- */}
            {selectedDesign && (
                <div className="ds-workbench" ref={workbenchRef}>
                    <div className="ds-stage">
                        <div className="ds-stage__bar">
                            <div>
                                <div className="ds-stage__title">{selectedDesign.name}</div>
                                <div className="ds-stage__sub">
                                    {selectedSpec.width} × {selectedSpec.height} · {isActive ? 'Currently live' : 'Preview only — not live'}
                                </div>
                            </div>
                            <div className="ds-stage__spacer" />
                            <div className="ds-seg" role="group" aria-label="Preview device">
                                {DEVICES.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className={device === item.id ? 'is-active' : ''}
                                        onClick={() => setDevice(item.id)}
                                        aria-pressed={device === item.id}
                                    >
                                        <i className={`fa ${item.icon}`} aria-hidden="true"></i>
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                className="ds-btn ds-btn--soft ds-btn--sm"
                                onClick={() => openPreview(selectedDesign.id)}
                            >
                                <i className="fa fa-expand" aria-hidden="true"></i> Full screen
                            </button>
                        </div>
                        <div className="ds-stage__viewport">
                            <PreviewFrame
                                design={selectedDesign}
                                tokens={previewTokens}
                                device={device}
                            />
                        </div>
                    </div>

                    <aside className="ds-panel">
                        <div className="ds-panel__head">
                            <div>
                                <h3>Customize</h3>
                                <p>Instant preview · applies on save</p>
                            </div>
                            <div className="d-flex gap-1">
                                <button
                                    type="button"
                                    className="ds-btn ds-btn--soft ds-icon-btn"
                                    onClick={undo}
                                    disabled={!history.length}
                                    aria-label="Undo customization"
                                >
                                    <i className="fa fa-undo" aria-hidden="true"></i>
                                </button>
                                <button
                                    type="button"
                                    className="ds-btn ds-btn--soft ds-icon-btn"
                                    onClick={redo}
                                    disabled={!future.length}
                                    aria-label="Redo customization"
                                >
                                    <i className="fa fa-repeat" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>

                        <div className="ds-panel__body">
                            <section className="ds-panel__section">
                                <h4><i className="fa fa-tint" aria-hidden="true"></i> Colours</h4>
                                {Array.from(new Set(COLOR_FIELDS.map((f) => f.group))).map((groupName) => (
                                    <details key={groupName} className="ds-color-group" open={groupName === 'Global colors'}>
                                        <summary className="ds-color-group__title">{groupName}</summary>
                                        <div className="ds-colors">
                                            {COLOR_FIELDS.filter((f) => f.group === groupName).map(renderColor)}
                                        </div>
                                    </details>
                                ))}
                            </section>

                            <section className="ds-panel__section">
                                <h4><i className="fa fa-font" aria-hidden="true"></i> Typography</h4>
                                <div className="ds-field">
                                    <label htmlFor="ds-heading-font">Heading font</label>
                                    <select
                                        id="ds-heading-font"
                                        className="ds-select"
                                        value={customization.headingFont || selectedDesign.tokens.headingFont}
                                        onChange={(event) => setCustom('headingFont', event.target.value)}
                                    >
                                        {FONT_OPTIONS.map((font) => (
                                            <option key={font.id} value={font.value}>{font.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="ds-field">
                                    <label htmlFor="ds-body-font">Body font</label>
                                    <select
                                        id="ds-body-font"
                                        className="ds-select"
                                        value={customization.bodyFont || selectedDesign.tokens.bodyFont}
                                        onChange={(event) => setCustom('bodyFont', event.target.value)}
                                    >
                                        {FONT_OPTIONS.map((font) => (
                                            <option key={font.id} value={font.value}>{font.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </section>

                            <section className="ds-panel__section">
                                <h4><i className="fa fa-cube" aria-hidden="true"></i> Shape &amp; surfaces</h4>
                                {renderRange(RANGE_FIELDS.find((field) => field.key === 'radius'))}
                                <div className="ds-field">
                                    <label htmlFor="ds-button-style">Button style</label>
                                    <select
                                        id="ds-button-style"
                                        className="ds-select"
                                        value={customization.buttonStyle || selectedDesign.tokens.buttonStyle}
                                        onChange={(event) => setCustom('buttonStyle', event.target.value)}
                                    >
                                        {BUTTON_STYLE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="ds-field">
                                    <label htmlFor="ds-card-style">Card style</label>
                                    <select
                                        id="ds-card-style"
                                        className="ds-select"
                                        value={customization.cardStyle || selectedDesign.tokens.cardStyle}
                                        onChange={(event) => setCustom('cardStyle', event.target.value)}
                                    >
                                        {CARD_STYLE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                                {renderRange(RANGE_FIELDS.find((field) => field.key === 'shadow'))}
                            </section>

                            <section className="ds-panel__section">
                                <h4><i className="fa fa-columns" aria-hidden="true"></i> Layout</h4>
                                {renderRange(RANGE_FIELDS.find((field) => field.key === 'headerHeight'))}
                                {renderRange(RANGE_FIELDS.find((field) => field.key === 'containerWidth'))}
                                {renderRange(RANGE_FIELDS.find((field) => field.key === 'sectionSpacing'))}
                                <div className="ds-field">
                                    <label htmlFor="ds-image-ratio">Product image ratio</label>
                                    <select id="ds-image-ratio" className="ds-select" value={customization.imageRatio || selectedDesign.tokens.imageRatio} onChange={(event) => setCustom('imageRatio', event.target.value)}>
                                        {IMAGE_RATIO_OPTIONS.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                                    </select>
                                </div>
                            </section>

                            <section className="ds-panel__section">
                                <h4><i className="fa fa-square-o" aria-hidden="true"></i> Box &amp; border</h4>
                                {['categoryBorderWidth','categoryRadius','categoryPadding','productCardBorderWidth','productCardRadius','productCardPadding'].map((k) => renderRange(RANGE_FIELDS.find((f) => f.key === k)))}
                                <div className="ds-field">
                                    <label htmlFor="ds-cat-border-style">Category border style</label>
                                    <select id="ds-cat-border-style" className="ds-select" value={customization.categoryBorderStyle || selectedDesign.tokens.categoryBorderStyle || 'solid'} onChange={(e) => setCustom('categoryBorderStyle', e.target.value)}>
                                        {['solid','dashed','dotted','double','none'].map((v) => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>
                                <div className="ds-field">
                                    <label htmlFor="ds-card-border-style">Product card border style</label>
                                    <select id="ds-card-border-style" className="ds-select" value={customization.productCardBorderStyle || selectedDesign.tokens.productCardBorderStyle || 'solid'} onChange={(e) => setCustom('productCardBorderStyle', e.target.value)}>
                                        {['solid','dashed','dotted','double','none'].map((v) => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>
                            </section>

                            <section className="ds-panel__section">
                                <h4><i className="fa fa-magic" aria-hidden="true"></i> Motion</h4>
                                {renderRange(RANGE_FIELDS.find((field) => field.key === 'animationSpeed'))}
                                {renderRange(RANGE_FIELDS.find((field) => field.key === 'animationIntensity'))}
                                <p style={{ margin: 0, fontSize: '0.66rem', lineHeight: 1.5, color: 'var(--ad-text-3)' }}>
                                    Animations automatically respect the visitor&apos;s
                                    <strong> prefers-reduced-motion </strong> setting.
                                </p>
                            </section>
                        </div>

                        {hasUnsavedChanges && (
                            <div style={{ padding: '8px 12px', fontSize: 12, color: '#92400e', background: '#fffbeb', borderTop: '1px solid #fde68a' }}>
                                <i className="fa fa-exclamation-triangle" aria-hidden="true"></i> Unsaved changes — Save draft or Apply to live site.
                            </div>
                        )}
                        <div className="ds-panel__actions" style={{ flexWrap: 'wrap', gap: 8 }}>
                            <button type="button" className="ds-btn ds-btn--soft" onClick={resetCustomization} disabled={!Object.keys(customization).length}>
                                <i className="fa fa-eraser" aria-hidden="true"></i> Reset fields
                            </button>
                            <button type="button" className="ds-btn ds-btn--soft" onClick={handleExport}>
                                <i className="fa fa-download" aria-hidden="true"></i> Export
                            </button>
                            <label className="ds-btn ds-btn--soft" style={{ cursor: 'pointer', margin: 0 }}>
                                <i className="fa fa-upload" aria-hidden="true"></i> Import
                                <input type="file" accept="application/json" onChange={handleImport} style={{ display: 'none' }} />
                            </label>
                            <button type="button" className="ds-btn ds-btn--accent" onClick={handleSave} disabled={busy === 'save'}>
                                <i className={`fa ${busy === 'save' ? 'fa-spinner fa-spin' : 'fa-floppy-o'}`} aria-hidden="true"></i> Save
                            </button>
                            <button type="button" className="ds-btn ds-btn--primary" onClick={() => handleApply()} disabled={busy === 'apply'}>
                                <i className={`fa ${busy === 'apply' ? 'fa-spinner fa-spin' : 'fa-check-circle'}`} aria-hidden="true"></i> Apply
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            {/* ---------------- Full-screen preview ---------------- */}
            {fullPreview && selectedDesign && (
                <div className="ds-modal" role="dialog" aria-modal="true" aria-label="Full screen design preview">
                    <div className="ds-modal__bar">
                        <div>
                            <h3>{selectedDesign.name} · Full preview</h3>
                            <p>{selectedDesign.tagline} — {selectedDesign.description}</p>
                        </div>
                        <div className="ds-stage__spacer" />
                        <div className="ds-seg">
                            {DEVICES.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={device === item.id ? 'is-active' : ''}
                                    onClick={() => setDevice(item.id)}
                                >
                                    <i className={`fa ${item.icon}`} aria-hidden="true"></i>
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="ds-btn ds-btn--primary ds-btn--sm"
                            onClick={() => handleApply()}
                            disabled={busy === 'apply'}
                        >
                            <i className="fa fa-check-circle" aria-hidden="true"></i> Apply
                        </button>
                        <button
                            type="button"
                            className="ds-btn ds-btn--ghost ds-btn--sm"
                            onClick={() => setFullPreview(false)}
                        >
                            <i className="fa fa-times" aria-hidden="true"></i> Close
                        </button>
                    </div>
                    <div
                        className="ds-modal__body"
                        style={device === 'mobile'
                            ? { display: 'flex', justifyContent: 'center', background: '#0f172a' }
                            : undefined}
                    >
                        <div style={device === 'mobile' ? { width: 390, maxWidth: '100%', background: '#fff' } : { width: '100%' }}>
                            <StorefrontPreview
                                design={selectedDesign}
                                tokens={previewTokens}
                                device={device}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
