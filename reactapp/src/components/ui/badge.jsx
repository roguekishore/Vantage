import * as React from "react"
// Legacy shadcn copy restyled onto design tokens (radius 0, no shadows).
// New code imports from "@/components/ds" instead.
import { cn } from "../../lib/utils"

function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "border-accent-edge bg-accent text-on-accent",
    secondary: "border-border bg-elevated text-fg-muted",
    destructive: "border-err bg-err-soft text-err",
    outline: "border-border-strong text-fg",
    success: "border-ok bg-ok-soft text-ok",
    warning: "border-warn bg-warn-soft text-warn",
    danger: "border-err bg-err-soft text-err",
  }

  return (
    <div
      data-slot="badge"
      className={cn(
        "inline-flex items-center border px-2 py-0.5 font-mono text-micro uppercase tabular-nums",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  )
}

export { Badge }
