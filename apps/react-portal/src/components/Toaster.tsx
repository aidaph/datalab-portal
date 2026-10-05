import { useToasts } from "../hooks/useToasts";

const TONE_ICON: Record<string, string> = {
  success: "✓",
  error: "!",
  info: "i"
};

export function Toaster() {
  const { toasts, dismissToast } = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.tone}`}>
          <span className="toast-icon" aria-hidden="true">
            {TONE_ICON[toast.tone]}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button type="button" className="toast-dismiss" aria-label="Dismiss notification" onClick={() => dismissToast(toast.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
