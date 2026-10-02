import * as React from "react";
import { cn } from "@/lib/utils";
import { colorTransition, focusRing } from "./styles";

/*
 * Table and ListRow (POLISH_PLAN §3.8). Mono small type, tabular numbers,
 * hairline row rules, zebra rows on --elevated at 50%.
 *
 *   <Table>
 *     <TableHead><TableRow><TableHeaderCell>Rank</TableHeaderCell>...</TableRow></TableHead>
 *     <TableBody><TableRow><TableCell align="right">1</TableCell>...</TableRow></TableBody>
 *   </Table>
 */
export const Table = React.forwardRef(function Table({ zebra = true, className, wrapperClassName, ...props }, ref) {
  return (
    <div className={cn("w-full overflow-x-auto border border-border", wrapperClassName)}>
      <table
        ref={ref}
        className={cn(
          "w-full border-collapse font-mono text-small tabular-nums text-fg",
          zebra && "[&>tbody>tr:nth-child(even)]:bg-elevated/50",
          className
        )}
        {...props}
      />
    </div>
  );
});

export const TableHead = React.forwardRef(function TableHead({ className, ...props }, ref) {
  return <thead ref={ref} className={cn("bg-surface", className)} {...props} />;
});

export const TableBody = React.forwardRef(function TableBody({ className, ...props }, ref) {
  return <tbody ref={ref} className={className} {...props} />;
});

export const TableRow = React.forwardRef(function TableRow({ className, interactive, ...props }, ref) {
  return (
    <tr
      ref={ref}
      className={cn("border-b border-border last:border-b-0", interactive && cn("cursor-pointer", colorTransition, "ds-hover:bg-elevated"), className)}
      {...props}
    />
  );
});

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" };

export const TableHeaderCell = React.forwardRef(function TableHeaderCell({ className, align = "left", ...props }, ref) {
  return (
    <th
      ref={ref}
      scope="col"
      className={cn("h-9 border-b border-border px-3 font-mono text-micro uppercase text-fg-muted", ALIGN[align], className)}
      {...props}
    />
  );
});

export const TableCell = React.forwardRef(function TableCell({ className, align = "left", ...props }, ref) {
  return <td ref={ref} className={cn("h-10 px-3 align-middle", ALIGN[align], className)} {...props} />;
});

/*
 *   <ListRow leading={<Avatar name="Ada" />} title="Ada" meta="1,240 XP" trailing={<Badge>#1</Badge>} />
 *   <ListRow as={Link} to="/u/ada" interactive ... />
 */
export const ListRow = React.forwardRef(function ListRow(
  { as: Comp = "div", leading, title, meta, trailing, interactive = false, className, children, ...props },
  ref
) {
  return (
    <Comp
      ref={ref}
      className={cn(
        "flex min-h-12 w-full items-center gap-3 border-b border-border px-4 py-2 text-left font-mono tabular-nums text-fg",
        interactive && cn("cursor-pointer", colorTransition, focusRing, "ds-hover:bg-elevated"),
        className
      )}
      {...props}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="grid min-w-0 flex-1 gap-0.5">
        {title ? <div className="truncate text-body text-fg">{title}</div> : null}
        {meta ? <div className="truncate text-small text-fg-muted">{meta}</div> : null}
        {children}
      </div>
      {trailing ? <div className="flex shrink-0 items-center gap-2">{trailing}</div> : null}
    </Comp>
  );
});
