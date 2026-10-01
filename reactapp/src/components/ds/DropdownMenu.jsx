import * as React from "react";
import * as MenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

/*
 * DropdownMenu on @radix-ui/react-dropdown-menu: arrow
 * keys, typeahead, Esc and focus return from Radix. The highlighted item
 * inverts (fg fill, bg text). tone="danger" items use --err.
 *
 *   <DropdownMenu>
 *     <DropdownMenuTrigger asChild><IconButton icon={User} aria-label="Account" /></DropdownMenuTrigger>
 *     <DropdownMenuContent align="end">
 *       <DropdownMenuItem asChild><Link to="/profile">Profile</Link></DropdownMenuItem>
 *       <DropdownMenuSeparator />
 *       <DropdownMenuItem tone="danger" onSelect={signOut}>Sign out</DropdownMenuItem>
 *     </DropdownMenuContent>
 *   </DropdownMenu>
 */
export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;
export const DropdownMenuGroup = MenuPrimitive.Group;

export const DropdownMenuContent = React.forwardRef(function DropdownMenuContent(
  { className, sideOffset = 4, align = "start", ...props },
  ref
) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cn("z-modal min-w-[10rem] border border-border-strong bg-surface p-1 text-fg outline-none", className)}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
});

export const DropdownMenuItem = React.forwardRef(function DropdownMenuItem({ className, tone, ...props }, ref) {
  return (
    <MenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex h-8 cursor-pointer select-none items-center gap-2 px-2 font-mono text-small outline-none",
        "[&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:[stroke-width:1.5]",
        tone === "danger" ? "text-err data-[highlighted]:bg-err data-[highlighted]:text-bg" : "text-fg data-[highlighted]:bg-fg data-[highlighted]:text-bg",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    />
  );
});

export const DropdownMenuLabel = React.forwardRef(function DropdownMenuLabel({ className, ...props }, ref) {
  return <MenuPrimitive.Label ref={ref} className={cn("px-2 pb-1 pt-2 font-mono text-micro uppercase text-fg-muted", className)} {...props} />;
});

export const DropdownMenuSeparator = React.forwardRef(function DropdownMenuSeparator({ className, ...props }, ref) {
  return <MenuPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
});
