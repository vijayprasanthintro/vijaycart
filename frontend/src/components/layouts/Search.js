import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const RECENT_KEY = 'vijaycart_recent_searches';

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();
  const [keyword, setKeyword] = useState('');
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      setRecent(raw ? JSON.parse(raw).slice(0, 6) : []);
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    if (location.pathname === '/') {
      setKeyword('');
    }
  }, [location]);

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('touchstart', onClick);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('touchstart', onClick);
    };
  }, []);

  useEffect(() => {
    if (!focused) return;
    if (!keyword.trim()) {
      setSuggestions([]);
      return;
    }
    let mounted = true;
    const t = setTimeout(() => {
      axios
        .get('/api/v1/products?page=1&limit=6', { params: { keyword: keyword.trim() } })
        .then((res) => {
          if (mounted) setSuggestions((res?.data?.products || []).slice(0, 6));
        })
        .catch(() => {
          if (mounted) setSuggestions([]);
        });
    }, 280);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [keyword, focused]);

  const saveRecent = (term) => {
    if (!term.trim()) return;
    const next = [term.trim(), ...recent.filter((r) => r.toLowerCase() !== term.trim().toLowerCase())].slice(0, 6);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const goSearch = (term) => {
    const t = term || keyword;
    setOpen(false);
    setFocused(false);
    if (t.trim()) {
      saveRecent(t);
      navigate(`/search/${t.trim()}`);
    }
  };

  const searchHandler = (e) => {
    e.preventDefault();
    goSearch(keyword);
  };

  const panelVisible = focused && open;

  return (
    <div className="vc-search-box" ref={wrapRef}>
      <form onSubmit={searchHandler} className="vc-search-form">
        <button type="submit" className="vc-search-lead" aria-label="Search">
          <i className="fa fa-search" aria-hidden="true"></i>
        </button>
        <input
          type="text"
          className="vc-search-input"
          placeholder="Search for products, brands and more"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => setFocused(false)}
          autoComplete="off"
        />
        <span className="vc-search-right">
          <button
            type="button"
            className="vc-search-action"
            aria-label="Clear search"
            onClick={() => {
              setKeyword('');
              setSuggestions([]);
            }}
            style={{ display: keyword ? 'inline-flex' : 'none' }}
          >
            <i className="fa fa-times-circle" aria-hidden="true"></i>
          </button>
          <button type="button" className="vc-search-action" aria-label="Search by image">
            <i className="fa fa-camera" aria-hidden="true"></i>
          </button>
          <button type="button" className="vc-search-action" aria-label="Voice search">
            <i className="fa fa-microphone" aria-hidden="true"></i>
          </button>
          <span className="vc-search-divider d-none d-sm-block"></span>
          <button type="submit" className="vc-search-submit d-none d-sm-inline-flex">
            <i className="fa fa-search" aria-hidden="true"></i>
          </button>
        </span>
      </form>

      {panelVisible && (
        <div className="search-panel">
          {keyword.trim() && suggestions.length > 0 && (
            <>
              <div className="search-panel-head">
                Product Suggestions <i className="fa fa-arrow-right" aria-hidden="true"></i>
              </div>
              {suggestions.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  className="search-panel-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => navigate(`/product/${p._id}`)}
                >
                  <i className="fa fa-arrow-up-right-from-square" aria-hidden="true"></i>
                  <span className="sp-label">{p.name}</span>
                  <span className="sp-type">Product</span>
                </button>
              ))}
              <button
                type="button"
                className="search-panel-item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goSearch(keyword)}
              >
                <i className="fa fa-search" aria-hidden="true"></i>
                <span className="sp-label">See all results for "{keyword}"</span>
              </button>
            </>
          )}

          {!keyword.trim() && recent.length > 0 && (
            <>
              <div className="search-panel-head">
                Recent Searches
                <button
                  type="button"
                  className="vc-search-action"
                  aria-label="Clear recent searches"
                  onClick={() => {
                    try {
                      localStorage.removeItem(RECENT_KEY);
                      setRecent([]);
                    } catch {
                      /* ignore */
                    }
                  }}
                >
                  <i className="fa fa-trash-o" aria-hidden="true"></i>
                </button>
              </div>
              {recent.map((r) => (
                <button
                  key={r}
                  type="button"
                  className="search-panel-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goSearch(r)}
                >
                  <i className="fa fa-clock-o" aria-hidden="true"></i>
                  <span className="sp-label">{r}</span>
                </button>
              ))}
            </>
          )}

          {!keyword.trim() && recent.length === 0 && (
            <div className="search-panel-empty">
              <i className="fa fa-search mb-2" aria-hidden="true"></i>
              <br />
              Search for products, brands and more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
