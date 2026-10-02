import * as React from "react";
import { cn } from "@/lib/utils";
import { microType } from "./styles";

/*
 * Kbd (POLISH_PLAN §3.8): keyboard hint chip. <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>
 */
export const Kbd = React.forwardRef(function Kbd({ className, ...props }, ref) {
  return (
    <kbd
      ref={ref}
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center border border-border-strong bg-elevated px-1 text-fg-muted",
        microType,
        className
      )}
      {...props}
    />
  );
});
