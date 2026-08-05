import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Fragment } from 'react';

const DEFAULT_STORES = [
  { name: 'Designer Cases', to: '/search/all?category=Accessories', img: '/images/products/7.jpg' },
  { name: 'Wrist Watches', to: '/search/all?category=Accessories', img: '/images/products/5.jpg' },
  { name: 'Eau De Parfum', to: '/search/all?category=Beauty/Health', img: '/images/products/10.jpg' },
  { name: 'Laptops', to: '/search/all?category=Laptops', img: '/images/products/4.jpg' },
];

export default function PersonalizedSection({ products = [] }) {
  const { isAuthenticated, user } = useSelector((state) => state.authState);
  const firstName = user?.name ? user.name.split(' ')[0] : 'Shopper';

  const stores = DEFAULT_STORES.map((s, idx) => {
    const fallback = products[idx];
    if (fallback && fallback.images && fallback.images[0]) {
      return {
        ...s,
        img: fallback.images[0].image,
        to: `/product/${fallback._id}`,
      };
    }
    return s;
  });

  return (
    <Fragment>
      {stores.length > 0 && (
        <section className="personalized-section">
          <div className="personalized-head">
            <h2 className="personalized-title">
              <i className="fa fa-heart-o" aria-hidden="true"></i>
              {isAuthenticated ? (
                <span>
                  <span className="personalized-name">{firstName},</span> still looking for these?
                </span>
              ) : (
                'Still looking for these?'
              )}
            </h2>
            <Link to="/search/all" className="view-all-link">
              View All <i className="fa fa-arrow-right" aria-hidden="true"></i>
            </Link>
          </div>
          <div className="personalized-track">
            {stores.map((s, i) => (
              <Link key={i} to={s.to} className="personalized-card">
                <img src={s.img} alt={s.name} className="personalized-img" loading="lazy" />
                <span className="personalized-info">
                  <span className="personalized-name-label">{s.name}</span>
                  <span className="personalized-cta">
                    View Store <i className="fa fa-angle-right" aria-hidden="true"></i>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Fragment>
  );
}
