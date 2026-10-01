import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { colorTransition, focusRing, labelType } from "./styles";

/*
 * Button.
 *
 *   variant  primary | secondary (default) | ghost | danger | link
 *   size     sm 28px | md 36px (default) | lg 44px
 *   iconOnly square button (use IconButton, which requires aria-label)
 *   loading  2px indeterminate bar along the bottom edge; sets aria-busy and
 *            aria-disabled, swallows clicks, keeps the label so the width
 *            never changes. Never a spinner.
 *   asChild  render the single child (e.g. a react-router <Link>) with the
 *            button look (Radix Slot).
 *
 * Hover inverts the colours (120ms colour transition, no scale/translate).
 * Every accent fill draws a 1px --accent-edge border (§3.1): invisible in
 * dark, a black edge in light.
 */

const VARIANTS = {
  primary:
    "bg-accent text-on-accent border-accent-edge ds-hover:bg-on-accent ds-hover:text-accent",
  secondary:
    "bg-transparent text-fg border-border-strong ds-hover:bg-fg ds-hover:text-bg ds-hover:border-fg",
  ghost:
    "bg-transparent text-fg border-transparent ds-hover:bg-fg ds-hover:text-bg ds-hover:border-fg",
  danger:
    "bg-transparent text-err border-err ds-hover:bg-err ds-hover:text-bg",
  link:
    "border-transparent bg-transparent text-accent-ink underline decoration-1 underline-offset-4 ds-hover:text-fg",
};

const SIZES = {
  sm: "h-7 px-3 gap-2 [&_svg]:size-3.5",
  md: "h-9 px-4 gap-2 [&_svg]:size-4",
  lg: "h-11 px-6 gap-2 [&_svg]:size-5",
};

const ICON_ONLY = { sm: "w-7 px-0", md: "w-9 px-0", lg: "w-11 px-0" };

export function buttonClasses({ variant = "secondary", size = "md", iconOnly = false, className } = {}) {
  return cn(
    "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden whitespace-nowrap border",
    labelType,
    colorTransition,
    focusRing,
    "disabled:cursor-not-allowed disabled:opacity-50 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
    "aria-busy:cursor-progress",
    "[&_svg]:shrink-0 [&_svg]:[stroke-width:1.5]",
    VARIANTS[variant] || VARIANTS.secondary,
    SIZES[size] || SIZES.md,
    iconOnly && (ICON_ONLY[size] || ICON_ONLY.md),
    variant === "link" && "h-auto px-0",
    className
  );
}

function LoadingBar() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
      <span className="block h-full w-2/5 animate-ds-indeterminate bg-current" />
    </span>
  );
}

export const Button = React.forwardRef(function Button(
  {
    variant = "secondary",
    size = "md",
    iconOnly = false,
    loading = false,
    asChild = false,
    disabled = false,
    type,
    className,
    children,
    onClick,
    ...props
  },
  ref
) {
  const Comp = asChild ? Slot : "button";

  const handleClick = (event) => {
    if (loading || (asChild && disabled)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.(event);
  };

  const stateProps = asChild
    ? // <a>/<Link> cannot be :disabled; mirror the state with ARIA + data attrs.
      disabled
      ? { "aria-disabled": true, "data-disabled": "", tabIndex: -1 }
      : {}
    : { type: type || "button", disabled };

  return (
    <Comp
      ref={ref}
      className={buttonClasses({ variant, size, iconOnly, className })}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      data-loading={loading ? "" : undefined}
      onClick={handleClick}
      {...stateProps}
      {...props}
    >
      {asChild ? <Slottable>{children}</Slottable> : children}
      {loading ? <LoadingBar /> : null}
    </Comp>
  );
});
