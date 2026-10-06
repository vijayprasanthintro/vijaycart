import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { clearAuthError, sendOtp, verifyOtp, googleLogin } from '../../actions/userActions';
import MetaData from '../layouts/MetaData';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import { easeOutExpo } from '../../utils/motion';
import { REMEMBER_KEY } from '../../slices/authSlice';
import axios from 'axios';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Small, professional toast popup used for all success / error messages.
// Positioning and styling come from the universal toast system in App.css.
const TOAST_STYLE = {
    position: toast.POSITION.BOTTOM_RIGHT,
    className: 'vc-toast'
};

const readRemember = () => {
    try { return localStorage.getItem(REMEMBER_KEY) !== '0'; } catch { return true; }
};

const GSI_SRC = 'https://accounts.google.com/gsi/client';

// Official Google "G" logo (Google's own multi-color mark).
const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
);

export default function Login() {
    const [mode, setMode] = useState('mobile');
    const [mobile, setMobile] = useState("")
    const [email, setEmail] = useState("")
    const [otpCode, setOtpCode] = useState("")
    const [step, setStep] = useState('send')
    const [resendIn, setResendIn] = useState(0)
    const [errors, setErrors] = useState({})
    const [remember, setRemember] = useState(readRemember)
    const [googleClientId, setGoogleClientId] = useState(null);
    const [googleReady, setGoogleReady] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const otpRefs = useRef([]);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { loading, error, isAuthenticated, otpInfo, otpLoading, otpError } = useSelector(state => state.authState)
    const redirect = location.search ? new URLSearchParams(location.search).get('redirect') || '/' : '/';

    useEffect(() => {
        if (isAuthenticated) {
            // redirect may be a bare path (e.g. "shipping" from the cart) —
            // resolve it against the app root so navigation is always absolute.
            navigate(redirect.startsWith('/') ? redirect : `/${redirect}`)
        }
    }, [isAuthenticated, navigate, redirect])

    useEffect(() => {
        if (error) {
            toast(error, {
                ...TOAST_STYLE,
                type: 'error',
                onOpen: () => { dispatch(clearAuthError) }
            })
        }
    }, [error, dispatch])

    useEffect(() => {
        if (otpError) {
            toast(otpError, {
                ...TOAST_STYLE,
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

    // "Don't have an account?" -> dedicated Sign Up page (separate route).
    const handleSignUp = () => {
        navigate('/signup');
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

    // -------- Google Sign-In --------

    // 1. Fetch the public auth config so we know whether Google is enabled and
    //    can render the official button with the right client id.
    useEffect(() => {
        let cancelled = false;
        const loadConfig = async () => {
            try {
                const { data } = await axios.get('/api/v1/auth/config');
                if (cancelled) return;
                setGoogleClientId(data?.config?.googleClientId || null);
            } catch {
                if (!cancelled) setGoogleClientId(null);
            }
        };
        loadConfig();
        return () => { cancelled = true; };
    }, []);

    // 2. Verify the ID token the browser hands back from Google.
    const handleCredentialResponse = useCallback(async (response) => {
        const credential = response && response.credential;
        if (!credential) {
            toast('Google sign-in was cancelled or failed. Please try again.', {
                ...TOAST_STYLE,
                type: 'error'
            });
            return;
        }
        setGoogleLoading(true);
        try {
            const data = await dispatch(googleLogin(credential));
            if (data) {
                // loginSuccess flips isAuthenticated and the effect above
                // navigates to `redirect`.
            }
        } finally {
            setGoogleLoading(false);
        }
    }, [dispatch]);

    // 3. Load the Google Identity Services script and initialize it. Re-runs
    //    whenever the config arrives.
    useEffect(() => {
        if (!googleClientId) {
            setGoogleReady(false);
            return;
        }
        let cancelled = false;

        const loadScript = () => new Promise((resolve, reject) => {
            if (window.google && window.google.accounts && window.google.accounts.id) return resolve();
            const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
            if (existing) {
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', () => reject(new Error('GSI load failed')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = GSI_SRC;
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error('GSI load failed'));
            document.body.appendChild(script);
        });

        loadScript()
            .then(() => {
                if (cancelled) return;
                if (window.google && window.google.accounts && window.google.accounts.id) {
                    window.google.accounts.id.initialize({
                        client_id: googleClientId,
                        callback: handleCredentialResponse,
                        auto_select: false,
                        cancel_on_tap_outside: false,
                        ux_mode: 'popup'
                    });
                    setGoogleReady(true);
                } else {
                    setGoogleReady(false);
                }
            })
            .catch(() => {
                if (!cancelled) setGoogleReady(false);
            });

        return () => { cancelled = true; };
    }, [googleClientId, handleCredentialResponse]);

    // Open the Google account chooser/popup from our own premium-styled
    // button. Selection hands the ID token to the `callback` configured in
    // initialize() above.
    const handleGoogleClick = () => {
        if (googleLoading) return;
        if (!googleReady || !googleClientId || !window.google || !window.google.accounts || !window.google.accounts.id) {
            toast.info('Google sign-in is unavailable right now. Use the Email OTP option instead.', TOAST_STYLE);
            return;
        }
        try {
            window.google.accounts.id.prompt((notification) => {
                // The chooser could not be shown at all (unsupported browser,
                // sited cookies blocked...) — fall back to email OTP.
                if (notification && notification.isNotDisplayed) {
                    toast.info('Google sign-in could not open in this browser. Use the Email OTP option instead.', TOAST_STYLE);
                }
            });
        } catch (e) {
            toast.error('Google sign-in failed to open. Please try again.', TOAST_STYLE);
        }
    };

    return (
        <Fragment>
            <MetaData title={`Login`} />
            <section className="vc-auth vc-auth--login" aria-label="Sign in to VijayCart">
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
                                    <div className="vc-login-head">
                                        <h1 className="vc-lg-title">Welcome Back</h1>
                                        <p className="vc-lg-sub">Login to your account</p>
                                    </div>

                                    <div className="vc-tabs" role="tablist" aria-label="Sign in method">
                                        <button type="button" className={`vc-tab${mode === 'mobile' ? ' active' : ''}`} onClick={() => { setMode('mobile'); setErrors({}); }}>Mobile</button>
                                        <button type="button" className={`vc-tab${mode === 'email' ? ' active' : ''}`} onClick={() => { setMode('email'); setErrors({}); }}>Email</button>
                                    </div>

                                    {mode === 'mobile' ? (
                                        <div className="vc-lg-fieldwrap">
                                            <div className="vc-lg-field">
                                                <i className="fa fa-mobile vc-lg-icon" aria-hidden="true"></i>
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
                                            </div>
                                            {errors.mobile && <p className="vc-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.mobile}</p>}
                                            <p className="vc-hint">We'll send a 6-digit OTP to your registered mobile number.</p>
                                        </div>
                                    ) : (
                                        <div className="vc-lg-fieldwrap">
                                            <div className="vc-lg-field">
                                                <i className="fa fa-envelope vc-lg-icon" aria-hidden="true"></i>
                                                <input
                                                    id="login_email_field"
                                                    type="email"
                                                    placeholder=" "
                                                    autoComplete="email"
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                />
                                                <label htmlFor="login_email_field">Email Address</label>
                                            </div>
                                            {errors.email && <p className="vc-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.email}</p>}
                                            <p className="vc-hint">We'll send a 6-digit OTP to this email address.</p>
                                        </div>
                                    )}

                                    <div className="vc-remember">
                                        <label className="vc-rem-label">
                                            <span className="vc-switch">
                                                <input type="checkbox" checked={remember} onChange={toggleRemember} />
                                                <span className="vc-slider"></span>
                                            </span>
                                            <span>Remember me on this device</span>
                                        </label>
                                    </div>

                                    <button type="submit" className="vc-btn vc-lg-login" disabled={otpLoading}>
                                        {otpLoading ? <i className="fa fa-spinner fa-spin mr-2" aria-hidden="true"></i> : <i className="fa fa-paper-plane mr-2" aria-hidden="true"></i>}
                                        {otpLoading ? 'Sending OTP…' : 'LOGIN'}
                                    </button>

                                    <p className="vc-lg-signup">
                                        Don't have an account?{' '}
                                        <button type="button" className="vc-lg-signup-link" onClick={handleSignUp}>Sign Up</button>
                                    </p>

                                    <div className="vc-divider"><span>OR</span></div>

                                    <div className="vc-google-wrap vc-lg-google">
                                        <button
                                            type="button"
                                            className="vc-google-btn vc-google-btn--gold"
                                            onClick={handleGoogleClick}
                                            disabled={googleLoading || !googleReady || !googleClientId}
                                            title={googleReady && googleClientId ? 'Continue with Google' : 'Google sign-in will be enabled shortly'}
                                        >
                                            <GoogleIcon />
                                            Continue with Google
                                            <i className="fa fa-crown vc-google-crown" aria-hidden="true"></i>
                                        </button>
                                        {googleClientId && !googleReady && (
                                            <p className="vc-google-note"><i className="fa fa-spinner fa-spin mr-1" aria-hidden="true"></i>Loading Google sign-in…</p>
                                        )}
                                        {googleLoading && (
                                            <p className="vc-google-note"><i className="fa fa-spinner fa-spin mr-1" aria-hidden="true"></i>Signing you in…</p>
                                        )}
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
                                    <div className="vc-login-head">
                                        <h1 className="vc-lg-title">Enter OTP</h1>
                                        <p className="vc-lg-sub">{otpInfo && otpInfo.to ? `A 6-digit OTP was sent to ${otpInfo.to}.` : 'Enter the 6-digit OTP sent to you.'}</p>
                                    </div>

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
