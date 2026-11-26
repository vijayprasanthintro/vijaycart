import { useEffect, useState } from 'react';

/**
 * Lightweight back-to-top control. It only listens to scroll (passive) and
 * flips a class, so it never re-renders the storefront while the user scrolls.
 */
export default function BackToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let last = false;
        const onScroll = () => {
            const next = window.scrollY > 560;
            if (next !== last) {
                last = next;
                setVisible(next);
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const toTop = () => {
        const reduced = window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    };

    return (
        <button
            type="button"
            className={`vc-back-top${visible ? ' is-visible' : ''}`}
            onClick={toTop}
            aria-label="Back to top"
            tabIndex={visible ? 0 : -1}
        >
            <i className="fa fa-angle-up" aria-hidden="true"></i>
        </button>
    );
}
