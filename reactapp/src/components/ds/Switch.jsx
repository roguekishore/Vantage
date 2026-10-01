import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";
import { MaybeField, useFieldControlProps } from "./Field";
import { colorTransition, focusRing } from "./styles";

/*
 * Switch on @radix-ui/react-switch. Square track
 * and square thumb; on = accent fill + --accent-edge, thumb --on-accent.
 * Space toggles (Radix).
 *
 *   <Switch label="Sound" checked={on} onCheckedChange={setOn} />
 */
export const Switch = React.forwardRef(function Switch({ label, hint, error, className, fieldClassName, ...props }, ref) {
  return (
    <MaybeField
      name="Switch"
      layout="inline"
      label={label}
      hint={hint}
      error={error}
      required={props.required}
      disabled={props.disabled}
      id={props.id}
      className={fieldClassName}
      ariaLabelled={Boolean(props["aria-label"] || props["aria-labelledby"])}
    >
      <SwitchControl ref={ref} className={className} {...props} />
    </MaybeField>
  );
});

const SwitchControl = React.forwardRef(function SwitchControl({ className, ...props }, ref) {
  const wiring = useFieldControlProps(props);
  return (
    <SwitchPrimitive.Root
      ref={ref}
      {...props}
      {...wiring}
      className={cn(
        "inline-flex h-5 w-9 shrink-0 items-center border border-border-strong bg-elevated p-0.5",
        colorTransition,
        focusRing,
        "ds-hover:border-fg",
        "data-[state=checked]:border-accent-edge data-[state=checked]:bg-accent",
        "aria-[invalid=true]:border-err",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "block size-3.5 bg-fg-muted transition-transform duration-[120ms] ease-out",
          "data-[state=checked]:translate-x-4 data-[state=checked]:bg-on-accent"
        )}
      />
    </SwitchPrimitive.Root>
  );
});
