import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";
import { labelType } from "./styles";

/*
 * Stat, Progress, Avatar, Skeleton.
 *
 *   <Stat label="Solved" value="128" delta="+12" />     Mono 700 value, no rings/donuts
 *   <Progress value={40} label="Topic progress" />      4px --accent on --elevated (+ --accent-edge)
 *   <Progress label="Loading" />                        no value = indeterminate
 *   <Avatar name="Ada Lovelace" src={url} size="md" />  square, initials fallback
 *   <Skeleton className="h-4 w-32" />                   static --elevated block
 */
const DELTA_TONE = { ok: "text-ok", err: "text-err", neutral: "text-fg-muted" };

export function Stat({ label, value, delta, deltaTone, hint, size = "md", className }) {
  const negative = (typeof delta === "number" && delta < 0) || (typeof delta === "string" && /^\s*[-\u2212]/.test(delta));
  const tone = deltaTone || (delta === undefined || delta === null ? "neutral" : negative ? "err" : "ok");
  return (
    <div className={cn("grid gap-1", className)}>
      <div className={cn(labelType, "text-fg-muted")}>{label}</div>
      <div className="flex items-baseline gap-3">
        <div className={cn("font-mono tabular-nums text-fg", size === "lg" ? "text-h1" : "text-h2", "font-bold")}>{value}</div>
        {delta !== undefined && delta !== null ? (
          <div className={cn("font-mono text-small tabular-nums", DELTA_TONE[tone] || DELTA_TONE.neutral)}>{delta}</div>
        ) : null}
      </div>
      {hint ? <div className="font-mono text-small text-fg-muted">{hint}</div> : null}
    </div>
  );
}

export const Progress = React.forwardRef(function Progress({ value, max = 100, label, className, ...props }, ref) {
  const indeterminate = value === undefined || value === null;
  const pct = indeterminate ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={indeterminate ? null : value}
      max={max}
      aria-label={label}
      className={cn("relative h-1 w-full overflow-hidden bg-elevated", className)}
      {...props}
    >
      {indeterminate ? (
        <span className="block h-full w-2/5 animate-ds-indeterminate border border-accent-edge bg-accent" />
      ) : (
        <ProgressPrimitive.Indicator
          className={cn("h-full bg-accent", pct > 0 && "border border-accent-edge")}
          style={{ width: `${pct}%` }}
        />
      )}
    </ProgressPrimitive.Root>
  );
});

const AVATAR_SIZES = { sm: "size-7 text-micro", md: "size-9 text-label", lg: "size-11 text-label" };

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] || "")
    .join("")
    .toUpperCase() || "?";

export function Avatar({ name, src, size = "md", className, alt }) {
  const [failed, setFailed] = React.useState(false);
  const showImg = src && !failed;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden border border-border bg-elevated font-mono uppercase text-fg-muted",
        AVATAR_SIZES[size] || AVATAR_SIZES.md,
        className
      )}
      title={name}
    >
      {showImg ? (
        <img src={src} alt={alt ?? name ?? ""} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span aria-label={name} role={name ? "img" : undefined}>
          {initialsOf(name)}
        </span>
      )}
    </span>
  );
}

export function Skeleton({ className, ...props }) {
  return <span aria-hidden="true" className={cn("block h-4 w-full bg-elevated", className)} {...props} />;
}
