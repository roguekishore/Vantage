import * as React from "react";
import { useInRouterContext } from "react-router-dom";
import { Info } from "lucide-react";
import { Badge, Breadcrumb, Button, Sheet, SheetContent, SheetTrigger, Tabs, TabsList, TabsTrigger } from "@/components/ds";

const DIFF_TONE = { easy: "ok", medium: "warn", hard: "err" };

function About({ meta, complexity, mode }) {
  const t = complexity?.time || {};
  const rows = [
    ["Best", t.best],
    ["Average", t.avg],
    ["Worst", t.worst],
    ["Space", complexity?.space],
  ].filter(([, v]) => v);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" variant="secondary">
          <Info aria-hidden="true" /> About
        </Button>
      </SheetTrigger>
      <SheetContent title={`About ${meta.title}`} description={mode ? `Complexity for ${mode}` : undefined}>
        <p className="mb-4 text-fg-muted">{meta.summary}</p>
        <h3 className="mb-2 font-mono text-label uppercase text-fg-muted">Complexity</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border border-border p-3">
          {rows.map(([k, v]) => (
            <React.Fragment key={k}>
              <dt className="text-fg-muted">{k}</dt>
              <dd className="text-right tabular-nums text-fg">{v}</dd>
            </React.Fragment>
          ))}
        </dl>
        {complexity?.note ? <p className="mt-4 text-fg-muted">{complexity.note}</p> : null}
      </SheetContent>
    </Sheet>
  );
}

/** One row, about 88px: breadcrumb, h1 + badges, summary; modes and About on the right. */
export default function Header({ meta, modes, mode, onMode, complexity }) {
  const inRouter = useInRouterContext();
  const crumbs = [
    inRouter ? { label: "Visualizers", to: "/visualizers" } : { label: "Visualizers" },
    { label: meta.category },
    { label: meta.title },
  ];
  const modeKeys = modes ? Object.keys(modes) : [];
  return (
    <header className="flex min-h-[88px] flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-border pb-3">
      <div className="grid min-w-0 gap-1">
        <Breadcrumb items={crumbs} />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-h2 uppercase text-fg" style={{ fontSynthesis: "none" }}>
            {meta.title}
          </h1>
          {meta.difficulty ? <Badge tone={DIFF_TONE[meta.difficulty] || "neutral"}>{meta.difficulty}</Badge> : null}
          {meta.leetcode ? (
            <a
              href={`https://leetcode.com/problemset/?search=${meta.leetcode}`}
              target="_blank"
              rel="noreferrer"
              aria-label={`LeetCode problem ${meta.leetcode}`}
              className="ds-focus:outline ds-focus:outline-2 ds-focus:outline-offset-2 ds-focus:outline-focus"
            >
              <Badge tone="outline">LC {meta.leetcode}</Badge>
            </a>
          ) : null}
        </div>
        <p className="max-w-[80ch] font-mono text-small text-fg-muted">{meta.summary}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {modeKeys.length > 1 ? (
          <Tabs value={mode} onValueChange={onMode} variant="segmented">
            <TabsList aria-label="Mode">
              {modeKeys.map((k) => (
                <TabsTrigger key={k} value={k}>
                  {modes[k].label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : null}
        <About meta={meta} complexity={complexity} mode={modeKeys.length > 1 ? modes[mode].label : null} />
      </div>
    </header>
  );
}
