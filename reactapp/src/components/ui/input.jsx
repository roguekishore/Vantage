import * as React from "react"
// Legacy shadcn copy restyled onto design tokens (radius 0, no shadows).
// New code imports from "@/components/ds" instead.
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full border border-border bg-elevated px-3 py-2 font-mono text-sm text-fg file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-fg-dim hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-[120ms]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
