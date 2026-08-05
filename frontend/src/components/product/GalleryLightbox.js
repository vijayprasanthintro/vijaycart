import { useCallback, useEffect, useState } from 'react';

export default function GalleryLightbox({ images = [], startIndex = 0, title = '', onClose }) {
  const [index, setIndex] = useState(startIndex);
  const len = images.length;

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  const prev = useCallback(() => setIndex(i => (i - 1 + len) % len), [len]);
  const next = useCallback(() => setIndex(i => (i + 1) % len), [len]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  if (!len) return null;

  return (
    <div className="pd-lbox" role="dialog" aria-modal="true" aria-label={title || 'Image viewer'} onClick={onClose}>
      <div className="pd-lbox-stage" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="pd-lbox-close" onClick={onClose} aria-label="Close image viewer">
          <i className="fa fa-times" aria-hidden="true"></i>
        </button>
        {len > 1 && (
          <>
            <button type="button" className="pd-lbox-nav pd-lbox-nav--prev" onClick={prev} aria-label="Previous image">
              <i className="fa fa-chevron-left" aria-hidden="true"></i>
            </button>
            <button type="button" className="pd-lbox-nav pd-lbox-nav--next" onClick={next} aria-label="Next image">
              <i className="fa fa-chevron-right" aria-hidden="true"></i>
            </button>
          </>
        )}
        <div className="pd-lbox-imgwrap">
          <img key={index} className="pd-lbox-img" src={images[index]} alt={title || `Image ${index + 1}`} />
        </div>
        <div className="pd-lbox-count">{index + 1} / {len}</div>
        {len > 1 && (
          <div className="pd-lbox-thumbs">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                className={`pd-lbox-thumb ${i === index ? 'active' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`View image ${i + 1}`}
              >
                <img src={img} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
