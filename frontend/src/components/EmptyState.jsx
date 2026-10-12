export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty">
      {Icon && <span className="empty__icon"><Icon size={32} aria-hidden="true" /></span>}
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
