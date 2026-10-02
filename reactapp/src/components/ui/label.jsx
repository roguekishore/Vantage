import * as React from "react"
// Legacy shadcn copy restyled onto design tokens (radius 0, no shadows).
// New code imports from "@/components/ds" instead.
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "font-mono text-label uppercase text-fg-muted peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
)

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
