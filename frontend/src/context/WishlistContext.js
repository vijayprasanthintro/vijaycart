import { createContext, useContext, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

// Wishlist lives in MongoDB (per user) and is mirrored to localStorage so the
// UI restores instantly on refresh. Adding/removing requires a logged-in user
// (the API is 401 otherwise); guests get an empty wishlist and the callers
// (product cards / product page) prompt for login instead.
const WishlistContext = createContext(null);

const STORAGE_KEY = 'vijaycart_wishlist';

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useSelector((state) => state.authState);
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const prevAuth = useRef(null);

  // Load the user's wishlist whenever the auth state flips (login / logout /
  // initial refresh where the cached session is restored).
  useEffect(() => {
    if (prevAuth.current === isAuthenticated) return;
    prevAuth.current = isAuthenticated;

    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get('/api/v1/wishlist');
        if (cancelled) return;
        const list = Array.isArray(data.wishlist) ? data.wishlist : [];
        setItems(list);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
      } catch {
        /* transient error — keep whatever is already in state */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const isWishlisted = useCallback((id) => items.some(i => i._id === id), [items]);

  // Optimistic add/remove against the API. Returns { ok, added } so callers can
  // toast the right message; reverts the local state if the request fails.
  const toggleWishlist = useCallback(async (product) => {
    if (!product || !product._id) return { ok: false, added: false };
    const exists = items.some(i => i._id === product._id);

    if (exists) {
      setItems(prev => prev.filter(i => i._id !== product._id));
    } else {
      setItems(prev => [{ ...product }, ...prev]);
    }

    try {
      if (exists) {
        await axios.delete(`/api/v1/wishlist/${product._id}`);
      } else {
        await axios.put(`/api/v1/wishlist/${product._id}`);
      }
      return { ok: true, added: !exists };
    } catch (error) {
      setItems(prev => exists ? [{ ...product }, ...prev] : prev.filter(i => i._id !== product._id));
      return { ok: false, added: exists };
    }
  }, [items]);

  const removeFromWishlist = useCallback(async (id) => {
    setItems(prev => prev.filter(i => i._id !== id));
    try {
      await axios.delete(`/api/v1/wishlist/${id}`);
    } catch { /* ignore */ }
  }, []);

  const clearWishlist = useCallback(async () => {
    setItems([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    try {
      await axios.delete('/api/v1/wishlist');
    } catch { /* ignore */ }
  }, []);

  const value = useMemo(() => ({
    items,
    count: items.length,
    loading,
    isWishlisted,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist
  }), [items, loading, isWishlisted, toggleWishlist, removeFromWishlist, clearWishlist]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return ctx;
}
