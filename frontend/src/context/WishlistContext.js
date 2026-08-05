import { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';

const WishlistContext = createContext(null);

const STORAGE_KEY = 'vijaycart_wishlist';

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const isWishlisted = useCallback((id) => items.some(i => i._id === id), [items]);

  const toggleWishlist = (product) => {
    setItems(prev => {
      const exists = prev.some(i => i._id === product._id);
      if (exists) return prev.filter(i => i._id !== product._id);
      return [{ ...product }, ...prev];
    });
  };

  const removeFromWishlist = (id) => {
    setItems(prev => prev.filter(i => i._id !== id));
  };

  const clearWishlist = () => setItems([]);

  const value = useMemo(() => ({
    items,
    count: items.length,
    isWishlisted,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist
  }), [items, isWishlisted]);

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