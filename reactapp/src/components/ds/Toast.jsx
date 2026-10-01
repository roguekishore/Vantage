import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./IconButton";
import { labelType } from "./styles";

/*
 * Toast: one <Toaster /> region (mounted once in
 * App.jsx), fed by a tiny module store (no dependency).
 *
 *   import { toast } from "@/components/ds";
 *   toast({ tone: "ok", title: "Saved", description: "Your solution was submitted." });
 *   const id = toast({ tone: "err", title: "Failed", duration: 0 });  // 0 = sticky
 *   toast.dismiss(id);
 *
 *   tone  info (default) | ok | err. err toasts are role="alert"; the rest
 *         announce politely. Square --surface card with a 2px tone rule on
 *         the left, no shadow, no animation.
 */

let toasts = [];
let nextId = 1;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const timers = new Map();

function dismiss(id) {
  clearTimeout(timers.get(id));
  timers.delete(id);
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function toast({ tone = "info", title, description, duration = 5000 } = {}) {
  const id = nextId++;
  toasts = [...toasts, { id, tone, title, description }].slice(-4);
  emit();
  if (duration > 0) timers.set(id, setTimeout(() => dismiss(id), duration));
  return id;
}
toast.dismiss = dismiss;

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const snapshot = () => toasts;

const TONE = {
  info: { bar: "border-l-info", label: "text-info", name: "Info" },
  ok: { bar: "border-l-ok", label: "text-ok", name: "Done" },
  err: { bar: "border-l-err", label: "text-err", name: "Error" },
};

export function ToastCard({ tone = "info", title, description, onDismiss, className }) {
  const t = TONE[tone] || TONE.info;
  return (
    <div
      role={tone === "err" ? "alert" : "status"}
      className={cn("flex items-start gap-3 border border-l-2 border-border-strong bg-surface p-3 text-fg", t.bar, className)}
    >
      <div className="grid min-w-0 flex-1 gap-1">
        <div className={cn(labelType, t.label)}>{t.name}</div>
        {title ? <div className="font-mono text-small font-bold text-fg">{title}</div> : null}
        {description ? <div className="font-mono text-small text-fg-muted">{description}</div> : null}
      </div>
      {onDismiss ? <IconButton icon={X} size="sm" aria-label="Dismiss notification" onClick={onDismiss} /> : null}
    </div>
  );
}

export function Toaster() {
  const items = React.useSyncExternalStore(subscribe, snapshot, snapshot);
  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-toast grid w-[min(calc(100vw-32px),360px)] gap-2"
    >
      {items.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastCard tone={t.tone} title={t.title} description={t.description} onDismiss={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}
