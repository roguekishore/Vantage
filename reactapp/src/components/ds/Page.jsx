import * as React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { colorTransition, focusRing, labelType } from "./styles";

/*
 * PageShell, PageHeader, Breadcrumb (POLISH_PLAN §3.5, §4).
 *
 *   <PageShell>                       main#main, top padding nav + 32px,
 *     <PageHeader                     1200px container (narrow: 768px),
 *       breadcrumb={<Breadcrumb items={[{ label: "Visualizers", to: "/visualizers" }, { label: "Sorting" }]} />}
 *       eyebrow="Practice"
 *       title={<>Problem <em>set</em></>}
 *       description="..."
 *       actions={<Button variant="primary">New</Button>}
 *     />
 *     ...
 *   </PageShell>
 *
 * PageHeader renders the page's single <h1> (Monument at --display-weight,
 * no synthesis). One <em> word renders in --accent-ink, upright.
 */
export function PageShell({ narrow = false, as: Comp = "main", id = "main", className, containerClassName, children, ...props }) {
  return (
    <Comp id={id} className={cn("w-full px-[var(--gutter)] pb-16 pt-[calc(var(--nav-h)+32px)]", className)} {...props}>
      <div
        className={cn(
          "mx-auto w-full",
          narrow ? "max-w-[var(--container-narrow)]" : "max-w-[var(--container)]",
          containerClassName
        )}
      >
        {children}
      </div>
    </Comp>
  );
}

export function PageHeader({ eyebrow, title, description, actions, breadcrumb, className }) {
  return (
    <header className={cn("mb-8 grid gap-4 border-b border-border pb-8", className)}>
      {breadcrumb}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="grid min-w-0 gap-3">
          {eyebrow ? <p className={cn(labelType, "text-accent-ink")}>{eyebrow}</p> : null}
          <h1
            className="font-display text-h1 uppercase text-fg [&_em]:not-italic [&_em]:text-accent-ink"
            style={{ fontSynthesis: "none" }}
          >
            {title}
          </h1>
          {description ? <p className="max-w-[64ch] font-mono text-body text-fg-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Breadcrumb({ items = [], className }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className={cn("flex flex-wrap items-center gap-2 text-fg-muted", labelType)}>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-2">
              {item.to && !last ? (
                <Link to={item.to} className={cn(colorTransition, focusRing, "ds-hover:text-fg")}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "text-fg" : undefined}>
                  {item.label}
                </span>
              )}
              {last ? null : <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
