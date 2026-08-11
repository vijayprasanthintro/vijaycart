import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';
import { formatMoney, productImage } from '../../utils/productHelper';
import OptimizedImage from '../common/OptimizedImage';
import useDebounce from '../../hooks/useDebounce';

const RECENT_KEY = 'vijaycart_recent_searches';
const MAX_RECENT = 6;

const TRENDING = [
  'Smart Watch', 'Apple Watch', 'Headphones', 'Laptops',
  'iPhone', 'Sneakers', 'Backpack', 'Coffee Maker',
];

const MOBILE_CATEGORIES = [
  { label: 'Mobiles', to: '/search/all?category=Smartphones', icon: 'fa-mobile' },
  { label: 'Electronics', to: '/search/all?category=Electronics', icon: 'fa-plug' },
  { label: 'Accessories', to: '/search/all?category=Accessories', icon: 'fa-clock-o' },
  { label: 'Laptops', to: '/search/all?category=Laptops', icon: 'fa-laptop' },
  { label: 'Headphones', to: '/search/all?category=Headphones', icon: 'fa-headphones' },
  { label: 'Beauty', to: '/search/all?category=Beauty%2FHealth', icon: 'fa-heartbeat' },
];

const CATEGORY_ICONS = {
  'Smartphones': 'fa-mobile',
  'Electronics': 'fa-plug',
  'Laptops': 'fa-laptop',
  'Tablets': 'fa-tablet',
  'Headphones': 'fa-headphones',
  'Audio': 'fa-music',
  'Cameras': 'fa-camera',
  'Monitors': 'fa-desktop',
  'Televisions': 'fa-television',
  'Gaming': 'fa-gamepad',
  'Drones': 'fa-paper-plane',
  'Wearables': 'fa-clock-o',
  'Components': 'fa-cogs',
  'Accessories': 'fa-clock-o',
  'Clothes/Shoes': 'fa-tshirt',
  'Home': 'fa-home',
  'Food': 'fa-cutlery',
  'Sports': 'fa-futbol-o',
  'Outdoor': 'fa-bicycle',
  'Books': 'fa-book',
  'Beauty/Health': 'fa-heartbeat',
};

// The catalogue is small and shared by every suggestion computation, so cache
// the single list request for the lifetime of the tab.
let cataloguePromise = null;
const getCatalogue = () => {
  if (!cataloguePromise) {
    cataloguePromise = axios
      .get('/api/v1/products?limit=200')
      .then((res) => res?.data?.products || [])
      .catch(() => {
        cataloguePromise = null;
        return [];
      });
  }
  return cataloguePromise;
};

// Wrap the part of `text` that matches `query` in <mark>.
function Highlight({ text, query }) {
  const q = (query || '').trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="ss-mark">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function computeSuggestions(products, rawQuery) {
  const q = rawQuery.trim().toLowerCase();
  const hit = (v) => (v || '').toLowerCase().includes(q);

  const nameHits = products.filter((p) => hit(p.name));
  nameHits.sort((a, b) => {
    const aPref = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bPref = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    if (aPref !== bPref) return aPref - bPref;
    return (b.numOfReviews || 0) - (a.numOfReviews || 0);
  });

  const catCount = {};
  const selCount = {};
  products.forEach((p) => {
    if (hit(p.category)) catCount[p.category] = (catCount[p.category] || 0) + 1;
    if (hit(p.seller)) selCount[p.seller] = (selCount[p.seller] || 0) + 1;
  });

  return {
    products: nameHits.slice(0, 6),
    categories: Object.entries(catCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count })),
    sellers: Object.entries(selCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count })),
  };
}

