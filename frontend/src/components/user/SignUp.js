import { Fragment, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { sendOtp, verifyOtp } from '../../actions/userActions';
import MetaData from '../layouts/MetaData';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { easeOutExpo } from '../../utils/motion';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Small, professional toast popup used for all success / error messages.
// Positioning and styling come from the universal toast system in App.css.
const TOAST_STYLE = {
    position: toast.POSITION.BOTTOM_RIGHT,
    className: 'vc-toast'
};

export default function SignUp() {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [step, setStep] = useState('form');
    const [resendIn, setResendIn] = useState(0);
    const [errors, setErrors] = useState({});
    const otpRefs = useRef([]);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { loading, error, isAuthenticated, otpInfo, otpLoading, otpError } = useSelector(state => state.authState);
    const redirect = location.search ? new URLSearchParams(location.search).get('redirect') || '/' : '/';

    useEffect(() => {
        if (isAuthenticated) {
            navigate(redirect.startsWith('/') ? redirect : `/${redirect}`)
        }
    }, [isAuthenticated, navigate, redirect])

    useEffect(() => {
        // `error` is also set by the initial loadUser() 401 when a visitor is
        // not logged in, which must NOT pop up on the blank form. The verify
        // step only reaches here after the user actually tried to verify an
        // OTP, so failures surfaced there are real.
        if (error && step === 'verify') {
            toast.error(error, TOAST_STYLE);
        }
    }, [error, step])

    useEffect(() => {
        if (otpError) toast.error(otpError, TOAST_STYLE);
    }, [otpError])

    useEffect(() => {
        if (otpInfo) {
            setStep('verify')
            setResendIn(otpInfo.resendIn || 0)
        }
    }, [otpInfo])

    // Resend cooldown countdown.
    useEffect(() => {
        if (resendIn <= 0) return;
        const t = setInterval(() => setResendIn(s => (s > 0 ? s - 1 : 0)), 1000);
        return () => clearInterval(t);
    }, [resendIn])

    const validateSend = () => {
        const errs = {};
        if (!name.trim()) errs.name = 'Please enter your full name';
        else if (name.trim().length < 2) errs.name = 'Name is too short';
        const digits = mobile.replace(/\D/g, '');
        if (!digits) errs.mobile = 'Mobile number is required';
        else if (!/^[6-9]\d{9}$/.test(digits)) errs.mobile = 'Enter a valid 10-digit mobile number';
        if (!email.trim()) errs.email = 'Email is required';
        else if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const sendPayload = () => ({
        name: name.trim(),
        mobile: mobile.replace(/\D/g, ''),
        email: email.trim()
    });

    const handleSend = async (e) => {
        e.preventDefault();
        if (!validateSend()) return;
        const data = await dispatch(sendOtp(sendPayload()))
        if (data) {
            setStep('verify')
            setResendIn(data.resendIn || 0)
            toast.success('OTP sent to email', TOAST_STYLE);
        }
    }

    const handleVerify = (e) => {
        e.preventDefault();
        if (!otpInfo || !otpInfo.userId) {
            toast.error('Session expired. Please request a new OTP.', TOAST_STYLE);
            return;
        }
        if (!/^\d{6}$/.test(otpCode)) {
            setErrors({ otp: 'Enter the 6-digit OTP' });
            return;
        }
        dispatch(verifyOtp({ userId: otpInfo.userId, otp: otpCode }))
    }

    const resendHandler = async () => {
        if (resendIn > 0) return;
        const data = await dispatch(sendOtp(sendPayload()))
        if (data) {
            setStep('verify')
            setResendIn(data.resendIn || 0)
            toast.success('OTP sent to email', TOAST_STYLE);
        }
    }

    const backToForm = () => {
        setStep('form')
        setOtpCode('')
        setErrors({})
    }

    const otpDigits = Array.from({ length: 6 }, (_, i) => otpCode[i] || '');

    const handleOtpInput = (i, val) => {
        const clean = val.replace(/\D/g, '').slice(-1);
        if (!clean) return;
        setOtpCode(prev => (prev.slice(0, i) + clean + prev.slice(i + 1)).slice(0, 6));
        setErrors(p => ({ ...p, otp: '' }));
        if (i < 5) otpRefs.current[i + 1]?.focus();
    };

    const handleOtpKey = (i, e) => {
        if (e.key !== 'Backspace') return;
        e.preventDefault();
        if (otpDigits[i]) {
            setOtpCode(prev => prev.slice(0, i) + prev.slice(i + 1));
        }
        if (i > 0) otpRefs.current[i - 1]?.focus();
    };

    const handleOtpPaste = (e) => {
        const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!paste) return;
        e.preventDefault();
        setOtpCode(paste);
        setErrors(p => ({ ...p, otp: '' }));
        otpRefs.current[Math.min(paste.length, 5)]?.focus();
    };

    const stepTransition = { duration: 0.3, ease: easeOutExpo };

    return (
        <Fragment>
            <MetaData title={`Create Account`} />
            <section className="vc-auth vc-auth--signup" aria-label="Create a VijayCart account">
                <div className="vc-auth-panel">
                    <span className="vc-auth-orb vc-auth-orb--1" aria-hidden="true"></span>
                    <span className="vc-auth-orb vc-auth-orb--2" aria-hidden="true"></span>
                    <span className="vc-auth-orb vc-auth-orb--3" aria-hidden="true"></span>

                    <div className="vc-auth-card">
                        <div className="vc-auth-brand vc-login-brand">
                            <span className="vc-auth-logo"><i className="fa fa-shopping-bag" aria-hidden="true"></i></span>
                            <span className="vc-auth-name">VijayCart</span>
                        </div>

                        <AnimatePresence>
                            {step === 'form' ? (
                                <motion.form
                                    key="signup-form"
                                    onSubmit={handleSend}
                                    noValidate
                                    initial={{ opacity: 0, x: 28 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -28 }}
                                    transition={stepTransition}
                                >
                                    <div className="vc-login-head">
                                        <h1 className="vc-lg-title">Create Account</h1>
                                        <p className="vc-lg-sub">Sign up with your details</p>
                                    </div>

                                    <div className="vc-lg-fieldwrap">
                                        <div className="vc-lg-field">
                                            <i className="fa fa-user vc-lg-icon" aria-hidden="true"></i>
                                            <input
                                                id="signup_name_field"
                                                type="text"
                                                placeholder=" "
                                                autoComplete="name"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                            />
                                            <label htmlFor="signup_name_field">Full Name</label>
                                        </div>
                                        {errors.name && <p className="vc-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.name}</p>}
                                    </div>

                                    <div className="vc-lg-fieldwrap">
                                        <div className="vc-lg-field">
                                            <i className="fa fa-mobile vc-lg-icon" aria-hidden="true"></i>
                                            <input
                                                id="signup_mobile_field"
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength="10"
                                                placeholder=" "
                                                autoComplete="tel"
                                                value={mobile}
                                                onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                                            />
                                            <label htmlFor="signup_mobile_field">Mobile Number</label>
                                        </div>
                                        {errors.mobile && <p className="vc-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.mobile}</p>}
                                        <p className="vc-hint">We'll send a 6-digit OTP to your email.</p>
                                    </div>

                                    <div className="vc-lg-fieldwrap">
                                        <div className="vc-lg-field">
                                            <i className="fa fa-envelope vc-lg-icon" aria-hidden="true"></i>
                                            <input
                                                id="signup_email_field"
                                                type="email"
                                                placeholder=" "
                                                autoComplete="email"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                            />
                                            <label htmlFor="signup_email_field">Email Address</label>
                                        </div>
                                        {errors.email && <p className="vc-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.email}</p>}
                                        <p className="vc-hint">Use a correct email — the OTP is delivered to your inbox.</p>
                                    </div>

                                    <button type="submit" className="vc-btn vc-lg-login" disabled={otpLoading}>
                                        {otpLoading ? <i className="fa fa-spinner fa-spin mr-2" aria-hidden="true"></i> : <i className="fa fa-user-plus mr-2" aria-hidden="true"></i>}
                                        {otpLoading ? 'Sending OTP…' : 'Create Account'}
                                    </button>

                                    <p className="vc-lg-signup">
                                        Already have an account?{' '}
                                        <Link className="vc-lg-signup-link" to="/login">Login</Link>
                                    </p>

                                    <div className="vc-perks">
                                        <div className="vc-perk"><i className="fa fa-check-circle" aria-hidden="true"></i> No passwords to remember</div>
                                        <div className="vc-perk"><i className="fa fa-shield" aria-hidden="true"></i> Secure OTP delivered instantly</div>
                                    </div>
                                </motion.form>
                            ) : (
                                <motion.form
                                    key="signup-verify"
                                    onSubmit={handleVerify}
                                    noValidate
                                    initial={{ opacity: 0, x: 28 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -28 }}
                                    transition={stepTransition}
                                >
                                    <div className="vc-login-head">
                                        <h1 className="vc-lg-title">Verify OTP</h1>
                                        <p className="vc-lg-sub">{otpInfo && otpInfo.to ? `A 6-digit OTP was sent to ${otpInfo.to}.` : 'Enter the 6-digit OTP sent to your email.'}</p>
                                    </div>

                                    {otpInfo && (
                                        <p className="vc-note vc-note--ok"><i className="fa fa-check-circle" aria-hidden="true"></i> OTP sent to email</p>
                                    )}

                                    <div className="vc-otp" onPaste={handleOtpPaste}>
                                        {otpDigits.map((d, i) => (
                                            <input
                                                key={i}
                                                ref={el => { otpRefs.current[i] = el; }}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength="1"
                                                autoComplete="one-time-code"
                                                value={d}
                                                onChange={e => handleOtpInput(i, e.target.value)}
                                                onKeyDown={e => handleOtpKey(i, e)}
                                                aria-label={`OTP digit ${i + 1}`}
                                            />
                                        ))}
                                    </div>
                                    {errors.otp && <p className="vc-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.otp}</p>}
                                    <p className="vc-hint text-center">Valid for {otpInfo && otpInfo.expiresIn ? otpInfo.expiresIn : 'a few'} minutes.</p>

                                    <button type="submit" className="vc-btn" disabled={loading || !otpInfo}>
                                        {loading ? <i className="fa fa-spinner fa-spin mr-2" aria-hidden="true"></i> : <i className="fa fa-sign-in mr-2" aria-hidden="true"></i>}
                                        {loading ? 'Verifying…' : 'Verify & Create Account'}
                                    </button>

                                    <div className="vc-row">
                                        <button type="button" className="vc-link" onClick={backToForm}>
                                            <i className="fa fa-chevron-left mr-1" aria-hidden="true"></i> Edit details
                                        </button>
                                        <button type="button" className="vc-link" onClick={resendHandler} disabled={resendIn > 0}>
                                            {resendIn > 0 ? `Resend OTP in ${resendIn}s` : 'Resend OTP'}
                                        </button>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </section>
        </Fragment>
    )
}