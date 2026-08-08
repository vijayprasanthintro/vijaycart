import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import MetaData from '../layouts/MetaData';
import { adminLogin, clearAuthError } from '../../actions/userActions';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading, error, isAuthenticated, user } = useSelector(state => state.authState);

    useEffect(() => {
        if (isAuthenticated && user?.role === 'admin') {
            navigate('/admin/dashboard');
        }
    }, [isAuthenticated, user, navigate])

    useEffect(() => {
        if (error) {
            toast(error, {
                position: toast.POSITION.BOTTOM_CENTER,
                type: 'error',
                onOpen: () => { dispatch(clearAuthError) }
            })
        }
    }, [error, dispatch])

    const submitHandler = async (e) => {
        e.preventDefault();
        const errs = {};
        if (!email.trim()) errs.email = 'Email is required';
        else if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address';
        if (!password) errs.password = 'Password is required';
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        const data = await dispatch(adminLogin({ email, password }));
        if (data) navigate('/admin/dashboard');
    }

    return (
        <Fragment>
            <MetaData title={`Admin Login`} />
            <section className="vc-auth" aria-label="Admin sign in to VijayCart">
                <div className="vc-auth-panel">
                    <span className="vc-auth-orb vc-auth-orb--1" aria-hidden="true"></span>
                    <span className="vc-auth-orb vc-auth-orb--2" aria-hidden="true"></span>
                    <span className="vc-auth-orb vc-auth-orb--3" aria-hidden="true"></span>

                    <div className="vc-auth-card">
                        <div className="vc-auth-brand">
                            <span className="vc-auth-logo"><i className="fa fa-lock" aria-hidden="true"></i></span>
                            <span className="vc-auth-name">VijayCart Admin</span>
                        </div>

                        <form onSubmit={submitHandler} noValidate>
                            <h1 className="vc-title">Admin Login</h1>
                            <p className="vc-sub">Sign in with your admin email and password.</p>

                            <div className="vc-field">
                                <input
                                    id="admin_login_email"
                                    type="email"
                                    placeholder=" "
                                    autoComplete="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                                <label htmlFor="admin_login_email">Email Address</label>
                                {errors.email && <p className="vc-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.email}</p>}
                            </div>

                            <div className="vc-field">
                                <input
                                    id="admin_login_password"
                                    type="password"
                                    placeholder=" "
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                                <label htmlFor="admin_login_password">Password</label>
                                {errors.password && <p className="vc-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.password}</p>}
                            </div>

                            <button type="submit" className="vc-btn" disabled={loading}>
                                {loading ? <i className="fa fa-spinner fa-spin mr-2" aria-hidden="true"></i> : <i className="fa fa-sign-in mr-2" aria-hidden="true"></i>}
                                {loading ? 'Signing in…' : 'Sign In'}
                            </button>

                            <div className="vc-row">
                                <Link to="/login" className="vc-link">
                                    <i className="fa fa-chevron-left mr-1" aria-hidden="true"></i> Customer OTP login
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </Fragment>
    )
}
