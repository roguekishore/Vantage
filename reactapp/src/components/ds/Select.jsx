import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MaybeField, useFieldControlProps } from "./Field";
import { fieldControlClasses } from "./Input";
import { ICON_STROKE } from "./styles";

/*
 * Select on @radix-ui/react-select: keyboard open
 * (Space / Enter / arrows), typeahead, focus return and ARIA come from Radix.
 *
 *   <Select label="Language" value={v} onValueChange={setV} placeholder="Pick one">
 *     <SelectItem value="js">JavaScript</SelectItem>
 *   </Select>
 *
 * The list is an opaque --surface popover with a --border-strong border at
 * z-modal, so a Select inside a Dialog stacks above it (later portal wins).
 * The highlighted option inverts (fg fill, bg text).
 */

const TRIGGER_SIZES = { sm: "h-7 px-2 text-small", md: "h-9 px-3 text-body", lg: "h-11 px-4 text-body" };

export const Select = React.forwardRef(function Select(
  {
    label,
    hint,
    error,
    size = "md",
    placeholder,
    className,
    fieldClassName,
    contentClassName,
    children,
    // Root props
    value,
    defaultValue,
    onValueChange,
    open,
    defaultOpen,
    onOpenChange,
    name,
    required,
    disabled,
    ...triggerProps
  },
  ref
) {
  return (
    <MaybeField
      name="Select"
      label={label}
      hint={hint}
      error={error}
      required={required}
      disabled={disabled}
      id={triggerProps.id}
      className={fieldClassName}
      ariaLabelled={Boolean(triggerProps["aria-label"] || triggerProps["aria-labelledby"])}
    >
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        name={name}
        required={required}
        disabled={disabled}
      >
        <SelectTrigger ref={ref} size={size} className={className} disabled={disabled} required={required} {...triggerProps}>
          <SelectPrimitive.Value placeholder={placeholder} />
        </SelectTrigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className={cn(
              "z-modal max-h-[min(320px,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden border border-border-strong bg-surface text-fg",
              contentClassName
            )}
          >
            <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </MaybeField>
  );
});

const SelectTrigger = React.forwardRef(function SelectTrigger({ size, className, children, ...props }, ref) {
  const wiring = useFieldControlProps(props);
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      {...props}
      {...wiring}
      className={cn(
        fieldControlClasses,
        "inline-flex items-center justify-between gap-2 text-left data-[placeholder]:text-fg-dim data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        TRIGGER_SIZES[size] || TRIGGER_SIZES.md,
        className
      )}
    >
      <span className="min-w-0 truncate">{children}</span>
      <SelectPrimitive.Icon asChild>
        <ChevronDown size={16} strokeWidth={ICON_STROKE} aria-hidden="true" className="shrink-0 text-fg-muted" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

export const SelectItem = React.forwardRef(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex h-8 cursor-pointer select-none items-center pl-8 pr-3 font-mono text-small text-fg outline-none",
        "data-[highlighted]:bg-fg data-[highlighted]:text-bg data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 inline-flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});

export const SelectGroup = SelectPrimitive.Group;

export const SelectLabel = React.forwardRef(function SelectLabel({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn("px-2 pb-1 pt-2 font-mono text-micro uppercase text-fg-muted", className)}
      {...props}
    />
  );
});

export const SelectSeparator = React.forwardRef(function SelectSeparator({ className, ...props }, ref) {
  return <SelectPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
});
