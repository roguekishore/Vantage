import * as React from "react"
// Legacy shadcn copy restyled onto design tokens (radius 0, no shadows).
// New code imports from "@/components/ds" instead.
import { cn } from "../../lib/utils"

const buttonVariants = {
  variant: {
    default: "border border-accent-edge bg-accent text-on-accent hover:bg-on-accent hover:text-accent",
    destructive: "border border-err bg-transparent text-err hover:bg-err hover:text-bg",
    outline: "border border-border-strong bg-transparent text-fg hover:bg-fg hover:text-bg",
    secondary: "border border-border bg-elevated text-fg hover:border-border-strong",
    ghost: "border border-transparent text-fg hover:bg-elevated",
    link: "text-accent-ink underline-offset-4 hover:underline",
  },
  size: {
    default: "h-9 px-4",
    sm: "h-7 px-3",
    lg: "h-11 px-6",
    icon: "h-9 w-9",
  },
}

const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap font-mono text-sm font-medium transition-colors duration-[120ms] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-50",
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
