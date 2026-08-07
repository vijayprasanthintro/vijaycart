import { motion } from 'framer-motion';
import { easeOutExpo } from '../../utils/motion';

const STEPS = [
    { key: 'account', icon: 'fa-user', label: 'Account' },
    { key: 'shipping', icon: 'fa-location-dot', label: 'Address' },
    { key: 'confirmOrder', icon: 'fa-file-lines', label: 'Summary' },
    { key: 'payment', icon: 'fa-credit-card', label: 'Payment' },
    { key: 'confirmation', icon: 'fa-circle-check', label: 'Confirmation' },
];

export default function CheckoutSteps({ shipping, confirmOrder, payment, confirmation }) {
    const activeIndex = confirmation ? 4 : payment ? 3 : confirmOrder ? 2 : shipping ? 1 : 0;
    const progress = Math.round((activeIndex / (STEPS.length - 1)) * 100);

    return (
        <div className="ck-steps" aria-label="Checkout progress">
            <div className="ck-track" aria-hidden="true">
                <motion.div
                    className="ck-fill"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.7, ease: easeOutExpo }}
                ></motion.div>
            </div>
            {STEPS.map((step, idx) => {
                const state = idx < activeIndex ? 'done' : idx === activeIndex ? 'active' : 'future';
                return (
                    <motion.div
                        key={step.key}
                        className={`ck-step ${state}`}
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, ease: easeOutExpo, delay: 0.1 + idx * 0.07 }}
                    >
                        <div className="ck-step-ico">
                            {state === 'done'
                                ? <i className="fa fa-check" aria-hidden="true"></i>
                                : <i className={`fa ${step.icon}`} aria-hidden="true"></i>}
                        </div>
                        <span className="ck-step-label">{step.label}</span>
                    </motion.div>
                );
            })}
        </div>
    )
}
