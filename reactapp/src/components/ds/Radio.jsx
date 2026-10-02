import * as React from "react";
import * as RadioPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";
import { MaybeField, useField } from "./Field";
import { colorTransition, focusRing } from "./styles";

/*
 * RadioGroup + Radio (POLISH_PLAN §3.4, §3.8) on @radix-ui/react-radio-group.
 * Arrow keys move and select, Tab enters and leaves the group (Radix).
 * The radio circle and its dot are the only data-shape="round" in ds/*
 * (§3.4 exception 2), so radios stay distinct from square checkboxes.
 *
 *   <RadioGroup label="Mode" value={m} onValueChange={setM}>
 *     <Radio value="duel" label="Duel" />
 *     <Radio value="ffa" label="Free for all" />
 *   </RadioGroup>
 */
export const RadioGroup = React.forwardRef(function RadioGroup(
  { label, hint, error, className, fieldClassName, orientation = "vertical", children, ...props },
  ref
) {
  return (
    <MaybeField
      name="RadioGroup"
      label={label}
      hint={hint}
      error={error}
      required={props.required}
      disabled={props.disabled}
      id={props.id}
      className={fieldClassName}
      ariaLabelled={Boolean(props["aria-label"] || props["aria-labelledby"])}
    >
      <RadioGroupControl ref={ref} className={className} orientation={orientation} {...props}>
        {children}
      </RadioGroupControl>
    </MaybeField>
  );
});

const RadioGroupControl = React.forwardRef(function RadioGroupControl({ className, orientation, id, ...props }, ref) {
  // The group itself is not labelable; Field renders its label with an id
  // and the group reads it through aria-labelledby.
  const field = useField();
  const describedBy = [field?.describedBy, props["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  return (
    <RadioPrimitive.Root
      ref={ref}
      id={id ?? field?.id}
      orientation={orientation}
      aria-labelledby={props["aria-labelledby"] ?? field?.labelId}
      aria-describedby={describedBy}
      aria-invalid={props["aria-invalid"] ?? (field?.invalid ? true : undefined)}
      required={props.required ?? field?.required}
      disabled={props.disabled ?? field?.disabled}
      {...props}
      className={cn(orientation === "horizontal" ? "flex flex-wrap gap-x-6 gap-y-2" : "grid gap-2", className)}
    />
  );
});

export const Radio = React.forwardRef(function Radio({ label, className, id, value, ...props }, ref) {
  const autoId = React.useId();
  const itemId = id || `ds-radio${autoId.replace(/:/g, "")}`;
  return (
    <div className="flex items-center gap-3">
      <RadioPrimitive.Item
        ref={ref}
        id={itemId}
        value={value}
        data-shape="round"
        {...props}
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-border-strong bg-elevated",
          colorTransition,
          focusRing,
          "ds-hover:border-fg",
          "data-[state=checked]:border-accent-edge data-[state=checked]:bg-accent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <RadioPrimitive.Indicator data-shape="round" className="block size-2 rounded-full bg-on-accent" />
      </RadioPrimitive.Item>
      {label ? (
        <label
          htmlFor={itemId}
          className={cn("cursor-pointer font-mono text-body text-fg", props.disabled && "cursor-not-allowed opacity-50")}
        >
          {label}
        </label>
      ) : null}
    </div>
  );
});