function CameraSearchModal({ show, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [captured, setCaptured] = useState(null);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setCaptured(null);
    setStarting(true);
    try {
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        throw new Error('unsupported');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      let msg = 'Camera unavailable. Please allow camera access in your browser.';
      if (err && err.name === 'NotAllowedError') {
        msg = 'Camera permission denied. Allow camera access and try again.';
      } else if (err && err.message === 'unsupported') {
        msg = 'Camera is not supported in this browser.';
      }
      setError(msg);
      toast(msg, { type: 'error' });
    } finally {
      setStarting(false);
    }
  }, []);

  useEffect(() => {
    if (show) {
      startCamera();
      return () => stopStream();
    }
    return undefined;
  }, [show, startCamera, stopStream]);

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    setCaptured(canvas.toDataURL('image/jpeg', 0.85));
  };

  return (
    <Modal show={show} onHide={() => { stopStream(); onClose(); }} centered className="ss-cam-modal">
      <Modal.Header closeButton>
        <Modal.Title><i className="fa fa-camera mr-2" aria-hidden="true"></i>Search by Camera</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error ? (
          <div className="ss-cam-error">
            <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>
            <span>{error}</span>
          </div>
        ) : (
          <div className="ss-cam-stage">
            <video ref={videoRef} className="ss-cam-video" playsInline muted />
            {starting && <div className="ss-cam-starting"><i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Starting camera…</div>}
            {captured && <img src={captured} alt="Captured" className="ss-cam-captured" />}
          </div>
        )}
        <p className="ss-cam-hint">Point the camera at a product or its barcode. Visual recognition is coming soon — for now you can capture the frame to save or share.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={() => { stopStream(); onClose(); }}>Close</Button>
        {!error && !captured && (
          <Button variant="primary" size="sm" onClick={capture} disabled={starting}>
            <i className="fa fa-camera mr-1" aria-hidden="true"></i> Capture
          </Button>
        )}
        {captured && (
          <Button variant="success" size="sm" onClick={() => { stopStream(); onClose(); }}>
            <i className="fa fa-check mr-1" aria-hidden="true"></i> Done
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

function startVoiceSearch(onTranscript, onError) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    toast('Voice search is not supported in this browser. Try Chrome or Edge.', { type: 'error' });
    return;
  }
  const rec = new SR();
  rec.lang = 'en-IN';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => {
    const text = (e.results[0][0].transcript || '').trim();
    if (text) onTranscript(text);
  };
  rec.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      toast('Microphone permission denied. Allow mic access and try again.', { type: 'error' });
    } else if (e.error === 'no-speech') {
      toast('No speech detected. Please try again.', { type: 'info' });
    } else {
      toast('Voice search failed. Please try again.', { type: 'error' });
    }
    onError && onError();
  };
  rec.onend = () => onError && onError();
  try {
    rec.start();
    toast('Listening… speak now', { type: 'info', autoClose: 2000 });
  } catch (err) {
    toast('Could not start voice search.', { type: 'error' });
    onError && onError();
  }
}

