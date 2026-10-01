import * as React from "react";
import { Button } from "./Button";
import { ICON_PX, ICON_STROKE } from "./styles";

/*
 * IconButton: a square Button with one Lucide icon.
 *
 *   <IconButton icon={X} aria-label="Close" />
 *   <IconButton aria-label="Close"><X /></IconButton>   (child icon, sized by CSS)
 *
 * `aria-label` is required; a dev-only console warning fires without it.
 * Icons render at 14 / 16 / 20px (sm / md / lg), stroke 1.5. Until the ds
 * Tooltip lands (unit 1.4b) the label doubles as the native `title`.
 * Default variant is ghost; every Button prop (variant, size, loading,
 * asChild, disabled) passes through. With asChild, put the icon inside the
 * child element (e.g. <Link><Settings /></Link>).
 */
export const IconButton = React.forwardRef(function IconButton(
  { icon: Icon, size = "md", variant = "ghost", title, children, ...props },
  ref
) {
  const label = props["aria-label"];
  const hasName = Boolean(label || props["aria-labelledby"]);

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production" && !hasName) {
      // eslint-disable-next-line no-console
      console.warn("[ds/IconButton] aria-label is required on icon-only buttons.");
    }
  }, [hasName]);

  return (
    <Button ref={ref} iconOnly size={size} variant={variant} title={title ?? label} {...props}>
      {Icon && !props.asChild ? <Icon size={ICON_PX[size] || ICON_PX.md} strokeWidth={ICON_STROKE} aria-hidden="true" /> : children}
    </Button>
  );
});
