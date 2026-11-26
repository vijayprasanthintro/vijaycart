import { Link } from 'react-router-dom';

/**
 * Shared storefront/preview section header. Keeping one header component makes
 * every product row inherit the same spacing and decorative-rule geometry.
 */
export default function SectionHeader({ title, subtitle, viewAll, actions }) {
  const viewAllNode = !viewAll ? null : typeof viewAll === 'string' ? (
    <Link to={viewAll} className="view-all-link">
      View All <i className="fa fa-arrow-right" aria-hidden="true"></i>
    </Link>
  ) : (
    viewAll
  );

  return (
    <div className="section-head">
      <div className="section-head__copy">
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-sub mt-1">{subtitle}</p>}
      </div>
      {(viewAllNode || actions) && (
        <div className="section-head__actions d-flex align-items-center">
          {viewAllNode}
          {actions}
        </div>
      )}
    </div>
  );
}
