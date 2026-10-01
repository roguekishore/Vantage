/**
 * TopicPage: compact PageHeader with a breadcrumb back to
 * the hub, then the topic's algorithms as a column-aligned ListRow list:
 * name + description, pattern tags, time complexity, LeetCode #, difficulty
 * (text + 2px left bar). Data: search/catalog filtered by `topicKey`.
 */

import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Hash } from "lucide-react";
import { problems as PROBLEM_CATALOG } from "../../search/catalog";
import { Badge, Breadcrumb, Button, EmptyState, ListRow, PageHeader, PageShell, Panel } from "@/components/ds";
import { cn } from "@/lib/utils";

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
  const algorithms = PROBLEM_CATALOG.filter((p) => p.topic === topicKey);
  const easy = algorithms.filter((a) => a.difficulty === "Easy").length;
  const medium = algorithms.filter((a) => a.difficulty === "Medium").length;
  const hard = algorithms.filter((a) => a.difficulty === "Hard").length;
  const visualizerCount = algorithms.filter((a) => a.subpage).length;

  return (
    <PageShell>
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: "Visualizers", to: "/visualizers" }, { label: title }]} />}
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          algorithms.length > 0 ? (
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

      {algorithms.length === 0 ? (
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
      ) : (
        <Panel as="section" label={`Algorithms · ${algorithms.length}`} padded={false}>
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
