import * as React from "react";
import { cn } from "@/lib/utils";
import { MaybeField, useFieldControlProps } from "./Field";
import { colorTransition, focusRing } from "./styles";

/*
 * Input and Textarea. Square, --elevated fill, 1px
 * --border (→ --border-strong on hover, --err when invalid), 2px --focus
 * outline. Heights match Button: sm 28 / md 36 / lg 44.
 *
 *   <Input label="Room name" hint="Shown to players" error={err} />
 *
 * label / hint / error / required wrap the control in a Field (see
 * Field.jsx); inside an explicit <Field> the control reads its wiring from
 * context instead.
 */

export const fieldControlClasses = cn(
  "w-full border border-border bg-elevated font-mono text-fg placeholder:text-fg-dim",
  colorTransition,
  focusRing,
  "ds-hover:border-border-strong",
  "aria-[invalid=true]:border-err",
  "disabled:cursor-not-allowed disabled:opacity-50 read-only:bg-surface"
);

const INPUT_SIZES = {
  sm: "h-7 px-2 text-small",
  md: "h-9 px-3 text-body",
  lg: "h-11 px-4 text-body",
};

export const Input = React.forwardRef(function Input(
  { label, hint, error, size = "md", className, fieldClassName, type = "text", ...props },
  ref
) {
  return (
    <MaybeField
      name="Input"
      label={label}
      hint={hint}
      error={error}
      required={props.required}
      disabled={props.disabled}
      id={props.id}
      className={fieldClassName}
      ariaLabelled={Boolean(props["aria-label"] || props["aria-labelledby"])}
    >
      <InputControl ref={ref} type={type} size={size} className={className} {...props} />
    </MaybeField>
  );
});

const InputControl = React.forwardRef(function InputControl({ size, className, ...props }, ref) {
  const wiring = useFieldControlProps(props);
  return (
    <input
      ref={ref}
      {...props}
      {...wiring}
      className={cn(fieldControlClasses, INPUT_SIZES[size] || INPUT_SIZES.md, className)}
    />
  );
});

export const Textarea = React.forwardRef(function Textarea(
  { label, hint, error, className, fieldClassName, rows = 4, ...props },
  ref
) {
  return (
    <MaybeField
      name="Textarea"
      label={label}
      hint={hint}
      error={error}
      required={props.required}
      disabled={props.disabled}
      id={props.id}
      className={fieldClassName}
      ariaLabelled={Boolean(props["aria-label"] || props["aria-labelledby"])}
    >
      <TextareaControl ref={ref} rows={rows} className={className} {...props} />
    </MaybeField>
  );
});

const TextareaControl = React.forwardRef(function TextareaControl({ className, ...props }, ref) {
  const wiring = useFieldControlProps(props);
  return (
    <textarea
      ref={ref}
      {...props}
      {...wiring}
      className={cn(fieldControlClasses, "min-h-24 resize-y px-3 py-2 text-body", className)}
    />
  );
});
