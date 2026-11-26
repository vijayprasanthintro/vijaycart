import { tokensToVars } from '../../designs/designUtils';
import { STOREFRONT_CATEGORIES } from '../../designs/storefrontContent';
import ThemeHero from '../home/ThemeHero';
import QuickAccess from '../home/QuickAccess';
import SectionHeader from '../home/SectionHeader';
import ProductRow from '../home/ProductRow';

const PRODUCTS = [
    { name: 'iPhone 16 Pro Max', brand: 'Apple', icon: 'fa-mobile', price: '1,24,900', mrp: '1,39,900', off: 11 },
    { name: 'MacBook Air M3', brand: 'Apple', icon: 'fa-laptop', price: '94,990', mrp: '1,14,900', off: 17 },
    { name: 'Sony WH-1000XM5', brand: 'Sony', icon: 'fa-headphones', price: '26,990', mrp: '34,990', off: 23 },
    { name: 'Galaxy S24 Ultra', brand: 'Samsung', icon: 'fa-tablet', price: '1,09,999', mrp: '1,34,999', off: 19 }
];

const PRODUCTS_TWO = [
    { name: 'Nike Air Max 270', brand: 'Nike', icon: 'fa-shopping-bag', price: '8,999', mrp: '12,999', off: 31 },
    { name: 'Minimal Leather Tote', brand: 'Hidesign', icon: 'fa-shopping-bag', price: '4,499', mrp: '6,999', off: 36 },
    { name: 'Smart Fitness Watch', brand: 'Noise', icon: 'fa-clock-o', price: '2,999', mrp: '5,999', off: 50 },
    { name: '4K Mirrorless Camera', brand: 'Canon', icon: 'fa-camera', price: '72,490', mrp: '84,995', off: 15 }
];

function brandMark() {
    return (
        <>
            <span>Vijay</span><span className="text-gold">Cart</span>
        </>
    );
}

/**
 * Data-free product card that reuses the exact markup and classes of the live
 * Product component. Border, radius, padding, image ratio and button styling
 * therefore come from the same tokens in both environments.
 */
function ProductCard({ product }) {
    return (
        <article className="card-premium card-product p-0 rounded">
            <div className="product-badges">
                <span className="product-badge bg-gold">Bestseller</span>
                <span className="product-badge bg-discount">-{product.off}%</span>
            </div>
            <div className="position-relative overflow-hidden">
                <div className="card-img-top vc-preview-card__img">
                    <i className={`fa ${product.icon}`} aria-hidden="true"></i>
                </div>
                <span className="quick-view-btn">
                    <i className="fa fa-eye" aria-hidden="true"></i> Quick View
                </span>
            </div>
            <div className="card-body d-flex flex-column">
                <span className="product-seller">{product.brand}</span>
                <h5 className="card-title">
                    <span>{product.name}</span>
                </h5>
                <div className="price-row">
                    <span className="card-text">₹{product.price}</span>
                    <span className="mrp">₹{product.mrp}</span>
                    <span className="discount-chip">-{product.off}%</span>
                </div>
                <div className="d-flex gap-2 mt-auto pt-2">
                    <span className="btn btn-block view-btn flex-grow-1">
                        <span>Add to Cart</span>
                    </span>
                </div>
            </div>
        </article>
    );
}

function Section({ title, accent, subtitle, products }) {
    return (
        <section className="section">
            <SectionHeader
                title={<span>{title} <span className="section-accent">{accent}</span></span>}
                subtitle={subtitle}
                viewAll={(
                    <span className="view-all-link">
                        View All <i className="fa fa-arrow-right" aria-hidden="true"></i>
                    </span>
                )}
            />
            <ProductRow
                products={products}
                trackClassName="ds-pv-grid"
                renderProduct={(product) => <ProductCard key={product.name} product={product} />}
            />
        </section>
    );
}

/**
 * High-fidelity, data-free storefront preview. It reuses the real storefront
 * components/classes (ThemeHero, QuickAccess, Product card classes, sections,
 * promo banner and footer) and the same design tokens as the live site, so what
 * the admin sees here is what customers get after Apply.
 */
