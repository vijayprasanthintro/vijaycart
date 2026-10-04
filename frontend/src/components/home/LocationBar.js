import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchAddresses } from '../../actions/addressActions';

// Formats a saved address for the compact header strip:
// "12, Gandhi Street, Coimbatore 641004"
export const formatAddressLine = (addr) => {
    if (!addr) return '';
    const parts = [
        addr.address,
        addr.locality,
        addr.city,
        addr.postalCode
    ].map(p => String(p || '').trim()).filter(Boolean);
    return parts.join(', ');
};

const TYPE_LABELS = { home: 'Home', work: 'Work', other: 'Other' };

export default function LocationBar() {
    const dispatch = useDispatch();
    const { items: savedAddresses, loaded: addressesLoaded } = useSelector((state) => state.addressState);
    const { shippingInfo } = useSelector((state) => state.cartState);
    const { user, isAuthenticated } = useSelector((state) => state.authState);
    const userId = user?.id || null;

    // The header address always belongs to the logged-in account: it is
    // fetched fresh whenever the authenticated user changes (login, logout,
    // cross-tab switch) and on first load after a refresh. The backend
    // resolves the owner from the JWT cookie — never from client state.
    useEffect(() => {
        if (!isAuthenticated) return;
        dispatch(fetchAddresses());
    }, [dispatch, isAuthenticated, userId]);

    // Which address to display:
    //   1. The delivery address the user actively selected for checkout
    //      (only when it still exists in their saved list),
    //   2. otherwise their default saved address,
    //   3. otherwise prompt them to add one.
    const selected = shippingInfo?.id
        ? savedAddresses.find(a => a._id === shippingInfo.id || a.id === shippingInfo.id)
        : null;
    const defaultAddress = savedAddresses.find(a => a.isDefault)
        || (savedAddresses.length === 1 ? savedAddresses[0] : null);
    const activeAddress = selected || defaultAddress;

    const coins = Math.floor(Number(user && user.vijayCoins) || 0);

    let addressText;
    let linkTo;
    let title;
    if (!isAuthenticated) {
        addressText = 'Select your location';
        linkTo = '/login';
        title = 'Login to see your delivery location';
    } else if (activeAddress) {
        addressText = formatAddressLine(activeAddress);
        linkTo = '/shipping';
        title = 'Change delivery location';
    } else {
        addressText = addressesLoaded ? 'Add your delivery address' : 'Loading your location…';
        linkTo = '/shipping';
        title = 'Add a delivery address';
    }

    return (
        <div className="location-bar">
            <div className="container">
                <div className="location-row">
                    <Link to={linkTo} className="location-info" title={title} aria-label="Change delivery location">
                        <span className="location-home-icon">
                            <i className="fa fa-map-marker" aria-hidden="true"></i>
                        </span>
                        <span className="location-texts">
                            <span className="location-title">
                                Deliver to{isAuthenticated && activeAddress && (
                                    <b className="location-type">{TYPE_LABELS[activeAddress.type] || ''}</b>
                                )}
                            </span>
                            <span className="location-address">{addressText}</span>
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
