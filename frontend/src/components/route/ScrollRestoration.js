import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Route-level scroll management (mounted once inside the Router).
//
//  - PUSH / REPLACE (Link, navigate, form submits): the new page always
//    starts at scrollTop = 0, exactly like a professional marketplace —
//    Quick View -> View Details, category chips, search results, cart ->
//    checkout, every route transition.
//  - POP (browser back/forward): restores the position the user was at,
//    which is the expected behaviour for history traversal.
//
// Only the main window/document scroll is touched. Internal scrollable
// containers (modals, product galleries, horizontal category carousels,
// dropdowns, checkout forms) keep their own scrolling untouched because the
// component never targets them.

let historyPatched = false;
const patchHistoryScrollRestoration = () => {
    if (historyPatched || typeof window === 'undefined') return;
    try {
        // Native restoration would fight the SPA's own restore on reload.
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
    } catch {
        /* some browsers disallow this in certain modes — ignore */
    }
    historyPatched = true;
};

export default function ScrollRestoration() {
    const location = useLocation();
    const navigationType = useNavigationType(); // 'PUSH' | 'REPLACE' | 'POP'
    const positions = useRef(new Map());

    patchHistoryScrollRestoration();

    // Remember how far down the page the user has scrolled for the current
    // history entry, so back/forward can return them to the same spot.
    useEffect(() => {
        let ticking = false;
        const save = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                positions.current.set(location.key, window.scrollY);
                ticking = false;
            });
        };
        window.addEventListener('scroll', save, { passive: true });
        return () => window.removeEventListener('scroll', save);
    }, [location.key]);

    // Apply scroll state whenever the route changes.
    useEffect(() => {
        if (navigationType === 'POP') {
            const savedY = positions.current.get(location.key);
            window.scrollTo({
                top: typeof savedY === 'number' ? savedY : 0,
                left: 0,
                behavior: 'auto'
            });
        } else {
            // New navigation: always open at the very top, instantly (no
            // visible smooth scroll through the old content).
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }
    }, [location.pathname, location.search, location.key, navigationType]);

    return null;
}
