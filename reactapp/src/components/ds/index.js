/*
 * VANTAGE design-system primitives. Pages import from
 * "@/components/ds" only, never from "@/components/ui/*".
 *
 * Layering decision: ds/* calls the Radix primitives directly
 * (@radix-ui/react-select, -checkbox, -radio-group, -switch, -dialog,
 * -popover, -dropdown-menu, -tooltip, -progress, -slot) for behaviour, and
 * owns every class. It does not wrap src/components/ui/*: those files are
 * the legacy shadcn copies, restyled onto tokens (radius 0, no shadows) only
 * so the pages that still import them match until they migrate, then
 * deleted. Tabs and Toast are hand-rolled (no extra dependency).
 *
 * Shared rules: tokens only (tailwind.config.js colour names), radius 0
 * (the radio circle is the one data-shape="round"), no shadows, hover is a
 * <=120ms colour change via the `ds-hover:` variant, focus is a 2px --focus
 * outline with 2px offset via `ds-focus:` (see styles.js). The /__ds route
 * (src/pages/ds) renders every primitive in both themes.
 */
export { Button, buttonClasses } from "./Button";
export { IconButton } from "./IconButton";
export { Field, useField } from "./Field";
export { Input, Textarea } from "./Input";
export { Select, SelectItem, SelectGroup, SelectLabel, SelectSeparator } from "./Select";
export { Checkbox } from "./Checkbox";
export { RadioGroup, Radio } from "./Radio";
export { Switch } from "./Switch";
export { SegmentedInput } from "./SegmentedInput";
export { Panel } from "./Panel";
export { Badge } from "./Badge";
export { Kbd } from "./Kbd";
export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogFooter,
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
} from "./Dialog";
export { Popover, PopoverTrigger, PopoverAnchor, PopoverClose, PopoverContent } from "./Popover";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "./DropdownMenu";
export { Tooltip, TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from "./Tooltip";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";
export { toast, Toaster, ToastCard } from "./Toast";
export { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, ListRow } from "./Table";
export { Stat, Progress, Avatar, Skeleton } from "./Stat";
export { EmptyState, ErrorState, OfflineState, PageLoader } from "./States";
export { PageShell, PageHeader, Breadcrumb } from "./Page";
export { ThemeToggle } from "../common/ThemeToggle";
