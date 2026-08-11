import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-toastify';

const EASE = [0.16, 1, 0.3, 1];

const SHEET_VARIANTS = {
    hidden: { opacity: 0, y: 80 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 80 }
};

export default function ShareSheet({ open, onClose, title = '', text = '', url = '' }) {
    const [copied, setCopied] = useState(false);

    // Lock body scroll while the sheet is open (mobile bottom sheets).
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    const copyLink = async () => {
        const value = url || window.location.href;
        try {
            await navigator.clipboard.writeText(value);
        } catch (e) {
            const ta = document.createElement('textarea');
            ta.value = value;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (err) { /* ignore */ }
            document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast('Link copied to clipboard', { type: 'success', position: toast.POSITION.BOTTOM_CENTER });
    };

    const shareLink = (targetUrl) => {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
        onClose();
    };

    const shareText = text || title;
    const shareUrl = url || window.location.href;

    const actions = [
        {
            key: 'copy',
            icon: 'fa fa-link',
            label: 'Copy Link',
            accent: '#607d8b',
            onClick: copyLink,
            extra: copied ? 'fa fa-check' : null
        },
        {
            key: 'whatsapp',
            icon: 'fa fa-whatsapp',
            label: 'WhatsApp',
            accent: '#25d366',
            onClick: () => shareLink(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`)
        },
        {
            key: 'telegram',
            icon: 'fa fa-telegram',
            label: 'Telegram',
            accent: '#229ed9',
            onClick: () => shareLink(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`)
        },
        {
            key: 'gmail',
            icon: 'fa fa-envelope',
            label: 'Gmail',
            accent: '#ea4335',
            onClick: () => shareLink(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`)
        },
        {
            key: 'x',
            icon: 'fa fa-twitter',
            label: 'X (Twitter)',
            accent: '#111111',
            onClick: () => shareLink(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`)
        }
    ];

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="share-sheet-root" role="dialog" aria-modal="true" aria-label="Share product">
                    <motion.div
                        className="share-sheet-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                    ></motion.div>
                    <motion.div
                        className="share-sheet"
                        variants={SHEET_VARIANTS}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.35, ease: EASE }}
                    >
                        <div className="share-sheet-handle" aria-hidden="true"></div>
                        <div className="share-sheet-head">
                            <h3>Share this product</h3>
                            <button type="button" className="share-sheet-close" onClick={onClose} aria-label="Close share menu">
                                <i className="fa fa-times" aria-hidden="true"></i>
                            </button>
                        </div>
                        <p className="share-sheet-text" title={title}>{shareText}</p>
                        <div className="share-sheet-grid">
                            {actions.map(a => (
                                <button
                                    key={a.key}
                                    type="button"
                                    className="share-sheet-item"
                                    onClick={a.onClick}
                                    aria-label={a.label}
                                >
                                    <span className="share-sheet-icon" style={{ background: `${a.accent}1f`, color: a.accent }}>
                                        <i className={a.extra || a.icon} aria-hidden="true"></i>
                                    </span>
                                    <span className="share-sheet-label">{a.key === 'copy' && copied ? 'Copied!' : a.label}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
