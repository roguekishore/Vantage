import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

/*
 * Popover (POLISH_PLAN §3.8) on @radix-ui/react-popover. Opaque --surface,
 * 1px --border-strong, z-modal (so it also works from inside a Dialog).
 *
 *   <Popover><PopoverTrigger asChild><Button>Filters</Button></PopoverTrigger>
 *     <PopoverContent>...</PopoverContent></Popover>
 */
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

export const PopoverContent = React.forwardRef(function PopoverContent(
  { className, align = "start", sideOffset = 4, ...props },
  ref
) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-modal w-72 max-w-[calc(100vw-32px)] border border-border-strong bg-surface p-4 font-mono text-small text-fg outline-none",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
