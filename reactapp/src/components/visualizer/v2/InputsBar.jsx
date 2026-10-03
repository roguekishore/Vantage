import * as React from "react";
import { Check, Shuffle } from "lucide-react";
import { Button, Input, Select, SelectItem, Switch, Textarea } from "@/components/ds";
import { cn } from "@/lib/utils";
import { isMultiline } from "./inputModel";

const WIDTH = {
  numberList: "w-64",
  number: "w-28",
  string: "w-44",
  tree: "w-64",
  ops: "w-72",
  matrix: "w-56",
  tuples: "w-56",
  graph: "w-56",
  select: "w-44",
};

function Field({ spec, draft, error, onDraft, onApply }) {
  const width = WIDTH[spec.kind] || "w-44";
  const common = { label: spec.label, error, id: `viz-in-${spec.key}`, fieldClassName: cn(width, "max-w-full") };
  if (spec.kind === "select") {
    return (
      <Select {...common} size="sm" value={draft} onValueChange={(v) => onDraft(spec.key, v, true)}>
        {spec.options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </Select>
    );
  }
  if (spec.kind === "toggle") {
    return (
      <Switch
        label={spec.label}
        id={`viz-in-${spec.key}`}
        checked={Boolean(draft)}
        error={error}
        onCheckedChange={(v) => onDraft(spec.key, v, true)}
      />
    );
  }
  if (isMultiline(spec.kind)) {
    return (
      <Textarea
        {...common}
        rows={3}
        spellCheck={false}
        className="min-h-0 resize-y py-1 text-small"
        value={draft}
        onChange={(e) => onDraft(spec.key, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onApply();
          }
        }}
      />
    );
  }
  return (
    <Input
      {...common}
      size="sm"
      spellCheck={false}
      autoComplete="off"
      inputMode={spec.kind === "number" ? "decimal" : undefined}
      value={draft}
      onChange={(e) => onDraft(spec.key, e.target.value)}
    />
  );
}

/** Editable inputs (never locked), Apply, example chips and Random. */
export default function InputsBar({ inputs, drafts, errors, onDraft, onApply, examples, activeExample, onExample, onRandom, hasRandom, generalError }) {
  const submit = (e) => {
    e.preventDefault();
    onApply();
  };
  return (
    <div className="grid gap-2">
      <form onSubmit={submit} className="flex flex-wrap items-start gap-x-3 gap-y-2" aria-label="Inputs">
        {inputs.map((spec) => (
          <Field key={spec.key} spec={spec} draft={drafts[spec.key]} error={errors[spec.key]} onDraft={onDraft} onApply={onApply} />
        ))}
        <div className={cn("flex gap-2", inputs.some((s) => s.kind === "toggle") ? "" : "self-end")}>
          <Button type="submit" size="sm" variant="primary">
            <Check aria-hidden="true" /> Apply
          </Button>
          {hasRandom ? (
            <Button type="button" size="sm" onClick={onRandom}>
              <Shuffle aria-hidden="true" /> Random
            </Button>
          ) : null}
        </div>
      </form>
      {examples && examples.length ? (
        <div role="group" aria-label="Examples" className="flex flex-wrap items-center gap-1">
          <span className="mr-1 font-mono text-label uppercase text-fg-muted">Examples</span>
          {examples.map((ex, i) => (
            <Button
              key={i}
              size="sm"
              variant={activeExample === i ? "primary" : "secondary"}
              aria-pressed={activeExample === i}
              onClick={() => onExample(i)}
              className="normal-case tracking-normal"
            >
              {ex.label}
            </Button>
          ))}
        </div>
      ) : null}
      {generalError ? (
        <p role="alert" className="font-mono text-small text-err">
          {generalError}
        </p>
      ) : null}
    </div>
  );
}
