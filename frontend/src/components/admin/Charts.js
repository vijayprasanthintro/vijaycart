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
                            <span className="ad-legend__label">{seg.label}</span>
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

export function AreaChart({ data = [], color = 'var(--ad-primary)', height = 220, format = v => Number(v).toLocaleString('en-IN'), travel = false }) {
    const [hover, setHover] = useState(null);
    const gid = useId();
    const lineId = `${gid}-line`;

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
                    <radialGradient id={`${gid}-rk-glow`}>
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id={`${gid}-rk-body`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="35%" stopColor="#e0e7ff" />
                        <stop offset="75%" stopColor="#a5b4fc" />
                        <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                    <linearGradient id={`${gid}-rk-nose`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                    <linearGradient id={`${gid}-rk-fin`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#67e8f9" />
                        <stop offset="100%" stopColor="#0d9488" />
                    </linearGradient>
                    <linearGradient id={`${gid}-rk-win`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#e0f2fe" />
                        <stop offset="100%" stopColor="#0284c7" />
                    </linearGradient>
                    <linearGradient id={`${gid}-rk-hi`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {[0, 0.25, 0.5, 0.75, 1].map(f => (
                    <line key={f} x1={PAD_X} y1={PAD_Y + (1 - f) * innerH} x2={W - PAD_X} y2={PAD_Y + (1 - f) * innerH} stroke="var(--ad-border)" strokeWidth="1" strokeDasharray="4 6" />
                ))}
                <line x1={PAD_X} y1={H - 4} x2={W - PAD_X} y2={H - 4} stroke="var(--ad-border)" strokeWidth="1" />
                <path d={area} fill={`url(#${gid})`} />
                <path
                    id={lineId}
                    d={line}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    style={{ strokeDasharray: 1400, strokeDashoffset: 1400, animation: 'adDrawLine 1.2s cubic-bezier(0.22,1,0.36,1) 0.15s forwards' }}
                />
                {travel && (
                    <g>
                        <animateMotion
                            dur="9s"
                            repeatCount="indefinite"
                            rotate="auto"
                            calcMode="linear"
                            media="(prefers-reduced-motion: no-preference)"
                        >
                            <mpath href={`#${lineId}`} xlinkHref={`#${lineId}`} />
                        </animateMotion>
                        <g className="ad-travel-rocket" transform="translate(-9.6, -1.5)">
                            <circle className="ad-travel-rocket__glow" cx="-17" cy="0" r="10" fill={`url(#${gid}-rk-glow)`} />
                            <line x1="-18" y1="-2.8" x2="-24.5" y2="-4" stroke="#67e8f9" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
                            <line x1="-16.5" y1="2.4" x2="-22" y2="3.6" stroke="#a5b4fc" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
                            <line x1="-18.5" y1="0" x2="-23.5" y2="0" stroke="#c4b5fd" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
                            <g className="ad-travel-rocket__flame">
                                <path d="M-14.6 -5 Q-23.5 0 -14.6 5 Z" fill="#fb641b" opacity="0.85" />
                                <path d="M-14.6 -3.4 Q-20.5 0 -14.6 3.4 Z" fill="#ff8a3d" />
                                <path d="M-14.6 -2.1 Q-17.8 0 -14.6 2.1 Z" fill="#ffd166" />
                                <path d="M-14.6 -1 Q-16.2 0 -14.6 1 Z" fill="#fff8e6" />
                            </g>
                            <path d="M-11.5 -4.9 L-4.6 -11.4 L-1.7 -4.9 Z" fill={`url(#${gid}-rk-fin)`} />
                            <path d="M-11.5 4.9 L-4.6 11.4 L-1.7 4.9 Z" fill={`url(#${gid}-rk-fin)`} />
                            <path d="M-4.6 -11.4 L-2.9 -7.4 L-1.7 -4.9 L-3.4 -5.1 Z" fill="#a7f3d0" opacity="0.65" />
                            <path d="M-4.6 11.4 L-2.9 7.4 L-1.7 4.9 L-3.4 5.1 Z" fill="#a7f3d0" opacity="0.65" />
                            <path d="M-15.2 -3.4 L-12.6 -2.8 L-12.6 2.8 L-15.2 3.4 Q-16.6 0 -15.2 -3.4 Z" fill={`url(#${gid}-rk-nose)`} />
                            <path d="M-13 -5 Q-9.4 -8.4 1.4 -8.8 Q7.6 -8.2 9.4 -2.8 Q10 -1.2 10 0 Q10 1.2 9.4 2.8 Q7.6 8.2 1.4 8.8 Q-9.4 8.4 -13 5 Q-14.9 2.4 -14.9 0 Q-14.9 -2.4 -13 -5 Z" fill={`url(#${gid}-rk-body)`} />
                            <path d="M-12 -3.4 Q-8.4 -6.2 -0.2 -7.6 Q4.4 -7.4 8.4 -4 Q8.8 -4.4 8.8 -4.9 Q4 -7.9 -0.6 -8 Q-8.6 -6.6 -12 -3.9 Z" fill={`url(#${gid}-rk-hi)`} opacity="0.8" />
                            <ellipse cx="3.4" cy="0" rx="1.9" ry="7.4" fill={`url(#${gid}-rk-nose)`} opacity="0.85" />
                            <path d="M-11.8 -3.4 Q-8.6 -6 -0.4 -7.4 Q5 -7.2 8.3 -3.6" fill="none" stroke={`url(#${gid}-rk-hi)`} strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
                            <circle cx="0.6" cy="0" r="2.3" fill="#0f172a" />
                            <circle cx="0.6" cy="0" r="1.6" fill={`url(#${gid}-rk-win)`} />
                            <circle cx="1.1" cy="-0.6" r="0.55" fill="#ffffff" opacity="0.9" />
                            <circle cx="-5.2" cy="0" r="1.8" fill="#0f172a" />
                            <circle cx="-5.2" cy="0" r="1.25" fill={`url(#${gid}-rk-win)`} />
                            <circle cx="-4.8" cy="-0.5" r="0.45" fill="#ffffff" opacity="0.9" />
                            {[-10.5, -7.5, -4.5, -1.5].map(rx => (
                                <circle key={rx} cx={rx} cy="-7.5" r="0.4" fill="#94a3b8" opacity="0.85" />
                            ))}
                            {[-10.5, -7.5, -4.5, -1.5].map(rx => (
                                <circle key={rx} cx={rx} cy="7.5" r="0.4" fill="#94a3b8" opacity="0.85" />
                            ))}
                        </g>
                    </g>
                )}
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

export function toINR(value, decimals = 0) {
    const n = Number(value || 0);
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

// Segmented time-range switch (7D / 14D / 30D / 3M / 6M / 1Y).
export function RangeTabs({ value, onChange, options }) {
    const opts = options || [
        { key: '7', label: '7D' },
        { key: '14', label: '14D' },
        { key: '30', label: '30D' },
        { key: '90', label: '3M' },
        { key: '180', label: '6M' },
        { key: '365', label: '1Y' }
    ];
    return (
        <div className="ad-seg ad-range" role="tablist" aria-label="Time range">
            {opts.map(o => (
                <button
                    key={o.key}
                    type="button"
                    role="tab"
                    aria-selected={value === o.key}
                    className={`ad-seg__btn ${value === o.key ? 'ad-seg__btn--active' : ''}`}
                    onClick={() => onChange(o.key)}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}
