import * as React from "react";
import { cn } from "@/lib/utils";
import { colorTransition, focusRing, labelType } from "./styles";

/*
 * Tabs, hand-rolled WAI-ARIA tabs (no Radix tabs dep):
 * roving tabindex, Arrow Left/Right (Up/Down when vertical), Home/End,
 * automatic activation.
 *
 *   variant  underline (page sections; 2px --accent-ink rule under the
 *            active tab) | segmented (filters; active = accent fill + edge)
 *
 *   <Tabs defaultValue="all" variant="segmented">
 *     <TabsList aria-label="Filter">
 *       <TabsTrigger value="all">All</TabsTrigger>
 *       <TabsTrigger value="easy">Easy</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="all">...</TabsContent>
 *   </Tabs>
 */

const TabsContext = React.createContext(null);
const useTabs = () => {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("[ds/Tabs] TabsList, TabsTrigger and TabsContent must be inside <Tabs>.");
  return ctx;
};
const slug = (v) => String(v).replace(/[^\w-]/g, "_");

export function Tabs({ value: valueProp, defaultValue, onValueChange, variant = "underline", orientation = "horizontal", className, children, ...props }) {
  const [inner, setInner] = React.useState(defaultValue);
  const value = valueProp !== undefined ? valueProp : inner;
  const autoId = React.useId();
  const baseId = `ds-tabs${autoId.replace(/:/g, "")}`;
  const setValue = React.useCallback(
    (v) => {
      if (valueProp === undefined) setInner(v);
      onValueChange?.(v);
    },
    [valueProp, onValueChange]
  );
  const ctx = React.useMemo(() => ({ value, setValue, variant, orientation, baseId }), [value, setValue, variant, orientation, baseId]);
  return (
    <TabsContext.Provider value={ctx}>
      <div className={className} data-orientation={orientation} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children, ...props }) {
  const { variant, orientation } = useTabs();
  const ref = React.useRef(null);

  const onKeyDown = (event) => {
    const keys = orientation === "vertical" ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"];
    if (![...keys, "Home", "End"].includes(event.key)) return;
    const tabs = [...ref.current.querySelectorAll('[role="tab"]:not([disabled])')];
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    event.preventDefault();
    let next = i;
    if (event.key === keys[0]) next = (i - 1 + tabs.length) % tabs.length;
    else if (event.key === keys[1]) next = (i + 1) % tabs.length;
    else if (event.key === "Home") next = 0;
    else next = tabs.length - 1;
    tabs[next].focus();
    tabs[next].click();
  };

  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation={orientation}
      onKeyDown={onKeyDown}
      className={cn(
        variant === "segmented"
          ? "inline-flex flex-wrap gap-1 border border-border p-1"
          : "flex gap-6 overflow-x-auto border-b border-border",
        orientation === "vertical" && "flex-col",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export const TabsTrigger = React.forwardRef(function TabsTrigger({ value, className, disabled, children, ...props }, ref) {
  const { value: active, setValue, variant, baseId } = useTabs();
  const selected = active === value;
  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={`${baseId}-tab-${slug(value)}`}
      aria-controls={`${baseId}-panel-${slug(value)}`}
      aria-selected={selected}
      data-state={selected ? "active" : "inactive"}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      onClick={() => setValue(value)}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
        labelType,
        colorTransition,
        focusRing,
        "[&_svg]:size-3.5 [&_svg]:[stroke-width:1.5] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "segmented"
          ? "h-7 border border-transparent px-3 text-fg-muted ds-hover:text-fg data-[state=active]:border-accent-edge data-[state=active]:bg-accent data-[state=active]:text-on-accent"
          : "-mb-px h-10 border-b-2 border-transparent text-fg-muted ds-hover:text-fg data-[state=active]:border-accent-ink data-[state=active]:text-fg",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export function TabsContent({ value, forceMount = false, className, children, ...props }) {
  const { value: active, baseId } = useTabs();
  const selected = active === value;
  if (!selected && !forceMount) return null;
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${slug(value)}`}
      aria-labelledby={`${baseId}-tab-${slug(value)}`}
      hidden={!selected}
      tabIndex={0}
      className={cn("outline-none ds-focus:outline ds-focus:outline-2 ds-focus:outline-offset-2 ds-focus:outline-focus", className)}
      {...props}
    >
      {children}
    </div>
  );
}
