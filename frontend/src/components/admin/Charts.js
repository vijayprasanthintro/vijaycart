// Lightweight dependency-free charts used by the admin dashboard.
// All charts are resolution-independent SVGs with CSS-driven animation.

import { useState, useId } from 'react';

export function BarChart({ data = [], alt = false, height = 220 }) {
    const max = Math.max(1, ...data.map(d => Number(d.value) || 0));
    return (
        <div className="ad-bars" style={{ height }}>
            {data.map((d, i) => {
                const h = Math.round((Number(d.value) / max) * 100);
                return (
                    <div className="ad-bar-col" key={i} title={d.label}>
                        <span className="ad-bar__val">{Number(d.value).toLocaleString('en-IN')}</span>
                        <div
                            className={`ad-bar ${alt ? 'ad-bar--alt' : ''}`}
                            style={{ height: `${Math.max(h, 2)}%`, animationDelay: `${i * 0.045}s` }}
                        ></div>
                        <span className="ad-bar__label">{d.label}</span>
                    </div>
                );
            })}
        </div>
    );
}

const SEGMENT_COLORS = ['#fb641b', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#94a1b8'];

export function DonutChart({ segments = [], centerLabel = '', centerValue = '' }) {
    const total = segments.reduce((s, seg) => s + (Number(seg.value) || 0), 0);
    const R = 80;
    const C = 2 * Math.PI * R;
    let acc = 0;

    return (
        <div className="ad-donut">
            <div className="ad-donut__chart">
                <svg viewBox="0 0 200 200" width="176" height="176" style={{ display: 'block' }}>
                    <circle cx="100" cy="100" r={R} fill="none" stroke="var(--ad-surface-2)" strokeWidth="22" />
                    {total > 0 && segments.map((seg, i) => {
                        const len = (Number(seg.value) || 0) / total * C;
                        const el = (
                            <circle
                                key={i}
                                cx="100"
                                cy="100"
                                r={R}
                                fill="none"
                                stroke={seg.color || SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                                strokeWidth="22"
                                strokeLinecap="butt"
                                strokeDasharray={`${Math.max(len, 0.5)} ${C - Math.max(len, 0.5)}`}
                                strokeDashoffset={-acc}
                                transform="rotate(-90 100 100)"
                                style={{ transition: 'stroke-width 0.2s', cursor: 'pointer' }}
                                onMouseEnter={e => { e.currentTarget.style.strokeWidth = '26'; }}
                                onMouseLeave={e => { e.currentTarget.style.strokeWidth = '22'; }}
                            />
                        );
                        acc += len;
                        return el;
                    })}
                </svg>
                <div className="ad-donut__center">
                    <b>{centerValue || total}</b>
                    <span>{centerLabel}</span>
                </div>
            </div>
            <div className="ad-legend">
                {segments.map((seg, i) => {
                    const v = Number(seg.value) || 0;
                    const pct = total > 0 ? ((v / total) * 100).toFixed(1) : '0';
                    return (
                        <div className="ad-legend__row" key={i}>
                            <span className="ad-legend__dot" style={{ background: seg.color || SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}></span>
                            <span>{seg.label}</span>
                            <span className="ad-legend__pct">{pct}%</span>
                            <span className="ad-legend__val">{v.toLocaleString('en-IN')}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Builds a smooth path through points using Catmull-Rom → cubic Bézier.
const smoothPath = (pts) => {
    if (pts.length < 2) return '';
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
};

export function AreaChart({ data = [], color = 'var(--ad-primary)', height = 220, format = v => Number(v).toLocaleString('en-IN') }) {
    const [hover, setHover] = useState(null);
    const gid = useId();

    const values = data.map(d => Number(d.value) || 0);
    if (data.length === 0) return <div className="ad-empty ad-empty--small"><i className="fa fa-chart-line" aria-hidden="true"></i><p>No data yet.</p></div>;

    const max = Math.max(1, ...values);
    const W = 640;
    const H = 220;
    const PAD_X = 8;
    const PAD_Y = 18;
    const innerW = W - PAD_X * 2;
    const innerH = H - PAD_Y * 2;
    const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;
    const x = i => PAD_X + i * stepX;
    const y = v => PAD_Y + (1 - v / max) * innerH;

    const pts = values.map((v, i) => ({ x: x(i), y: y(v) }));
    const line = smoothPath(pts);
    const area = `${line} L${x(data.length - 1).toFixed(1)},${H - 4} L${x(0).toFixed(1)},${H - 4} Z`;

    const last = values[values.length - 1] || 0;
    const delta = data.length > 1 ? last - values[0] : 0;
    const pct = data.length > 1 && values[0] > 0 ? ((delta / values[0]) * 100).toFixed(1) : null;

    const onMove = e => {
        const rect = e.currentTarget.getBoundingClientRect();
        const frac = (e.clientX - rect.left) / rect.width;
        const idx = Math.max(0, Math.min(data.length - 1, Math.round(frac * (data.length - 1))));
        setHover(idx);
    };

    const hoverX = hover !== null ? (x(hover) / W) * 100 : 0;

    return (
        <div className="ad-area" style={{ position: 'relative' }}>
            <div className="ad-area__head">
                <div className="ad-area__value">{format(last)}</div>
                <span className={`ad-area__delta ${delta >= 0 ? 'ad-area__delta--up' : 'ad-area__delta--down'}`}>
                    <i className={`fa ${delta >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`} aria-hidden="true"></i>
                    {pct !== null ? `${pct}%` : '—'}
                </span>
            </div>
            <svg
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                className="ad-area__svg"
                style={{ height, touchAction: 'pan-y' }}
                onMouseMove={onMove}
                onMouseLeave={() => setHover(null)}
            >
                <defs>
                    <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                <line x1={PAD_X} y1={y(max)} x2={W - PAD_X} y2={y(max)} stroke="var(--ad-border)" strokeWidth="1" strokeDasharray="4 6" />
                <line x1={PAD_X} y1={y(max / 2)} x2={W - PAD_X} y2={y(max / 2)} stroke="var(--ad-border)" strokeWidth="1" strokeDasharray="4 6" />
                <line x1={PAD_X} y1={H - 4} x2={W - PAD_X} y2={H - 4} stroke="var(--ad-border)" strokeWidth="1" />
                <path d={area} fill={`url(#${gid})`} />
                <path
                    d={line}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    style={{ strokeDasharray: 1400, strokeDashoffset: 1400, animation: 'adDrawLine 1.2s cubic-bezier(0.22,1,0.36,1) 0.15s forwards' }}
                />
                {hover !== null && (
                    <line x1={x(hover)} y1={PAD_Y} x2={x(hover)} y2={H - 4} stroke="var(--ad-text-3)" strokeWidth="1" strokeDasharray="3 4" />
                )}
                {hover !== null && (
                    <circle cx={x(hover)} cy={y(values[hover])} r="5" fill={color} stroke="var(--ad-surface)" strokeWidth="2.5" />
                )}
                {data.length > 0 && hover === null && (
                    <circle cx={x(data.length - 1)} cy={y(last)} r="4.5" fill={color} stroke="var(--ad-surface)" strokeWidth="2" />
                )}
            </svg>
            {hover !== null && (
                <div className="ad-area-tip" style={{ left: `${hoverX}%` }}>
                    {format(values[hover])} · {data[hover].label}
                </div>
            )}
            <div className="ad-area__labels">
                {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0).map((d, i) => (
                    <span key={i}>{d.label}</span>
                ))}
                {data.length > 0 && <span>{data[data.length - 1].label}</span>}
            </div>
        </div>
    );
}

// Tiny inline sparkline for KPI cards.
export function Sparkline({ data = [], color = 'var(--ad-primary)', width = 112, height = 38 }) {
    const gid = useId();
    const values = data.map(Number).filter(Number.isFinite);
    if (values.length < 2) return <span className="ad-spark" style={{ width, height }}></span>;
    const max = Math.max(1, ...values);
    const min = Math.min(...values);
    const span = max - min || 1;
    const W = width;
    const H = height;
    const stepX = W / (values.length - 1);
    const y = v => H - 3 - ((v - min) / span) * (H - 6);
    const pts = values.map((v, i) => `${(i * stepX).toFixed(1)},${y(v).toFixed(1)}`);
    const area = `M0,${H} L${pts.join(' L')} L${W},${H} Z`;
    return (
        <svg className="ad-spark" width={width} height={height} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gid})`} />
            <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={W} cy={y(values[values.length - 1])} r="2.6" fill={color} />
        </svg>
    );
}

export function toINR(value) {
    return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}
