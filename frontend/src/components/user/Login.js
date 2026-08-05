import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthError, login } from '../../actions/userActions';
import MetaData from '../layouts/MetaData';
import { toast } from 'react-toastify';
import { Link, useLocation, useNavigate } from 'react-router-dom';
export default function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState({})
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { loading, error, isAuthenticated } = useSelector(state => state.authState)
    const redirect = location.search ? new URLSearchParams(location.search).get('redirect') || '/' : '/';

    const validate = () => {
        const errs = {};
        if (!email.trim()) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email address';
        if (!password) errs.password = 'Password is required';
        else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
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
            navigate(redirect)
        }

        if (error) {
            toast(error, {
                position: toast.POSITION.BOTTOM_CENTER,
                type: 'error',
                onOpen: () => { dispatch(clearAuthError) }
            })
            return
        }
    }, [error, isAuthenticated, dispatch, navigate, redirect])

    return (
        <Fragment>
            <MetaData title={`Login`} />
            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form onSubmit={submitHandler} className="shadow-lg" noValidate>
                        <h1 className="mb-3">Welcome Back</h1>
                        <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>Sign in to your VijayCart account</p>
                        <div className="form-group">
                            <label htmlFor="email_field">Email</label>
                            <input
                                type="email"
                                id="email_field"
                                className="form-control"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                            {errors.email && <p className="form-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.email}</p>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password_field">Password</label>
                            <div className="password-wrap">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password_field"
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

                        <Link to="/password/forgot" className="float-right mb-4">Forgot Password?</Link>

                        <button
                            id="login_button"
                            type="submit"
                            className="btn btn-block py-3"
                            disabled={loading}
                        >
                            {loading ? <i className="fa fa-spinner fa-spin mr-2" aria-hidden="true"></i> : <i className="fa fa-sign-in mr-2" aria-hidden="true"></i>}
                            LOGIN
                        </button>

                        <div className="auth-benefits">
                            <div className="auth-benefit"><i className="fa fa-check-circle" aria-hidden="true"></i> Exclusive deals &amp; faster checkout</div>
                            <div className="auth-benefit"><i className="fa fa-check-circle" aria-hidden="true"></i> Order tracking &amp; easy returns</div>
                        </div>

                        <p className="text-center mt-3 mb-0" style={{ fontSize: '0.85rem' }}>New to VijayCart? <Link to="/register">Create Account</Link></p>
                    </form>
                </div>
            </div>
        </Fragment>
    )
}
