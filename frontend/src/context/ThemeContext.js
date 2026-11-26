import { createContext, useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
    DEFAULT_DESIGN_ID,
    DEFAULT_TOKENS,
    DESIGN_CACHE_KEY,
    applyDesignToElement,
    cacheDesign,
    readCachedDesign,
    setThemePending
} from '../designs/designUtils';

const ThemeContext = createContext({
    designId: DEFAULT_DESIGN_ID,
    tokens: DEFAULT_TOKENS,
    activeDesign: null
});

const EMPTY_DESIGN = {};

const REVEAL_SELECTOR = [
    '.hero-section',
    '.quick-access',
    '.section',
    '.promo-banner',
    '.personalized-section',
    '.flash-deals-wrap'
].join(', ');

/**
 * Applies the active storefront design globally.
 *
 * The live design comes from /settings (persisted in MongoDB). Until that
 * request resolves, index.js has already painted the cached design, so there
 * is no flash of the default palette. All visual values are CSS custom
 * properties on <html>, which keeps them out of React's render path and lets
 * every existing component inherit the design without being rewritten.
 */
export function ThemeProvider({ children }) {
    const settings = useSelector((state) => state.settingState.settings) || {};
    const design = settings.design || EMPTY_DESIGN;
    const cachedDesign = useMemo(() => readCachedDesign(), []);
    const hasLiveDesign = !!(design.designId && design.tokens);
    const designId = design.designId || cachedDesign?.designId || DEFAULT_DESIGN_ID;
    const tokens = design.tokens || cachedDesign?.tokens || DEFAULT_TOKENS;
    const tokenKey = JSON.stringify(tokens);
    const location = useLocation();

    useEffect(() => {
        // Never overwrite a valid cached design (or paint the eMox fallback)
        // while /settings is still in flight. The cached paint from index.js
        // stays on screen until the real persisted design arrives.
        if (!hasLiveDesign) return undefined;
        applyDesignToElement(document.documentElement, designId, tokens);
        cacheDesign(designId, tokens);
        setThemePending(false);
        return undefined;
    }, [hasLiveDesign, designId, tokens, tokenKey]);

    // Safety valve: if /settings never resolves we must not leave the neutral
    // first-paint cover up forever.
    useEffect(() => {
        const timer = window.setTimeout(() => setThemePending(false), 6000);
        return () => window.clearTimeout(timer);
    }, []);

    // When the admin saves/applies in another tab, settingActions writes the
    // fresh design to the shared cache. Apply it immediately here instead of
    // waiting for a manual reload.
    useEffect(() => {
        const onStorage = (event) => {
            if (event.key !== DESIGN_CACHE_KEY) return;
            const cached = readCachedDesign();
            if (!cached) return;
            applyDesignToElement(document.documentElement, cached.designId, cached.tokens);
            setThemePending(false);
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // Lightweight, dependency-free scroll reveal. Elements are only marked as
    // "revealable" when JavaScript is running, so a JS failure can never leave
    // the storefront invisible. Reduced-motion users are skipped entirely.
    useEffect(() => {
        if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/delivery')) {
            return undefined;
        }
        if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
            return undefined;
        }
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return undefined;
        }

        let observer = null;
        const timer = window.setTimeout(() => {
            const elements = Array.from(document.querySelectorAll(REVEAL_SELECTOR))
                .filter((el) => !el.closest('.ds-preview-page'));

            observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('vc-reveal-in');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

            elements.forEach((el) => {
                if (!el.classList.contains('vc-reveal')) el.classList.add('vc-reveal');
                observer.observe(el);
            });
        }, 80);

        return () => {
            window.clearTimeout(timer);
            if (observer) observer.disconnect();
        };
    }, [location.pathname, tokenKey]);

    const value = useMemo(() => ({
        designId,
        tokens,
        activeDesign: design
    }), [designId, tokens, design]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useDesign() {
    return useContext(ThemeContext);
}

export default ThemeProvider;
