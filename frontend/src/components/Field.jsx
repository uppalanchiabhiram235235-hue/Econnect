import { Children, cloneElement, isValidElement, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/** Label + control + hint/error. The single child control receives id and aria attributes automatically. */
export default function Field({ label, hint, error, children }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const child = Children.only(children);
  const control = isValidElement(child)
    ? cloneElement(child, { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })
    : child;
  return (
    <div className={`field ${error ? 'field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {control}
      {error ? <p className="field__error" id={`${id}-error`} role="alert">{error}</p>
        : hint && <p className="field__hint" id={`${id}-hint`}>{hint}</p>}
    </div>
  );
}

export function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password">
      <input className="input" type={visible ? 'text' : 'password'} {...props} />
      <button type="button" className="icon-btn" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible((v) => !v)}>
        {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </div>
  );
}
