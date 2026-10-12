/** Accessible progress bar. `tone` is auto-picked from fill when omitted (warn >= 75%, full = 100%). */
export default function ProgressBar({ value, max = 100, label, tone }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const auto = pct >= 100 ? 'full' : pct >= 75 ? 'warn' : '';
  const t = tone ?? auto;
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
      <div className={`progress__bar ${t ? `progress__bar--${t}` : ''}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