export default function StorefrontPreview({ design, tokens, device = 'desktop' }) {
    if (!design) return null;

    const style = tokensToVars(tokens);

    return (
        <div
            className="ds-preview-page"
            data-design={design.id}
            data-device={device}
            data-density={tokens.density}
            data-btn-style={tokens.buttonStyle || 'solid'}
            data-card-style={tokens.cardStyle || 'elevated'}
            style={style}
        >
            <div className="vc-announcement">
                <span>Free delivery on orders above ₹499 · New season drops are live</span>
            </div>

            {device === 'mobile' ? (
                <>
                    <header className="vc-mhd">
                        <div className="vc-mhd__row">
                            <div className="vc-mhd__brand">
                                <span className="vc-mhd__brand-icon">
                                    <i className="fa fa-shopping-bag" aria-hidden="true"></i>
                                </span>
                                <span className="vc-mhd__brand-name">{brandMark()}</span>
                            </div>
                            <div className="ds-pv-mobile-head__icons">
                                <i className="fa fa-heart-o" aria-hidden="true"></i>
                                <i className="fa fa-shopping-cart" aria-hidden="true"></i>
                                <i className="fa fa-user-o" aria-hidden="true"></i>
                            </div>
                        </div>
                        <div className="vc-mhd__search-row">
                            <div className="vc-mhd__search-bar">
                                <i className="fa fa-search vc-mhd__search-icon" aria-hidden="true"></i>
                                <span className="vc-mhd__search-placeholder">Search products, brands and more</span>
                            </div>
                        </div>
                    </header>
                    <nav className="vc-cn-m">
                        <div className="vc-cn-m__scroll">
                            {STOREFRONT_CATEGORIES.map((cat, index) => (
                                <span
                                    key={cat.label}
                                    className={`vc-cn-m__chip${index === 0 ? ' vc-cn-m__chip--active' : ''}`}
                                >
                                    <span className="vc-cn__icon">
                                        <i className={`fa ${cat.icon}`} aria-hidden="true"></i>
                                    </span>
                                    <span className="vc-cn-m__label">{cat.label}</span>
                                </span>
                            ))}
                        </div>
                    </nav>
                </>
            ) : (
                <>
                    <header className="vc-hd">
                        <div className="container vc-hd__inner">
                            <div className="vc-hd__brand">
                                <span className="vc-hd__brand-icon">
                                    <i className="fa fa-shopping-bag" aria-hidden="true"></i>
                                </span>
                                <span className="vc-hd__brand-text">
                                    <span className="vc-hd__brand-name">{brandMark()}</span>
                                    <span className="vc-hd__brand-tagline">Smart Shopping</span>
                                </span>
                            </div>
                            <div className="vc-hd__search">
                                <i className="fa fa-search" style={{ margin: '0 10px', opacity: 0.5 }} aria-hidden="true"></i>
                                <span className="vc-hd__search-input">Search for products, brands and more</span>
                                <span className="vc-hd__search-btn">
                                    <i className="fa fa-search" aria-hidden="true"></i>
                                </span>
                            </div>
                            <nav className="vc-hd__nav">
                                <span className="vc-hd__item vc-hd__item--link">Login</span>
                                <span className="vc-hd__item vc-hd__item--icon">
                                    <i className="fa fa-heart-o" aria-hidden="true"></i>
                                    <span className="vc-nav-btn-text">Wishlist</span>
                                </span>
                                <span className="vc-hd__item vc-hd__item--icon">
                                    <i className="fa fa-shopping-cart" aria-hidden="true"></i>
                                    <span className="vc-hd__badge">2</span>
                                    <span className="vc-nav-btn-text">Cart</span>
                                </span>
                            </nav>
                        </div>
                    </header>
                    <nav className="vc-cn">
                        <div className="vc-cn__inner">
                            <div className="vc-cn__scroll">
                                {STOREFRONT_CATEGORIES.map((cat, index) => (
                                    <span
                                        key={cat.label}
                                        className={`vc-cn__item${index === 0 ? ' vc-cn__item--active' : ''}`}
                                    >
                                        <span className="vc-cn__link">
                                            <span className="vc-cn__icon">
                                                <i className={`fa ${cat.icon}`} aria-hidden="true"></i>
                                            </span>
                                            <span className="vc-cn__label">{cat.label}</span>
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </nav>
                </>
            )}

            <div className="container">
                <ThemeHero design={design} />
                <QuickAccess categories={STOREFRONT_CATEGORIES} />

                <Section
                    title="Today's best"
                    accent="deals"
                    subtitle="Handpicked offers across every category"
                    products={PRODUCTS}
                />

                <section className="promo-banner">
                    <div className="promo-inner">
                        <span className="promo-kicker">Limited time offer</span>
                        <h2 className="promo-title">Mega Shopping Days</h2>
                        <p className="promo-sub mb-0">Flat 30% off sitewide on mobiles, laptops, fashion and more.</p>
                        <span className="promo-cta">Shop the Sale <i className="fa fa-arrow-right" aria-hidden="true"></i></span>
                    </div>
                </section>

                <Section
                    title="New"
                    accent="arrivals"
                    subtitle="Freshly added to the catalogue"
                    products={PRODUCTS_TWO}
                />
            </div>

            <footer className="site-footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-col footer-brand-col">
                            <span className="footer-brand">
                                <i className="fa fa-shopping-bag footer-brand-icon" aria-hidden="true"></i>
                                <span>{brandMark()}</span>
                            </span>
                            <p className="footer-tagline">Smart Shopping. Better Choices.</p>
                            <p className="footer-about">
                                Your premium destination for mobiles, laptops, fashion, electronics
                                and more — with fast delivery and secure payments.
                            </p>
                        </div>
                        <div className="footer-col">
                            <h5 className="footer-heading">Support</h5>
                            <ul className="footer-links">
                                <li><span>help@vijaycart.com</span></li>
                                <li><span>+91 8220477466</span></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p className="mb-0">© 2026 VijayCart. All Rights Reserved.</p>
                        <p className="mb-0 footer-bottom-note">
                            <i className="fa fa-lock" aria-hidden="true"></i> Secure payments
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
