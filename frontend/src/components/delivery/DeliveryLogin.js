import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthError, login } from '../../actions/userActions';
import MetaData from '../layouts/MetaData';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';

export default function DeliveryLogin() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState({})
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading, error, isAuthenticated, user } = useSelector(state => state.authState)

    const validate = () => {
        const errs = {};
        if (!email.trim()) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email address';
        if (!password) errs.password = 'Password is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const submitHandler = (e) => {
        e.preventDefault();
        if (!validate()) return;
        dispatch(login(email, password))
    }

    useEffect(() => {
        if (isAuthenticated) {
            if (user.role === 'deliveryboy') {
                navigate('/delivery/dashboard')
            } else {
                toast('This account is not registered as a delivery partner', {
                    position: toast.POSITION.BOTTOM_CENTER,
                    type: 'error'
                })
            }
        }

        if (error) {
            toast(error, {
                position: toast.POSITION.BOTTOM_CENTER,
                type: 'error',
                onOpen: () => { dispatch(clearAuthError) }
            })
            return
        }
    }, [error, isAuthenticated, user, dispatch, navigate])

    return (
        <Fragment>
            <MetaData title={`Delivery Partner Login`} />
            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form onSubmit={submitHandler} className="shadow-lg" noValidate>
                        <div className="de-login-head">
                            <div className="de-login-icon"><i className="fa fa-motorcycle" aria-hidden="true"></i></div>
                            <h1 className="mb-1">Delivery Partner</h1>
                            <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>Sign in to manage your deliveries</p>
                        </div>
                        <div className="form-group">
                            <label htmlFor="delivery_email_field">Email</label>
                            <input
                                type="email"
                                id="delivery_email_field"
                                className="form-control"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                            {errors.email && <p className="form-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.email}</p>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="delivery_password_field">Password</label>
                            <div className="password-wrap">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="delivery_password_field"
                                    className="form-control"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                                <button type="button" className="show-password" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                    <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i>
                                </button>
                            </div>
                            {errors.password && <p className="form-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.password}</p>}
                        </div>

                        <button
                            id="delivery_login_button"
                            type="submit"
                            className="btn btn-block py-3"
                            disabled={loading}
                        >
                            {loading ? <i className="fa fa-spinner fa-spin mr-2" aria-hidden="true"></i> : <i className="fa fa-sign-in mr-2" aria-hidden="true"></i>}
                            SIGN IN
                        </button>

                        <p className="text-center mt-3 mb-0" style={{ fontSize: '0.85rem' }}>Back to <Link to="/">VijayCart</Link></p>
                    </form>
                </div>
            </div>
        </Fragment>
    )
}
