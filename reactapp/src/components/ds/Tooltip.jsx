import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

/*
 * Tooltip on @radix-ui/react-tooltip. An inverted
 * chip (fg fill, bg text) at z-tooltip. <TooltipProvider> is mounted once in
 * App.jsx.
 *
 *   <Tooltip content="Switch theme"><IconButton icon={Sun} aria-label="Switch theme" /></Tooltip>
 */
export const TooltipProvider = ({ delayDuration = 300, ...props }) => (
  <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
);
export const TooltipRoot = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef(function TooltipContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn("z-tooltip max-w-xs bg-fg px-2 py-1 font-mono text-small text-bg", className)}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});

export function Tooltip({ content, side = "top", align = "center", children, ...rootProps }) {
  if (!content) return children;
  return (
    <TooltipPrimitive.Root {...rootProps}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipContent side={side} align={align}>
        {content}
      </TooltipContent>
    </TooltipPrimitive.Root>
  );
}
