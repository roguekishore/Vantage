import * as React from "react";
import { cn } from "@/lib/utils";
import { microType } from "./styles";

/*
 * Badge: micro type (10px / 500 / 0.08em, upper
 * case), tabular numbers, square. Status tones carry meaning only.
 *
 *   tone  neutral | accent | ok | warn | err | outline
 */
const TONES = {
  neutral: "bg-elevated text-fg-muted border-border",
  accent: "bg-accent text-on-accent border-accent-edge",
  ok: "bg-ok-soft text-ok border-ok",
  warn: "bg-warn-soft text-warn border-warn",
  err: "bg-err-soft text-err border-err",
  outline: "bg-transparent text-fg border-border-strong",
};

export const Badge = React.forwardRef(function Badge({ tone, variant, className, ...props }, ref) {
  const t = tone || variant || "neutral";
  return (
    <span
      ref={ref}
      data-tone={t}
      className={cn("inline-flex h-5 items-center gap-1 whitespace-nowrap border px-2", microType, TONES[t] || TONES.neutral, className)}
      {...props}
    />
  );
});
