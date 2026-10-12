import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, error: CircleAlert, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, message, duration = 4500) => {
      const id = ++nextId.current;
      setToasts((list) => [...list, { id, type, message }]);
      if (duration) setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m, 7000),
      info: (m) => push('info', m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" role="region" aria-label="Notifications" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div key={t.id} className={`toast toast--${t.type}`}>
              <Icon className="toast__icon" size={20} aria-hidden="true" />
              <span className="toast__msg">{t.message}</span>
              <button type="button" className="icon-btn" style={{ width: 32, height: 32 }} aria-label="Dismiss notification" onClick={() => dismiss(t.id)}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
