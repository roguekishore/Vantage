import { X } from "lucide-react";

export default function AppToast({
  message,
  onDismiss,
  className = "",
  messageClassName = "",
  dismissButtonClassName = "",
  dismissLabel = "Dismiss",
}) {
  if (!message) return null;

  return (
    <div className={className}>
      <div className="flex items-start gap-2.5">
        <p className={messageClassName}>{message}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={dismissButtonClassName}
            aria-label={dismissLabel}
            title={dismissLabel}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
