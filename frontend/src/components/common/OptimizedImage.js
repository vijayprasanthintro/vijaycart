import { useState } from 'react';
import { IMAGE_FALLBACK, imgOnError } from '../../utils/productHelper';

// Centralized <img> for product/site images:
//   - lazy-loads below-the-fold images (pass eager for hero/LCP images)
//   - async decoding so layout/rendering never blocks
//   - swaps broken sources for the local placeholder exactly once
//   - supports an aspectRatio style hint to prevent layout shift
export default function OptimizedImage({
  src,
  alt = '',
  className,
  style,
  width,
  height,
  eager = false,
  aspectRatio,
  draggable = false,
}) {
  const [failed, setFailed] = useState(false);
  const resolved = failed || !src ? IMAGE_FALLBACK : src;

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      style={aspectRatio ? { aspectRatio, ...style } : style}
      width={width}
      height={height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={draggable}
      onError={(e) => {
        if (!failed) setFailed(true);
        imgOnError(e);
      }}
    />
  );
}
