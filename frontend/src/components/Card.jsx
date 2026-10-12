export default function Card({ as: Tag = 'div', interactive = false, flush = false, className = '', children, ...rest }) {
  const cls = ['card', interactive && 'card--interactive', flush && 'card--flush', className].filter(Boolean).join(' ');
  return <Tag className={cls} {...rest}>{children}</Tag>;
}
