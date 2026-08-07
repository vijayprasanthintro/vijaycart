import { useMemo } from 'react';

export default function AdminPagination({ count = 0, perPage = 10, page = 1, onChange }) {
    const totalPages = Math.max(1, Math.ceil(count / perPage));

    const pages = useMemo(() => {
        const list = [];
        const push = (p) => { if (!list.includes(p)) list.push(p); };
        push(1);
        for (let p = page - 2; p <= page + 2; p++) {
            if (p > 1 && p < totalPages) push(p);
        }
        push(totalPages);
        const out = [];
        let prev = 0;
        list.forEach(p => {
            if (p - prev > 1) out.push('…');
            out.push(p);
            prev = p;
        });
        return out;
    }, [page, totalPages]);

    if (totalPages <= 1) return null;

    const go = p => {
        if (p < 1 || p > totalPages || p === page) return;
        onChange(p);
        document.querySelector('.ad-main')?.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const from = count === 0 ? 0 : (page - 1) * perPage + 1;
    const to = Math.min(page * perPage, count);

    return (
        <div className="ad-pagination">
            <span className="ad-pagination__info">Showing <b>{from}–{to}</b> of <b>{count}</b></span>
            <div className="ad-pagination__controls">
                <button type="button" className="ad-pagination__btn" onClick={() => go(page - 1)} disabled={page <= 1}>
                    <i className="fa fa-chevron-left" aria-hidden="true"></i>
                </button>
                {pages.map((p, i) =>
                    p === '…' ? (
                        <span className="ad-pagination__ellipsis" key={`e${i}`}>…</span>
                    ) : (
                        <button
                            type="button"
                            key={p}
                            className={`ad-pagination__btn ${p === page ? 'ad-pagination__btn--active' : ''}`}
                            onClick={() => go(p)}
                        >
                            {p}
                        </button>
                    )
                )}
                <button type="button" className="ad-pagination__btn" onClick={() => go(page + 1)} disabled={page >= totalPages}>
                    <i className="fa fa-chevron-right" aria-hidden="true"></i>
                </button>
            </div>
        </div>
    );
}
