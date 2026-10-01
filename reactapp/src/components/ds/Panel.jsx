import * as React from "react";
import { cn } from "@/lib/utils";
import { colorTransition, focusRing, labelType } from "./styles";

/*
 * Panel: flat --surface box, 1px border, no shadow,
 * no traffic-light dots.
 *
 *   variant  default | inset (--bg, for a panel inside a panel) |
 *            interactive (border → --border-strong on hover, focus ring) |
 *            accent (1px --accent-ink border)
 *   label    optional header row: Mono label on the left, `actions` right
 *   padded   body padding 16px (default true; false for flush tables)
 *   as       element or component (e.g. "section", "button", Link)
 */
const VARIANTS = {
  default: "bg-surface border-border",
  inset: "bg-bg border-border",
  interactive: cn("bg-surface border-border cursor-pointer text-left", colorTransition, focusRing, "ds-hover:border-border-strong"),
  accent: "bg-surface border-accent-ink",
};

export const Panel = React.forwardRef(function Panel(
  { as: Comp = "div", variant = "default", label, actions, padded = true, className, bodyClassName, children, ...props },
  ref
) {
  const autoId = React.useId();
  const labelId = label ? `ds-panel${autoId.replace(/:/g, "")}` : undefined;
  const hasHeader = Boolean(label || actions);
  return (
    <Comp
      ref={ref}
      aria-labelledby={Comp === "section" && labelId ? labelId : undefined}
      className={cn("block border text-fg", VARIANTS[variant] || VARIANTS.default, className)}
      {...props}
    >
      {hasHeader ? (
        <div className="flex min-h-10 items-center justify-between gap-3 border-b border-border px-4 py-2">
          {label ? (
            <div id={labelId} className={cn(labelType, "text-fg-muted")}>
              {label}
            </div>
          ) : (
            <span />
          )}
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {hasHeader || padded ? <div className={cn(padded && "p-4", bodyClassName)}>{children}</div> : children}
    </Comp>
  );
});
