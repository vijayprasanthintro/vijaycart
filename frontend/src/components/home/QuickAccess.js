import { Link } from 'react-router-dom';
import { STOREFRONT_CATEGORIES } from '../../designs/storefrontContent';

/**
 * Shared quick-access category strip used by both the live home page and the
 * Design Studio preview. Styling is entirely token-driven through the
 * .quick-access* classes.
 */
export default function QuickAccess({ categories = STOREFRONT_CATEGORIES, className = '' }) {
    return (
        <section className={`quick-access ${className}`.trim()} aria-label="Shop by category">
            {categories.map((category) => (
                <Link key={category.label} to={category.to} className="quick-access-item">
                    <span className={`quick-access-icon ${category.cls}`}>
                        <i className={`fa ${category.icon}`} aria-hidden="true"></i>
                    </span>
                    <span className="quick-access-label">{category.label}</span>
                </Link>
            ))}
        </section>
    );
}
