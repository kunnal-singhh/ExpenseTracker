import { useCallback, useMemo, useState } from "react";
import { ToastContext } from "./toastContext";

const icons = {
  success: "fa-circle-check",
  error: "fa-circle-exclamation",
  info: "fa-circle-info",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = "info") => {
    const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => removeToast(id), 3200);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`app-toast ${toast.type}`}>
            <i className={`fa-solid ${icons[toast.type] || icons.info}`} />
            <span>{toast.message}</span>
            <button type="button" aria-label="Dismiss notification" onClick={() => removeToast(toast.id)}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
