import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MaybeField, useFieldControlProps } from "./Field";
import { colorTransition, focusRing, ICON_STROKE } from "./styles";

/*
 * Checkbox on @radix-ui/react-checkbox. Square 20px box;
 * checked is an accent fill with the 1px --accent-edge (§3.1). Space
 * toggles (Radix). `checked` may be true | false | "indeterminate".
 *
 *   <Checkbox label="Remember me" checked={v} onCheckedChange={setV} />
 */
export const Checkbox = React.forwardRef(function Checkbox(
  { label, hint, error, className, fieldClassName, ...props },
  ref
) {
  return (
    <MaybeField
      name="Checkbox"
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
      <CheckboxControl ref={ref} className={className} {...props} />
    </MaybeField>
  );
});

const CheckboxControl = React.forwardRef(function CheckboxControl({ className, ...props }, ref) {
  const wiring = useFieldControlProps(props);
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      {...props}
      {...wiring}
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center border border-border-strong bg-elevated text-on-accent",
        colorTransition,
        focusRing,
        "ds-hover:border-fg",
        "data-[state=checked]:border-accent-edge data-[state=checked]:bg-accent",
        "data-[state=indeterminate]:border-accent-edge data-[state=indeterminate]:bg-accent",
        "aria-[invalid=true]:border-err",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      <CheckboxPrimitive.Indicator className="inline-flex items-center justify-center">
        {props.checked === "indeterminate" ? (
          <Minus size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
        ) : (
          <Check size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
