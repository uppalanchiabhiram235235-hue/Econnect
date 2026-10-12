import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/** variant: primary | accent | outline | ghost | danger. Pass `to` to render a router link. */
export default function Button({
  variant = 'primary', size = 'md', loading = false, icon: Icon, to, block = false,
  className = '', children, disabled, type = 'button', ...rest
}) {
  const cls = ['btn', `btn--${variant}`, size !== 'md' && `btn--${size}`, block && 'btn--block', className]
    .filter(Boolean).join(' ');
  const content = (
    <>
      {loading ? <Loader2 className="spin" size={18} aria-hidden="true" /> : Icon && <Icon size={18} aria-hidden="true" />}
      <span>{children}</span>
    </>
  );
  if (to) return <Link to={to} className={cls} {...rest}>{content}</Link>;
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
}
