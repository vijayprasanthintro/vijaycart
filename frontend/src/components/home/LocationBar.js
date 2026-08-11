import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const DEFAULT_ADDRESS = '2/42, Mallampalayam, Arasanarham (Post), Tamil Nadu';

export default function LocationBar() {
  const { shippingInfo } = useSelector((state) => state.cartState);
  const { user, isAuthenticated } = useSelector((state) => state.authState);

  let address = DEFAULT_ADDRESS;
  if (shippingInfo && shippingInfo.address) {
    const parts = [shippingInfo.address, shippingInfo.city, shippingInfo.postalCode].filter(Boolean);
    address = parts.join(', ');
  }

  const coins = Math.floor(Number(user && user.vijayCoins) || 0);

  return (
    <div className="location-bar">
      <div className="container">
        <div className="location-row">
          <Link to="/shipping" className="location-info" title="Change delivery location" aria-label="Change delivery location">
            <span className="location-home-icon">
              <i className="fa fa-home" aria-hidden="true"></i>
            </span>
            <span className="location-texts">
              <span className="location-title">Deliver to</span>
              <span className="location-address">{address}</span>
            </span>
            <i className="fa fa-chevron-down location-chevron" aria-hidden="true"></i>
          </Link>
          <Link
            to={isAuthenticated ? '/myprofile' : '/login'}
            className="location-reward"
            title={isAuthenticated ? `${coins} VijayCoins available — redeem at checkout` : 'Login to earn VijayCoins'}
            aria-label="VijayCoins balance"
          >
            <i className="fa fa-star" aria-hidden="true"></i> VijayCoins
            {isAuthenticated && coins > 0 && <b className="location-coins">{coins}</b>}
          </Link>
        </div>
      </div>
    </div>
  );
}
