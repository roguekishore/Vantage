import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./IconButton";

/*
 * Dialog and Sheet on @radix-ui/react-dialog:
 * focus trap, Esc closes, aria-modal, scroll lock and focus return come from
 * Radix. Opaque --surface, 1px --border-strong, --backdrop overlay, no blur,
 * no shadow, no animation.
 *
 *   <Dialog open={open} onOpenChange={setOpen}>
 *     <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
 *     <DialogContent title="Leave battle?" description="Your progress is lost.">
 *       ...
 *       <DialogFooter><DialogClose asChild><Button>Cancel</Button></DialogClose></DialogFooter>
 *     </DialogContent>
 *   </Dialog>
 *
 * Sheet uses the same Root: <Sheet><SheetContent side="right" title="Menu">.
 */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

const Overlay = React.forwardRef(function Overlay({ className, ...props }, ref) {
  return <DialogPrimitive.Overlay ref={ref} className={cn("fixed inset-0 z-overlay bg-[var(--backdrop)]", className)} {...props} />;
});

function Header({ title, description, hideClose }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
      <div className="grid min-w-0 gap-1">
        <DialogPrimitive.Title className="font-mono text-h3 text-fg">{title}</DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className="font-mono text-small text-fg-muted">{description}</DialogPrimitive.Description>
        ) : null}
      </div>
      {hideClose ? null : (
        <DialogPrimitive.Close asChild>
          <IconButton icon={X} size="sm" aria-label="Close" className="-mr-2" />
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

const DIALOG_SIZES = { sm: "max-w-[400px]", md: "max-w-[560px]", lg: "max-w-[768px]" };

export const DialogContent = React.forwardRef(function DialogContent(
  { title, description, size = "md", hideClose = false, className, bodyClassName, children, ...props },
  ref
) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-modal flex max-h-[calc(100vh-64px)] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col border border-border-strong bg-surface text-fg outline-none",
          DIALOG_SIZES[size] || DIALOG_SIZES.md,
          className
        )}
        {...(description ? {} : { "aria-describedby": undefined })}
        {...props}
      >
        <Header title={title} description={description} hideClose={hideClose} />
        <div className={cn("min-h-0 overflow-y-auto px-6 py-4 font-mono text-body", bodyClassName)}>{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export function DialogFooter({ className, ...props }) {
  return <div className={cn("-mx-6 -mb-4 mt-4 flex flex-wrap justify-end gap-2 border-t border-border px-6 py-4", className)} {...props} />;
}

const SIDES = {
  right: "inset-y-0 right-0 h-full w-[min(100vw,360px)] border-l",
  left: "inset-y-0 left-0 h-full w-[min(100vw,360px)] border-r",
  bottom: "inset-x-0 bottom-0 max-h-[85vh] w-full border-t",
};

export const SheetContent = React.forwardRef(function SheetContent(
  { side = "right", title, description, hideClose = false, className, bodyClassName, children, ...props },
  ref
) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn("fixed z-modal flex flex-col border-border-strong bg-surface text-fg outline-none", SIDES[side] || SIDES.right, className)}
        {...(description ? {} : { "aria-describedby": undefined })}
        {...props}
      >
        <Header title={title} description={description} hideClose={hideClose} />
        <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-4 font-mono text-body", bodyClassName)}>{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
