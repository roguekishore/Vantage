import { Panel } from "@/components/ds";

/* Layout helpers for the /__ds preview. Each primitive group is one section
   file in this folder; add new groups to SECTIONS in DsPage.jsx. */
export function Section({ id, title, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="grid gap-4 border-t border-border pt-8">
      <h2 id={`${id}-title`} className="font-mono text-label uppercase text-fg">
        {"// "}
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Demo({ label, children, className = "" }) {
  return (
    <Panel variant="default" label={label} bodyClassName={`flex flex-wrap items-center gap-4 ${className}`}>
      {children}
    </Panel>
  );
}
