import { Link } from 'react-router-dom';
import { useDesign } from '../../context/ThemeContext';
import { getHeroCopy } from '../../designs/storefrontContent';

/**
 * Theme-driven hero shared by the live storefront and the Design Studio
 * preview. All colours, radii, fonts and motion come from the same CSS custom
 * properties, so the two environments cannot diverge.
 */
export default function ThemeHero({ design: designOverride }) {
    const { designId, activeDesign } = useDesign();
    const design = designOverride || {
        ...(activeDesign || {}),
        id: activeDesign?.designId || designId
    };
    const copy = getHeroCopy(design);

    return (
        <section className="hero-section vc-theme-hero-section" aria-label="Featured collection">
            <div className="vc-hero vc-theme-hero">
                <div className="vc-theme-hero__content">
                    <span className="vc-theme-hero__kicker">{copy.category} · New season</span>
                    <h2 className="vc-theme-hero__title">{copy.title}</h2>
                    <p className="vc-theme-hero__sub">{copy.description}</p>
                    <Link to="/search/all" className="vc-theme-hero__cta">
                        Shop the edit <i className="fa fa-arrow-right" aria-hidden="true"></i>
                    </Link>
                </div>
                <div className="vc-theme-hero__art" aria-hidden="true">
                    <i className="fa fa-shopping-bag"></i>
                </div>
            </div>
        </section>
    );
}
