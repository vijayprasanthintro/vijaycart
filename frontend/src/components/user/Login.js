import { Fragment, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { clearAuthError, sendOtp, verifyOtp } from '../../actions/userActions';
import MetaData from '../layouts/MetaData';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import { easeOutExpo } from '../../utils/motion';
import { REMEMBER_KEY } from '../../slices/authSlice';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const readRemember = () => {
    try { return localStorage.getItem(REMEMBER_KEY) !== '0'; } catch { return true; }
};

export default function Login() {
    const [mode, setMode] = useState('mobile');
    const [mobile, setMobile] = useState("")
    const [email, setEmail] = useState("")
    const [otpCode, setOtpCode] = useState("")
    const [step, setStep] = useState('send')
    const [resendIn, setResendIn] = useState(0)
    const [errors, setErrors] = useState({})
    const [remember, setRemember] = useState(readRemember)
    const otpRefs = useRef([]);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { loading, error, isAuthenticated, otpInfo, otpLoading, otpError } = useSelector(state => state.authState)
    const redirect = location.search ? new URLSearchParams(location.search).get('redirect') || '/' : '/';

    useEffect(() => {
        if (isAuthenticated) {
            navigate(redirect)
        }
    }, [isAuthenticated, navigate, redirect])

    useEffect(() => {
        if (error) {
            toast(error, {
                position: toast.POSITION.BOTTOM_CENTER,
                type: 'error',
                onOpen: () => { dispatch(clearAuthError) }
            })
        }
    }, [error, dispatch])

    useEffect(() => {
        if (otpError) {
            toast(otpError, {
                position: toast.POSITION.BOTTOM_CENTER,
                type: 'error'
            })
        }
    }, [otpError, dispatch])

    // Resend cooldown countdown.
    useEffect(() => {
        if (resendIn <= 0) return;
        const t = setInterval(() => setResendIn(s => (s > 0 ? s - 1 : 0)), 1000);
        return () => clearInterval(t);
    }, [resendIn])

    const validateSend = () => {
        const errs = {};
        if (mode === 'mobile') {
            const digits = mobile.replace(/\D/g, '');
            if (!digits) errs.mobile = 'Mobile number is required';
            else if (!/^[6-9]\d{9}$/.test(digits)) errs.mobile = 'Enter a valid 10-digit mobile number';
        } else {
            if (!email.trim()) errs.email = 'Email is required';
            else if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const sendHandler = async (e) => {
        e.preventDefault();
        if (!validateSend()) return;
        const data = await dispatch(sendOtp(mode === 'mobile' ? { mobile } : { email }))
        if (data) {
            setStep('verify')
            setResendIn(data.resendIn || 0)
        }
    }

    useEffect(() => {
        if (otpInfo) {
            setStep('verify')
            setResendIn(otpInfo.resendIn || 0)
        }
    }, [otpInfo])

    const verifyHandler = (e) => {
        e.preventDefault();
        if (!otpInfo || !otpInfo.userId) return;
        if (!/^\d{6}$/.test(otpCode)) {
            setErrors({ otp: 'Enter the 6-digit OTP' });
            return;
        }
        dispatch(verifyOtp({ userId: otpInfo.userId, otp: otpCode }))
    }

    const resendHandler = async () => {
        if (resendIn > 0) return;
        const data = await dispatch(sendOtp(mode === 'mobile' ? { mobile } : { email }))
        if (data) {
            setStep('verify')
            setResendIn(data.resendIn || 0)
        }
    }

    const backToSend = () => {
        setStep('send')
        setOtpCode('')
        setErrors({})
    }

    const toggleRemember = () => {
        setRemember(prev => {
            const next = !prev;
            try { localStorage.setItem(REMEMBER_KEY, next ? '1' : '0'); } catch { /* ignore */ }
            return next;
        });
    };

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
            <MetaData title={`Login`} />
            <section className="vc-auth" aria-label="Sign in to VijayCart">
                <div className="vc-auth-panel">
                    <span className="vc-auth-orb vc-auth-orb--1" aria-hidden="true"></span>
                    <span className="vc-auth-orb vc-auth-orb--2" aria-hidden="true"></span>
                    <span className="vc-auth-orb vc-auth-orb--3" aria-hidden="true"></span>

                    <div className="vc-auth-card">
                        <div className="vc-auth-brand">
                            <span className="vc-auth-logo"><i className="fa fa-shopping-bag" aria-hidden="true"></i></span>
                            <span className="vc-auth-name">VijayCart</span>
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 'send' ? (
                                <motion.form
                                    key="send"
                                    onSubmit={sendHandler}
                                    noValidate
                                    initial={{ opacity: 0, x: 28 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -28 }}
                                    transition={stepTransition}
                                >
                                    <h1 className="vc-title">Welcome back</h1>
                                    <p className="vc-sub">Sign in with a one-time password (OTP). No passwords to remember.</p>

                                    <div className="vc-tabs" role="tablist" aria-label="Sign in method">
                                        <button type="button" className={`vc-tab${mode === 'mobile' ? ' active' : ''}`} onClick={() => { setMode('mobile'); setErrors({}); }}>Mobile</button>
                                        <button type="button" className={`vc-tab${mode === 'email' ? ' active' : ''}`} onClick={() => { setMode('email'); setErrors({}); }}>Email</button>
                                    </div>

                                    {mode === 'mobile' ? (
                                        <div className="vc-field">
                                            <input
                                                id="login_mobile_field"
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength="10"
                                                placeholder=" "
                                                autoComplete="tel"
                                                value={mobile}
                                                onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                                            />
                                            <label htmlFor="login_mobile_field">Mobile Number</label>
                                            {errors.mobile && <p className="vc-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.mobile}</p>}
                                            <p className="vc-hint">We'll send a 6-digit OTP to your registered email.</p>
                                        </div>
                                    ) : (
                                        <div className="vc-field">
                                            <input
                                                id="login_email_field"
                                                type="email"
                                                placeholder=" "
                                                autoComplete="email"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                            />
                                            <label htmlFor="login_email_field">Email Address</label>
                                            {errors.email && <p className="vc-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.email}</p>}
                                            <p className="vc-hint">We'll send a 6-digit OTP to this email.</p>
                                        </div>
                                    )}

                                    <button type="submit" className="vc-btn" disabled={otpLoading}>
                                        {otpLoading ? <i className="fa fa-spinner fa-spin mr-2" aria-hidden="true"></i> : <i className="fa fa-paper-plane mr-2" aria-hidden="true"></i>}
                                        {otpLoading ? 'Sending OTP…' : 'Send OTP'}
                                    </button>

                                    <div className="vc-remember">
                                        <label className="vc-rem-label">
                                            <span className="vc-switch">
                                                <input type="checkbox" checked={remember} onChange={toggleRemember} />
                                                <span className="vc-slider"></span>
                                            </span>
                                            <span>Remember me on this device</span>
                                        </label>
                                    </div>

                                    <div className="vc-perks">
                                        <div className="vc-perk"><i className="fa fa-check-circle" aria-hidden="true"></i> No passwords to remember</div>
                                        <div className="vc-perk"><i className="fa fa-shield" aria-hidden="true"></i> Secure OTP delivered instantly</div>
                                    </div>
                                </motion.form>
                            ) : (
                                <motion.form
                                    key="verify"
                                    onSubmit={verifyHandler}
                                    noValidate
                                    initial={{ opacity: 0, x: 28 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -28 }}
                                    transition={stepTransition}
                                >
                                    <h1 className="vc-title">Enter OTP</h1>
                                    <p className="vc-sub">{otpInfo && otpInfo.to ? `A 6-digit OTP was sent to ${otpInfo.to}.` : 'Enter the 6-digit OTP sent to you.'}</p>

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
                                        {loading ? 'Verifying…' : 'Verify & Sign In'}
                                    </button>

                                    <div className="vc-row">
                                        <button type="button" className="vc-link" onClick={backToSend}>
                                            <i className="fa fa-chevron-left mr-1" aria-hidden="true"></i> Change number
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
