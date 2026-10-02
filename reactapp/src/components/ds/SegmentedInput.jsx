import * as React from "react";
import { cn } from "@/lib/utils";
import { MaybeField, useField } from "./Field";
import { colorTransition, focusRing } from "./styles";

/*
 * SegmentedInput (POLISH_PLAN §3.8): N square single-character cells, e.g.
 * a 6-character room code. The value is always a contiguous string (no
 * gaps): typing fills the next cell, Backspace deletes and steps back,
 * Delete removes the current character, Arrow / Home / End move, and a
 * paste fills every cell (a full-length paste always starts at cell 1).
 * The group is a single Tab stop (the next cell to fill).
 *
 *   <SegmentedInput label="Room code" length={6} value={code} onChange={setCode} />
 *
 * Props: length (6), value / defaultValue, onChange(value),
 * onComplete(value) once every cell is filled, allowed (RegExp per char,
 * default letters and digits), uppercase (true), name (adds a hidden input
 * for forms), disabled, autoFocus, plus label / hint / error.
 */
export const SegmentedInput = React.forwardRef(function SegmentedInput(
  { label, hint, error, fieldClassName, ...props },
  ref
) {
  return (
    <MaybeField
      name="SegmentedInput"
      label={label}
      hint={hint}
      error={error}
      required={props.required}
      disabled={props.disabled}
      id={props.id}
      className={fieldClassName}
      ariaLabelled={Boolean(props["aria-label"] || props["aria-labelledby"])}
    >
      <SegmentedControl ref={ref} {...props} />
    </MaybeField>
  );
});

const DEFAULT_ALLOWED = /[A-Za-z0-9]/;

const SegmentedControl = React.forwardRef(function SegmentedControl(
  {
    length = 6,
    value: valueProp,
    defaultValue = "",
    onChange,
    onComplete,
    allowed = DEFAULT_ALLOWED,
    uppercase = true,
    name,
    disabled,
    autoFocus,
    id,
    className,
    inputMode = "text",
    ...rest
  },
  ref
) {
  const field = useField();
  const [inner, setInner] = React.useState(defaultValue);
  const controlled = valueProp !== undefined;
  const value = (controlled ? valueProp : inner).slice(0, length);
  const cells = React.useRef([]);
  const firstId = id ?? field?.id;
  const invalid = rest["aria-invalid"] ?? (field?.invalid ? true : undefined);
  const isDisabled = disabled ?? field?.disabled;

  React.useImperativeHandle(ref, () => ({ focus: () => cells.current[Math.min(value.length, length - 1)]?.focus() }), [
    value.length,
    length,
  ]);

  const clean = (text) =>
    [...String(text)]
      .filter((ch) => allowed.test(ch))
      .map((ch) => (uppercase ? ch.toUpperCase() : ch))
      .join("");

  const focusCell = (i) => {
    const el = cells.current[Math.max(0, Math.min(i, length - 1))];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const commit = (next) => {
    const v = next.slice(0, length);
    if (!controlled) setInner(v);
    if (v !== value) {
      onChange?.(v);
      if (v.length === length) onComplete?.(v);
    }
  };

  const insertAt = (i, text) => {
    const chars = clean(text);
    if (!chars) return;
    const start = chars.length >= length ? 0 : Math.min(i, value.length);
    const next = (value.slice(0, start) + chars + value.slice(start + chars.length)).slice(0, length);
    commit(next);
    focusCell(Math.min(start + chars.length, length - 1));
  };

  const handleChange = (i) => (event) => {
    let typed = event.target.value;
    const current = value[i] || "";
    if (current && typed.length > 1) typed = typed.replace(current, "");
    if (!typed) return; // deletions are handled in onKeyDown
    insertAt(i, typed);
  };

  const handleKeyDown = (i) => (event) => {
    switch (event.key) {
      case "Backspace": {
        event.preventDefault();
        if (i < value.length) {
          commit(value.slice(0, i) + value.slice(i + 1));
          if (i === value.length - 1 && i > 0) focusCell(i);
        } else if (i > 0) {
          commit(value.slice(0, i - 1) + value.slice(i));
          focusCell(i - 1);
        }
        break;
      }
      case "Delete":
        event.preventDefault();
        if (i < value.length) commit(value.slice(0, i) + value.slice(i + 1));
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusCell(i - 1);
        break;
      case "ArrowRight":
        event.preventDefault();
        focusCell(Math.min(i + 1, value.length));
        break;
      case "Home":
        event.preventDefault();
        focusCell(0);
        break;
      case "End":
        event.preventDefault();
        focusCell(value.length);
        break;
      default:
    }
  };

  const handlePaste = (i) => (event) => {
    event.preventDefault();
    insertAt(i, event.clipboardData.getData("text"));
  };

  // Cells after the first empty one are not reachable: focus snaps back so
  // the value can never have gaps.
  const handleFocus = (i) => (event) => {
    if (i > value.length) focusCell(value.length);
    else event.target.select();
  };

  return (
    <div
      role="group"
      aria-labelledby={rest["aria-labelledby"] ?? field?.labelId}
      aria-label={rest["aria-label"]}
      aria-describedby={[field?.describedBy, rest["aria-describedby"]].filter(Boolean).join(" ") || undefined}
      className={cn("flex gap-2", className)}
    >
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            cells.current[i] = el;
          }}
          id={i === 0 ? firstId : undefined}
          // Roving tabindex: one Tab stop for the whole group (the next
          // cell to fill); arrows move between cells.
          tabIndex={i === Math.min(value.length, length - 1) ? 0 : -1}
          value={value[i] || ""}
          onChange={handleChange(i)}
          onKeyDown={handleKeyDown(i)}
          onPaste={handlePaste(i)}
          onFocus={handleFocus(i)}
          onMouseUp={(e) => e.preventDefault()}
          disabled={isDisabled}
          autoFocus={autoFocus && i === 0}
          inputMode={inputMode}
          autoComplete="off"
          autoCapitalize={uppercase ? "characters" : "off"}
          autoCorrect="off"
          spellCheck={false}
          aria-label={`Character ${i + 1} of ${length}`}
          aria-invalid={invalid}
          data-filled={value[i] ? "" : undefined}
          className={cn(
            "size-11 border border-border-strong bg-elevated text-center font-mono text-h3 text-fg caret-transparent",
            uppercase && "uppercase",
            colorTransition,
            focusRing,
            "ds-hover:border-fg data-[filled]:border-fg",
            "aria-[invalid=true]:border-err",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
      ))}
      {name ? <input type="hidden" name={name} value={value} /> : null}
    </div>
  );
});
