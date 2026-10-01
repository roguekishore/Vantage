import * as React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Inbox, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { ICON_STROKE, labelType } from "./styles";

/*
 * EmptyState, ErrorState, OfflineState, PageLoader.
 *
 *   <EmptyState title="No friends yet" description="..." action={<Button>Find players</Button>} />
 *   <ErrorState description={msg} onRetry={reload} />
 *   <OfflineState onRetry={reload} />     "Can't reach the Vantage API" + Retry + Open visualizers
 *   <PageLoader />                        2px indeterminate bar under the nav + LOADING_
 */

function StateBox({ icon: Icon, iconClassName, title, description, children, className, role }) {
  return (
    <div
      role={role}
      className={cn("grid justify-items-center gap-3 border border-border bg-surface px-6 py-12 text-center", className)}
    >
      {Icon ? <Icon size={20} strokeWidth={ICON_STROKE} aria-hidden="true" className={cn("text-fg-muted", iconClassName)} /> : null}
      {title ? <h2 className="font-mono text-h3 text-fg">{title}</h2> : null}
      {description ? <p className="max-w-[48ch] font-mono text-body text-fg-muted">{description}</p> : null}
      {children ? <div className="mt-2 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  );
}

export function EmptyState({ icon = Inbox, title, description, action, className }) {
  return (
    <StateBox icon={icon} title={title} description={description} className={className}>
      {action}
    </StateBox>
  );
}

export function ErrorState({ title = "Something went wrong", description, onRetry, action, className }) {
  return (
    <StateBox icon={AlertTriangle} iconClassName="text-err" title={title} description={description} className={className} role="alert">
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
      {action}
    </StateBox>
  );
}

export function OfflineState({
  title = "Can't reach the Vantage API",
  description = "The server is not responding, so this page can't load its data. Check your connection and retry. The visualizers run in your browser and keep working offline.",
  onRetry,
  visualizersHref = "/visualizers",
  className,
}) {
  return (
    <StateBox icon={WifiOff} iconClassName="text-warn" title={title} description={description} className={className} role="alert">
      {onRetry ? (
        <Button variant="primary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
      <Button variant="secondary" asChild>
        <Link to={visualizersHref}>Open visualizers</Link>
      </Button>
    </StateBox>
  );
}

export function PageLoader({ label = "LOADING_", className }) {
  return (
    <div role="status" aria-live="polite" className={cn("min-h-[50vh]", className)}>
      <div aria-hidden="true" className="fixed inset-x-0 top-[var(--nav-h)] z-nav h-0.5 overflow-hidden">
        <span className="block h-full w-2/5 animate-ds-indeterminate bg-accent-ink" />
      </div>
      <div className="px-[var(--gutter)] pt-[calc(var(--nav-h)+32px)]">
        <div className={cn("mx-auto w-full max-w-[var(--container)] text-fg-muted", labelType)}>{label}</div>
      </div>
    </div>
  );
}
