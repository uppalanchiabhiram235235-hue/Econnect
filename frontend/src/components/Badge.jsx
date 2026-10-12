/** tone: neutral | success | warning | danger | info | eco. Pass `hue` for event-type tags. */
export default function Badge({ tone = 'neutral', hue, icon: Icon, children }) {
  const cls = hue ? 'badge badge--type' : `badge ${tone !== 'neutral' ? `badge--${tone}` : ''}`;
  return (
    <span className={cls} style={hue ? { '--badge-hue': hue } : undefined}>
      {Icon && <Icon size={14} aria-hidden="true" />}
      {children}
    </span>
  );
}
