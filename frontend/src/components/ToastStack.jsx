import React from "react";

export default function ToastStack({ toasts, onRemove }) {
  return (
    <div className="toast-stack" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.variant}`}>
          <strong>{toast.title}</strong>
          {toast.message ? <p>{toast.message}</p> : <p className="sr-only">Notification</p>}
          <div className="toast-progress" aria-hidden="true">
            <span style={{ animationDuration: `${toast.timeoutMs}ms` }} />
          </div>
          <button type="button" className="toast-close" onClick={() => onRemove(toast.id)} aria-label="Dismiss">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