export default function SearchSuggest({ variant = 'desktop', onDone }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);
  const [suggest, setSuggest] = useState({ products: [], categories: [], sellers: [] });
  const [active, setActive] = useState(-1);
  const [camOpen, setCamOpen] = useState(false);
  const [listening, setListening] = useState(false);

  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const loadRecent = useCallback(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      setRecent(raw ? JSON.parse(raw).slice(0, MAX_RECENT) : []);
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  // Keep the box in sync with the current route (Flixkart-style persistence).
  useEffect(() => {
    const m = location.pathname.match(/^\/search\/(.+)$/);
    if (m) setKeyword(decodeURIComponent(m[1]));
    else if (location.pathname === '/') setKeyword('');
  }, [location.pathname]);

  useEffect(() => {
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('touchstart', onClick);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('touchstart', onClick);
    };
  }, []);

  // Debounced suggestion lookup (client-side against the cached catalogue).
  const debouncedKeyword = useDebounce(keyword, 250);
  useEffect(() => {
    setActive(-1);
    if (!open) return;
    if (!debouncedKeyword.trim()) {
      setSuggest({ products: [], categories: [], sellers: [] });
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    getCatalogue().then((products) => {
      if (!mounted) return;
      setSuggest(computeSuggestions(products, debouncedKeyword));
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [debouncedKeyword, open]);

  const rows = useMemo(() => {
    const list = [];
    if (keyword.trim()) {
      suggest.products.forEach((p) => list.push({ kind: 'product', ref: p }));
      suggest.categories.forEach((c) => list.push({ kind: 'category', ref: c }));
      suggest.sellers.forEach((s) => list.push({ kind: 'seller', ref: s }));
      list.push({ kind: 'query', ref: null });
    } else {
      recent.forEach((r) => list.push({ kind: 'recent', ref: r }));
    }
    return list;
  }, [keyword, suggest, recent]);

  const rowIndex = (kind, ref) => rows.findIndex((r) => {
    if (r.kind !== kind) return false;
    if (kind === 'product') return r.ref._id === ref._id;
    if (kind === 'recent') return r.ref === ref;
    if (kind === 'query') return true;
    return r.ref.name === ref.name;
  });

  const saveRecent = useCallback((term) => {
    const t = (term || '').trim();
    if (!t) return;
    setRecent((prev) => {
      const next = [t, ...prev.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const removeRecent = (term) => {
    setRecent((prev) => {
      const next = prev.filter((r) => r !== term);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const clearRecent = () => {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      /* ignore */
    }
    setRecent([]);
  };

  const closePanel = () => {
    setOpen(false);
    setActive(-1);
    inputRef.current?.blur();
  };

  const goSearch = (term) => {
    const t = (term || keyword || '').trim();
    closePanel();
    if (t) {
      saveRecent(t);
      navigate(`/search/${encodeURIComponent(t)}`);
      onDone?.();
    }
  };

  const handleVoice = () => {
    setListening(true);
    startVoiceSearch((text) => {
      setListening(false);
      setKeyword(text);
      setOpen(false);
      goSearch(text);
    }, () => setListening(false));
  };

  const selectRow = (row) => {
    if (!row) return;
    if (row.kind === 'product') {
      const term = keyword.trim();
      if (term) saveRecent(term);
      closePanel();
      navigate(`/product/${row.ref._id}`);
      onDone?.();
    } else if (row.kind === 'query') {
      goSearch(keyword);
    } else {
      // recent / category / seller all resolve to a text search
      goSearch(row.kind === 'recent' ? row.ref : row.ref.name);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    goSearch(keyword);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (rows.length) setActive((i) => (i + 1) % rows.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (rows.length) setActive((i) => (i <= 0 ? rows.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && rows[active]) selectRow(rows[active]);
      else goSearch(keyword);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      setActive(-1);
      inputRef.current?.blur();
    }
  };

  const isMobile = variant === 'mobile';

  return (
    <div className={`ss ${isMobile ? 'ss--mobile' : 'ss--desktop'}`} ref={rootRef}>
      <form
        className={isMobile ? 'vc-ms-overlay__bar ss-form' : 'vc-hd__search ss-form'}
        onSubmit={submit}
        role="search"
      >
        {isMobile && (
          <button
            type="button"
            className="vc-ms-overlay__back"
            onClick={() => { setOpen(false); setKeyword(''); onDone?.(); }}
            aria-label="Close search"
          >
            <i className="fa fa-arrow-left" aria-hidden="true"></i>
          </button>
        )}
        <input
          ref={inputRef}
          type="text"
          className={isMobile ? 'vc-ms-overlay__input' : 'vc-hd__search-input'}
          placeholder="Search for products, brands and more"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => { setOpen(false); setActive(-1); }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          autoFocus={isMobile}
          role="combobox"
          aria-expanded={open}
          aria-controls="ss-panel"
          aria-label="Search"
        />
        {keyword && (
          <button
            type="button"
            className="ss-clear"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setKeyword('')}
            aria-label="Clear search"
          >
            <i className="fa fa-times-circle" aria-hidden="true"></i>
          </button>
        )}
        <button
          type="button"
          className={`ss-aux-btn ${isMobile ? 'ss-aux-btn--mobile' : 'ss-aux-btn--desktop'} ${listening ? 'ss-aux-btn--active' : ''}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleVoice}
          aria-label="Search by voice"
          title="Search by voice"
        >
          <i className="fa fa-microphone" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          className={`ss-aux-btn ${isMobile ? 'ss-aux-btn--mobile' : 'ss-aux-btn--desktop'}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setCamOpen(true)}
          aria-label="Search by camera"
          title="Search by camera"
        >
          <i className="fa fa-camera" aria-hidden="true"></i>
        </button>
        {isMobile ? (
          <button type="submit" className="vc-ms-overlay__submit" aria-label="Search">
            <i className="fa fa-search" aria-hidden="true"></i>
          </button>
        ) : (
          <button type="submit" className="vc-hd__search-btn" aria-label="Search">
            <i className="fa fa-search" aria-hidden="true"></i>
          </button>
        )}
      </form>

      {open && (
        <div id="ss-panel" className={`ss-panel ${isMobile ? 'ss-panel--mobile' : ''}`} role="listbox">
          {keyword.trim() ? (
            <>
              {loading ? (
                <div className="ss-loading">
                  <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> Searching…
                </div>
              ) : (
                <>
                  {suggest.products.length > 0 && (
                    <>
                      <div className="ss-group-title"><i className="fa fa-briefcase" aria-hidden="true"></i> Products</div>
                      {suggest.products.map((p) => (
                        <button
                          key={p._id}
                          id={`ss-row-${rowIndex('product', p)}`}
                          type="button"
                          className={`ss-item ${active === rowIndex('product', p) ? 'ss-item--active' : ''}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectRow({ kind: 'product', ref: p })}
                        >
                          <OptimizedImage className="ss-thumb" src={productImage(p)} alt="" width={44} height={44} />
                          <span className="ss-item-main">
                            <span className="ss-item-name"><Highlight text={p.name} query={keyword} /></span>
                            <span className="ss-item-sub">{p.category}</span>
                          </span>
                          <span className="ss-item-meta">
                            <span className="ss-price">{formatMoney(p.price)}</span>
                          </span>
                        </button>
                      ))}
                    </>
                  )}

                  {suggest.categories.length > 0 && (
                    <>
                      <div className="ss-group-title"><i className="fa fa-tags" aria-hidden="true"></i> Categories</div>
                      {suggest.categories.map((c) => (
                        <button
                          key={c.name}
                          id={`ss-row-${rowIndex('category', c)}`}
                          type="button"
                          className={`ss-item ${active === rowIndex('category', c) ? 'ss-item--active' : ''}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectRow({ kind: 'category', ref: c })}
                        >
                          <span className="ss-ico"><i className={`fa ${CATEGORY_ICONS[c.name] || 'fa-tag'}`} aria-hidden="true"></i></span>
                          <span className="ss-item-main">
                            <span className="ss-item-name"><Highlight text={c.name} query={keyword} /></span>
                            <span className="ss-item-sub">{c.count} item{c.count === 1 ? '' : 's'}</span>
                          </span>
                        </button>
                      ))}
                    </>
                  )}

                  {suggest.sellers.length > 0 && (
                    <>
                      <div className="ss-group-title"><i className="fa fa-building-o" aria-hidden="true"></i> Brands</div>
                      {suggest.sellers.map((s) => (
                        <button
                          key={s.name}
                          id={`ss-row-${rowIndex('seller', s)}`}
                          type="button"
                          className={`ss-item ${active === rowIndex('seller', s) ? 'ss-item--active' : ''}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectRow({ kind: 'seller', ref: s })}
                        >
                          <span className="ss-ico"><i className="fa fa-building-o" aria-hidden="true"></i></span>
                          <span className="ss-item-main">
                            <span className="ss-item-name"><Highlight text={s.name} query={keyword} /></span>
                            <span className="ss-item-sub">{s.count} item{s.count === 1 ? '' : 's'}</span>
                          </span>
                        </button>
                      ))}
                    </>
                  )}

                  {suggest.products.length === 0 && suggest.categories.length === 0 && suggest.sellers.length === 0 && (
                    <div className="ss-note">
                      <i className="fa fa-search" aria-hidden="true"></i>
                      No matches for "{keyword}". Try different keywords.
                    </div>
                  )}

                  <button
                    type="button"
                    id={`ss-row-${rowIndex('query', null)}`}
                    className={`ss-item ${active === rowIndex('query', null) ? 'ss-item--active' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectRow({ kind: 'query', ref: null })}
                  >
                    <span className="ss-ico"><i className="fa fa-search" aria-hidden="true"></i></span>
                    <span className="ss-item-main">
                      <span className="ss-item-name">See all results for <strong>"{keyword}"</strong></span>
                    </span>
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {recent.length > 0 && (
                <>
                  <div className="ss-recent-head">
                    <span className="ss-group-title"><i className="fa fa-clock-o" aria-hidden="true"></i> Recent Searches</span>
                    <button type="button" className="ss-clear-all" onMouseDown={(e) => e.preventDefault()} onClick={clearRecent}>
                      Clear All
                    </button>
                  </div>
                  {recent.map((r) => (
                    <div key={r} className={`ss-item ${active === rowIndex('recent', r) ? 'ss-item--active' : ''}`}>
                      <span className="ss-ico"><i className="fa fa-clock-o" aria-hidden="true"></i></span>
                      <button
                        type="button"
                        id={`ss-row-${rowIndex('recent', r)}`}
                        className="ss-item-main ss-item-btn"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectRow({ kind: 'recent', ref: r })}
                      >
                        <span className="ss-item-name">{r}</span>
                      </button>
                      <button
                        type="button"
                        className="ss-remove"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => removeRecent(r)}
                        aria-label={`Remove ${r} from recent searches`}
                      >
                        <i className="fa fa-times" aria-hidden="true"></i>
                      </button>
                    </div>
                  ))}
                </>
              )}

              <div className="ss-trending">
                <span className="ss-trending-title"><i className="fa fa-fire" aria-hidden="true"></i> Trending Searches</span>
                <div>
                  {TRENDING.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="ss-chip"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => goSearch(t)}
                    >
                      <i className="fa fa-search" aria-hidden="true"></i> {t}
                    </button>
                  ))}
                </div>
              </div>

              {isMobile && (
                <div className="vc-ms-overlay__categories">
                  <span className="vc-ms-overlay__cat-label">Popular Categories</span>
                  {MOBILE_CATEGORIES.map((c) => (
                    <Link
                      key={c.label}
                      to={c.to}
                      className="vc-ms-overlay__cat-chip"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setOpen(false); onDone?.(); }}
                    >
                      <i className={`fa ${c.icon}`} aria-hidden="true"></i> {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <CameraSearchModal show={camOpen} onClose={() => setCamOpen(false)} />
    </div>
  );
}
