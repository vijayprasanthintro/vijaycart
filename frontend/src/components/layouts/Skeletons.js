export function BannerSkeleton() {
  return <div className="skeleton sk-banner" role="status" aria-label="Loading banner"></div>;
}

export function CategorySkeleton() {
  return (
    <div className="sk-chip-row" role="status" aria-label="Loading categories">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="skeleton sk-chip"></div>
      ))}
    </div>
  );
}

export function SectionTitleSkeleton() {
  return <div className="skeleton sk-section-title" role="status" aria-label="Loading section"></div>;
}

export function ProductRowSkeleton({ count = 4 }) {
  return (
    <div className="sk-card-row" role="status" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton sk-card"></div>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="sk-pd" role="status" aria-label="Loading product details">
      <div className="sk-pd-grid">
        <div className="sk-pd-gallery">
          <div className="skeleton sk-pd-main"></div>
          <div className="sk-pd-thumbs">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton sk-pd-thumb"></div>
            ))}
          </div>
        </div>
        <div className="sk-pd-info">
          <div className="skeleton sk-pd-line sk-pd-line--lg"></div>
          <div className="skeleton sk-pd-line sk-pd-line--md"></div>
          <div className="skeleton sk-pd-chip"></div>
          <div className="skeleton sk-pd-line sk-pd-line--price"></div>
          <div className="skeleton sk-pd-line sk-pd-line--md"></div>
          <div className="sk-pd-actions">
            <div className="skeleton sk-pd-btn"></div>
            <div className="skeleton sk-pd-btn sk-pd-btn--alt"></div>
          </div>
          <div className="skeleton sk-pd-line sk-pd-line--md"></div>
          <div className="skeleton sk-pd-line sk-pd-line--sm"></div>
        </div>
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="skeleton sk-pd-block"></div>
      ))}
    </div>
  );
}
