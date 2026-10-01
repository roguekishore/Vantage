/**
 * TopicPage: compact PageHeader with a breadcrumb back to
 * the hub, then the topic's algorithms as a column-aligned ListRow list:
 * name + description, pattern tags, time complexity, LeetCode #, difficulty
 * (text + 2px left bar). Data: search/catalog filtered by `topicKey`.
 */

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Hash, Search } from "lucide-react";
import { problems as PROBLEM_CATALOG } from "../../search/catalog";
import { Badge, Breadcrumb, Button, EmptyState, Input, ListRow, PageHeader, PageShell, Panel, Tabs, TabsList, TabsTrigger } from "@/components/ds";
import { cn } from "@/lib/utils";
import TopicHeroCanvas from "./TopicHeroCanvas";

const DIFF = {
  Easy: { text: "text-ok", edge: "border-ok" },
  Medium: { text: "text-warn", edge: "border-warn" },
  Hard: { text: "text-err", edge: "border-err" },
};

const COLS = {
  pattern: "hidden w-56 md:flex",
  time: "hidden w-24 lg:block",
  number: "hidden w-20 text-right sm:block",
  difficulty: "w-20",
};

// LeetCode number from `platforms` ("LeetCode #11"); a bare numeric `number`
// counts only when the entry lists no platforms (those are LeetCode ids).
function leetCodeNumber(algo) {
  const fromPlatform = (algo.platforms || []).map((p) => /^LeetCode #(\d+)/.exec(p)).find(Boolean);
  if (fromPlatform) return fromPlatform[1];
  if (!algo.platforms?.length && /^\d+$/.test(algo.number || "")) return algo.number;
  return null;
}

function patternTags(algo) {
  const seen = new Set();
  return [algo.technique, ...(algo.tags || [])]
    .filter(Boolean)
    .filter((t) => {
      const k = t.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 2);
}

function Difficulty({ value, children }) {
  const d = DIFF[value];
  if (!d) return <span className="text-fg-dim">—</span>;
  return (
    <span className={cn("inline-block border-l-2 pl-2 font-mono text-small tabular-nums", d.edge, d.text)}>
      {children ?? value}
    </span>
  );
}

function AlgorithmRow({ algo, basePath, fallbackIcon }) {
  const Icon = algo.icon || fallbackIcon || Hash;
  const lc = leetCodeNumber(algo);
  const tags = patternTags(algo);
  const available = Boolean(algo.subpage);

  const trailing = (
    <>
      <span className={cn(COLS.pattern, "flex-wrap gap-1")}>
        {tags.map((tag) => (
          <Badge key={tag} tone="neutral">
            {tag}
          </Badge>
        ))}
      </span>
      <span className={cn(COLS.time, "truncate font-mono text-small text-fg-muted")}>{algo.timeComplexity || "—"}</span>
      <span className={cn(COLS.number, "font-mono text-small tabular-nums text-fg-muted")}>{lc ? `#${lc}` : "—"}</span>
      <span className={COLS.difficulty}>
        <Difficulty value={algo.difficulty} />
      </span>
      {available ? (
        <ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" className="text-fg-dim" />
      ) : (
        <span className="w-4" aria-hidden="true" />
      )}
    </>
  );

  const leading = <Icon size={16} strokeWidth={1.5} aria-hidden="true" className="text-fg-muted" />;

  if (!available) {
    return (
      <li>
        <ListRow leading={leading} title={algo.label} meta="No visualizer yet" trailing={trailing} />
      </li>
    );
  }

  return (
    <li>
      <ListRow
        as={Link}
        to={`${basePath}/${algo.subpage}`}
        interactive
        leading={leading}
        title={algo.label}
        meta={algo.description}
        trailing={trailing}
      />
    </li>
  );
}

const TopicPage = ({ topicKey, title, eyebrow, description, icon: Icon, basePath }) => {
  const [difficulty, setDifficulty] = useState("All");
  const [term, setTerm] = useState("");
  const all = useMemo(() => PROBLEM_CATALOG.filter((p) => p.topic === topicKey), [topicKey]);
  const algorithms = useMemo(() => {
    const q = term.trim().toLowerCase();
    return all.filter(
      (a) =>
        (difficulty === "All" || a.difficulty === difficulty) &&
        (!q || [a.label, a.technique, ...(a.tags || [])].filter(Boolean).join(" ").toLowerCase().includes(q))
    );
  }, [all, difficulty, term]);
  const easy = all.filter((a) => a.difficulty === "Easy").length;
  const medium = all.filter((a) => a.difficulty === "Medium").length;
  const hard = all.filter((a) => a.difficulty === "Hard").length;
  const visualizerCount = all.filter((a) => a.subpage).length;

  return (
    <PageShell>
      <div className="mb-8 grid gap-6 border-b border-border pb-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-stretch">
        <PageHeader
          className="mb-0 border-b-0 pb-0"
          breadcrumb={<Breadcrumb items={[{ label: "Visualizers", to: "/visualizers" }, { label: title }]} />}
          eyebrow={eyebrow}
          title={title}
          description={description}
          actions={
            all.length > 0 ? (
              <ul aria-label="Difficulty mix" className="flex flex-wrap items-center gap-4">
                <li className="font-mono text-small tabular-nums text-fg-muted">
                  {visualizerCount} {visualizerCount === 1 ? "visualizer" : "visualizers"}
                </li>
                {[
                  ["Easy", easy],
                  ["Medium", medium],
                  ["Hard", hard],
                ].map(([label, n]) =>
                  n > 0 ? (
                    <li key={label}>
                      <Difficulty value={label}>
                        {n} {label}
                      </Difficulty>
                    </li>
                  ) : null
                )}
              </ul>
            ) : null
          }
        />
        <div className="relative hidden min-h-[160px] border border-border bg-surface lg:block">
          <TopicHeroCanvas
            variant="scan"
            seed={topicKey}
            className="block h-full w-full"
            label={`Animation of a scan across bars for ${title}`}
          />
          {Icon ? (
            <span className="pointer-events-none absolute left-4 top-4 border border-border-strong bg-surface p-2 text-fg">
              <Icon size={32} strokeWidth={1.25} aria-hidden="true" />
            </span>
          ) : null}
        </div>
      </div>

      {all.length > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Tabs variant="segmented" value={difficulty} onValueChange={setDifficulty}>
            <TabsList aria-label="Filter by difficulty">
              {["All", "Easy", "Medium", "Hard"].map((d) => (
                <TabsTrigger key={d} value={d}>
                  {d}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search size={16} strokeWidth={1.5} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-dim" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Filter by name or pattern"
              aria-label={`Filter ${title} algorithms`}
              className="pl-9"
            />
          </div>
        </div>
      ) : null}

      {all.length === 0 ? (
        <EmptyState
          icon={Icon || undefined}
          title="No visualizers yet"
          description="Visualizers for this topic will appear here."
          action={
            <Button variant="secondary" asChild>
              <Link to="/visualizers">All topics</Link>
            </Button>
          }
        />
      ) : algorithms.length === 0 ? (
        <EmptyState
          title="No matches"
          description="No algorithms match this filter."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setDifficulty("All");
                setTerm("");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <Panel as="section" label={`Algorithms · ${algorithms.length}${algorithms.length !== all.length ? ` of ${all.length}` : ""}`} padded={false}>
          <div
            aria-hidden="true"
            className="flex h-9 items-center gap-3 border-b border-border bg-surface px-4 font-mono text-micro uppercase text-fg-dim"
          >
            <span className="w-4 shrink-0" />
            <span className="min-w-0 flex-1">Algorithm</span>
            <span className="flex shrink-0 items-center gap-2">
              <span className={COLS.pattern}>Pattern</span>
              <span className={COLS.time}>Time</span>
              <span className={COLS.number}>LeetCode</span>
              <span className={COLS.difficulty}>Difficulty</span>
              <span className="w-4" />
            </span>
          </div>
          <ul className="[&>li:last-child>*]:border-b-0">
            {algorithms.map((algo) => (
              <AlgorithmRow key={algo.subpage || algo.label} algo={algo} basePath={basePath} fallbackIcon={Icon} />
            ))}
          </ul>
        </Panel>
      )}
    </PageShell>
  );
};

export default TopicPage;
