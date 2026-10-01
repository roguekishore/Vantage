import * as React from "react";
import { cn } from "@/lib/utils";
import { labelType } from "./styles";

/*
 * Field: the visible label, hint and error text around a
 * form control. Labels are always visible; errors render as text below the
 * field (never alert()) and set aria-invalid + aria-describedby on the
 * control.
 *
 *   <Field label="Email" hint="We never share it" error={err}>
 *     <Input type="email" />
 *   </Field>
 *
 * Every ds form control also takes label / hint / error directly and wraps
 * itself in a Field, so <Input label="Email" error={err} /> is equivalent.
 *
 *   layout  "stack"  label above the control (Input, Textarea, Select,
 *                    RadioGroup, SegmentedInput)
 *           "inline" control left, label right (Checkbox, Switch)
 *   group   the control is a group (radiogroup, SegmentedInput): the label
 *           is still a <label> pointing at the first focusable part, and the
 *           group reads it through aria-labelledby.
 */

const FieldContext = React.createContext(null);

/** Control-side hook: ids and ARIA wiring from the enclosing Field, if any. */
export function useField() {
  return React.useContext(FieldContext);
}

const joinIds = (...ids) => ids.filter(Boolean).join(" ") || undefined;

/** Merge Field wiring into a control's own props (own props win). */
export function useFieldControlProps(props) {
  const field = useField();
  return {
    id: props.id ?? field?.id,
    "aria-describedby": joinIds(field?.describedBy, props["aria-describedby"]),
    "aria-invalid": props["aria-invalid"] ?? (field?.invalid ? true : undefined),
    required: props.required ?? field?.required,
    disabled: props.disabled ?? field?.disabled,
  };
}

export function Field({
  label,
  hint,
  error,
  required,
  disabled,
  id: idProp,
  layout = "stack",
  className,
  children,
}) {
  const autoId = React.useId();
  const id = idProp || `ds-field${autoId.replace(/:/g, "")}`;
  const labelId = `${id}-label`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const ctx = React.useMemo(
    () => ({
      id,
      labelId: label ? labelId : undefined,
      describedBy: joinIds(hintId, errorId),
      invalid: Boolean(error),
      required,
      disabled,
    }),
    [id, label, labelId, hintId, errorId, error, required, disabled]
  );

  const labelEl = label ? (
    <label
      id={labelId}
      htmlFor={id}
      className={cn(
        // Stacked labels use the label step; inline labels (checkbox, switch)
        // read as body text next to their control.
        layout === "inline" ? "cursor-pointer font-mono text-body text-fg" : cn(labelType, "text-fg-muted"),
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      {label}
      {required ? (
        <span aria-hidden="true" className="text-err">
          {" *"}
        </span>
      ) : null}
    </label>
  ) : null;

  const messages = (
    <>
      {hint ? (
        <p id={hintId} className="font-mono text-small text-fg-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="font-mono text-small text-err">
          {error}
        </p>
      ) : null}
    </>
  );

  return (
    <FieldContext.Provider value={ctx}>
      {layout === "inline" ? (
        <div className={cn("grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1", className)} data-ds-field="">
          {children}
          {labelEl}
          {hint || error ? <div className="col-start-2 grid gap-1">{messages}</div> : null}
        </div>
      ) : (
        <div className={cn("grid gap-2", className)} data-ds-field="">
          {labelEl}
          {children}
          {hint || error ? <div className="grid gap-1">{messages}</div> : null}
        </div>
      )}
    </FieldContext.Provider>
  );
}

/**
 * Wrap a control in a Field when it was given label / hint / error props
 * and no enclosing Field exists. Warns in development when the control ends
 * up with no visible label and no aria-label.
 */
export function MaybeField({ label, hint, error, required, disabled, id, layout, className, ariaLabelled, name, children }) {
  const outer = useField();
  const needsField = !outer && (label || hint || error);

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production" && !outer && !label && !ariaLabelled) {
      // eslint-disable-next-line no-console
      console.warn(`[ds/${name}] needs a visible label (label prop or <Field label>).`);
    }
  }, [outer, label, ariaLabelled, name]);

  if (!needsField) return children;
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      disabled={disabled}
      id={id}
      layout={layout}
      className={className}
    >
      {children}
    </Field>
  );
}
