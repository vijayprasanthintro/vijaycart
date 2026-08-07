// Shared Framer Motion presets for the VijayCart premium UI.
// Keep every preset small and subtle so the site still feels fast and native.

export const easeOutExpo = [0.16, 1, 0.3, 1];

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.45, ease: easeOutExpo } },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOutExpo } },
};

export const fadeDown = {
  hidden: { opacity: 0, y: -16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOutExpo } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: easeOutExpo } },
};

export const slideUpSoft = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeOutExpo } },
};

// Container that staggers its children (use with "stagger" child variants)
export const staggerContainer = (stagger = 0.06, delayChildren = 0.08) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

// Page transition used by the animated router wrapper
export const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: easeOutExpo } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease: 'easeIn' } },
};
