// Lightweight dependency-free charts used by the admin dashboard.

export function BarChart({ data = [], alt = false, height = 210 }) {
    const max = Math.max(1, ...data.map(d => Number(d.value) || 0));
    return (
        <div className="ad-bars" style={{ height }}>
            {data.map((d, i) => {
                const h = Math.round((Number(d.value) / max) * 100);
                return (
                    <div className="ad-bar-col" key={i} title={d.label}>
                        <span className="ad-bar__val">{Number(d.value).toLocaleString('en-IN')}</span>
                        <div className={`ad-bar ${alt ? 'ad-bar--alt' : ''}`} style={{ height: `${Math.max(h, 2)}%` }}></div>
                        <span className="ad-bar__label">{d.label}</span>
                    </div>
                );
            })}
        </div>
    );
}

export function DonutChart({ segments = [], centerLabel = '', centerValue = '' }) {
    const total = segments.reduce((s, seg) => s + (Number(seg.value) || 0), 0);
    const safeTotal = total > 0 ? total : 1;
    let acc = 0;
    const stops = segments.map(seg => {
        const from = (acc / safeTotal) * 360;
        acc += Number(seg.value) || 0;
        const to = (acc / safeTotal) * 360;
        return `${seg.color} ${from}deg ${to}deg`;
    });
    const background = total > 0 ? `conic-gradient(${stops.join(', ')})` : 'var(--ad-border)';

    return (
        <div className="ad-donut">
            <div className="ad-donut__chart" style={{ background, borderRadius: '50%' }}>
                <div className="ad-donut__center" style={{ width: '70%', height: '70%', margin: 'auto', background: 'var(--ad-surface)', borderRadius: '50%', top: '15%', left: '15%' }}>
                    <b>{centerValue || total}</b>
                    <span>{centerLabel}</span>
                </div>
            </div>
            <div className="ad-legend">
                {segments.map((seg, i) => (
                    <div className="ad-legend__row" key={i}>
                        <span className="ad-legend__dot" style={{ background: seg.color }}></span>
                        <span>{seg.label}</span>
                        <span className="ad-legend__val">{Number(seg.value).toLocaleString('en-IN')}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function toINR(value) {
    return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}
