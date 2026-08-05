import { useSelector } from 'react-redux';
import {Navigate} from 'react-router-dom';
import Loader from '../layouts/Loader';

export default function ProtectedRoute ({children, isAdmin, isDeliveryBoy}) {
    const { isAuthenticated, loading, user } = useSelector(state => state.authState)

    if(!isAuthenticated && !loading) {
        return <Navigate to={isDeliveryBoy ? "/delivery/login" : "/login"} />
    }

    if(isAuthenticated) {
        if(isAdmin === true  && user.role !== 'admin') {
            return <Navigate to="/" />
        }
        if(isDeliveryBoy === true  && user.role !== 'deliveryboy') {
            return <Navigate to="/delivery/login" />
        }
        return children;
    }

    if(loading) {
        return <Loader/>
    }

   
}