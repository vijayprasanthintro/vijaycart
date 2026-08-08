import { Fragment, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { clearAuthError, sendOtp, verifyOtp } from '../../actions/userActions';
import MetaData from '../layouts/MetaData';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { easeOutExpo } from '../../utils/motion';

export default function DeliveryLogin() {
    const [mobile, setMobile] = useState("")
    const [otpCode, setOtpCode] = useState("")
    const [step, setStep] = useState('send')
    const [resendIn, setResendIn] = useState(0)
    const [errors, setErrors] = useState({})
    const otpRefs = useRef([]);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading, error, isAuthenticated, user, otpInfo, otpLoading, otpError } = useSelector(state => state.authState)

    const validateSend = () => {
        const errs = {};
        const digits = mobile.replace(/\D/g, '');
        if (!digits) errs.mobile = 'Mobile number is required';
        else if (!/^[6-9]\d{9}$/.test(digits)) errs.mobile = 'Enter a valid 10-digit mobile number';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const sendHandler = async (e) => {
        e.preventDefault();
        if (!validateSend()) return;
        const data = await dispatch(sendOtp({ mobile, purpose: 'delivery' }))
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
        dispatch(verifyOtp({ userId: otpInfo.userId, otp: otpCode, purpose: 'delivery' }))
    }

    const resendHandler = async () => {
        if (resendIn > 0) return;
        const data = await dispatch(sendOtp({ mobile, purpose: 'delivery' }))
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

    // Resend cooldown countdown.
    useEffect(() => {
        if (resendIn <= 0) return;
        const t = setInterval(() => setResendIn(s => (s > 0 ? s - 1 : 0)), 1000);
        return () => clearInterval(t);
    }, [resendIn])

    useEffect(() => {
        if (isAuthenticated) {
            if (user && user.role === 'deliveryboy') {
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

    useEffect(() => {
        if (otpError) {
            toast(otpError, {
                position: toast.POSITION.BOTTOM_CENTER,
                type: 'error'
            })
        }
    }, [otpError, dispatch])

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
            <MetaData title={`Delivery Partner Login`} />
            <section className="vc-auth" aria-label="Delivery partner sign in">
                <div className="vc-auth-panel">
                    <span className="vc-auth-orb vc-auth-orb--1" aria-hidden="true"></span>
                    <span className="vc-auth-orb vc-auth-orb--2" aria-hidden="true"></span>
                    <span className="vc-auth-orb vc-auth-orb--3" aria-hidden="true"></span>

                    <div className="vc-auth-card">
                        <div className="vc-auth-brand">
                            <span className="vc-auth-logo"><i className="fa fa-motorcycle" aria-hidden="true"></i></span>
                            <span className="vc-auth-name">Delivery Partner</span>
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
                                    <h1 className="vc-title">Partner sign in</h1>
                                    <p className="vc-sub">Sign in with a one-time password (OTP) to access delivery orders.</p>

                                    <div className="vc-field">
                                        <input
                                            id="delivery_mobile_field"
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength="10"
                                            placeholder=" "
                                            autoComplete="tel"
                                            value={mobile}
                                            onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                                        />
                                        <label htmlFor="delivery_mobile_field">Mobile Number</label>
                                        {errors.mobile && <p className="vc-error"><i className="fa fa-exclamation-circle mr-1" aria-hidden="true"></i>{errors.mobile}</p>}
                                        <p className="vc-hint">We'll send a 6-digit OTP to your registered email.</p>
                                    </div>

                                    <button type="submit" className="vc-btn" disabled={otpLoading}>
                                        {otpLoading ? <i className="fa fa-spinner fa-spin mr-2" aria-hidden="true"></i> : <i className="fa fa-paper-plane mr-2" aria-hidden="true"></i>}
                                        {otpLoading ? 'Sending OTP…' : 'Send OTP'}
                                    </button>

                                    <div className="vc-row">
                                        <Link to="/" className="vc-back-link"><i className="fa fa-arrow-left mr-1" aria-hidden="true"></i> Back to VijayCart</Link>
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
