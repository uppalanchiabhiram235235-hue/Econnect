// Date / time / number formatting helpers (vanilla JS, no dependencies).
export function formatDate(iso, options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, options);
}

export function formatTime(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export const formatTimeRange = (start, end) => `${formatTime(start)} – ${formatTime(end)}`;

export const formatNumber = (n) => new Intl.NumberFormat().format(n ?? 0);

export function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

/** "Today", "Tomorrow", "In 5 days" or "3 days ago" for a yyyy-mm-dd date. */
export function relativeDay(iso) {
  if (!iso) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(`${iso}T00:00:00`) - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return diff > 0 ? `In ${diff} days` : `${-diff} days ago`;
}

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';

export function relativeTime(iso) {
  if (!iso) return '';
  const now = Date.now();
  const past = new Date(iso).getTime();
  const diffSec = Math.floor((now - past) / 1000);
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return formatDateTime(iso);
}

