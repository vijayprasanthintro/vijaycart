import { motion } from 'framer-motion';
import { pageVariants } from '../../utils/motion';

// Thin wrapper used by the animated router: fades each route in/out on
// navigation while preserving every component's own layout and logic.
export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
