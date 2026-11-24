// Lightweight route wrapper. Kept as a stable component boundary so App.js
// routing structure stays unchanged, without animation overhead on navigation.
export default function PageTransition({ children }) {
  return <div className="page-transition">{children}</div>;
}
