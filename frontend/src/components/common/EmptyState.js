// Reusable empty state block used by product/search/order pages.
export default function EmptyState({ icon = 'fa-box-open', title, subtitle, action }) {
  return (
    <div className="empty-state mt-4">
      <div className="empty-icon"><i className={`fa ${icon}`} aria-hidden="true"></i></div>
      <h2 className="empty-title">{title}</h2>
      {subtitle && <p className="empty-sub">{subtitle}</p>}
      {action}
    </div>
  );
}
