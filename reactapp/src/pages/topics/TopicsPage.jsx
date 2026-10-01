import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import topics from "../../data/topics";
import { problems as PROBLEM_CATALOG } from "../../search/catalog";
import { getTopicByKey } from "../../routes/config";
import { Badge, IconButton, Input, Kbd, PageHeader, PageShell, Panel, Stat } from "@/components/ds";
import { cn } from "@/lib/utils";
import TopicHeroCanvas from "./TopicHeroCanvas";

/*
 * Visualizers hub: PageHeader, full-width search with a
 * `/` shortcut, then a grid of topic tiles (icon, name, count, difficulty
 * mix). Topic list comes from data/topics; counts from search/catalog.
 */

const DIFFICULTIES = [
  { key: "Easy", label: "Easy", bar: "bg-ok", text: "text-ok" },
  { key: "Medium", label: "Medium", bar: "bg-warn", text: "text-warn" },
  { key: "Hard", label: "Hard", bar: "bg-err", text: "text-err" },
];

// "BinarySearch" -> "Binary Search"; other names already read as prose.
const displayName = (name) => name.replace(/([a-z])([A-Z])/g, "$1 $2");

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function DifficultyMix({ counts, total }) {
  return (
    <dl className="grid grid-cols-3 gap-3">
      {DIFFICULTIES.map((d) => {
        const n = counts[d.key] || 0;
        const pct = total > 0 ? Math.round((n / total) * 100) : 0;
        return (
          <div key={d.key} className="grid gap-1">
            <div className="flex items-baseline justify-between gap-2 font-mono text-micro uppercase tabular-nums">
              <dt className="text-fg-dim">{d.label}</dt>
              <dd className={n > 0 ? d.text : "text-fg-dim"}>{n}</dd>
            </div>
            <div aria-hidden="true" className="h-0.5 w-full bg-elevated">
              <div className={cn("h-full", d.bar)} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </dl>
  );
}

function TopicTile({ topic }) {
  const Icon = topic.icon;
  const config = getTopicByKey(topic.page);
  const routePath = config?.path || `/${topic.page.toLowerCase()}`;
  const name = displayName(topic.name);

  const { total, counts, sample } = useMemo(() => {
    const list = PROBLEM_CATALOG.filter((p) => p.topic === topic.page && p.subpage);
    const c = { Easy: 0, Medium: 0, Hard: 0 };
    list.forEach((p) => {
      if (c[p.difficulty] !== undefined) c[p.difficulty] += 1;
    });
    return { total: list.length, counts: c, sample: list.slice(0, 3).map((p) => p.label) };
  }, [topic.page]);

  return (
    <Panel as={Link} to={routePath} variant="interactive" className="h-full" bodyClassName="h-full">
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          {Icon ? <Icon size={20} strokeWidth={1.5} aria-hidden="true" className="text-fg" /> : <span />}
          <Badge tone="neutral">
            {total} {total === 1 ? "visualizer" : "visualizers"}
          </Badge>
        </div>
        <div className="grid gap-1">
          <h3 className="font-mono text-h3 text-fg">{name}</h3>
          {topic.description ? (
            <p className="line-clamp-2 font-mono text-small text-fg-muted">{topic.description}</p>
          ) : null}
        </div>
        {sample.length > 0 ? (
          <ul aria-label="Example algorithms" className="grid gap-1 border-t border-border pt-3 font-mono text-small text-fg-muted">
            {sample.map((label) => (
              <li key={label} className="truncate">
                <span aria-hidden="true" className="mr-2 text-fg-dim">/</span>
                {label}
              </li>
            ))}
            {total > sample.length ? (
              <li className="text-micro uppercase text-fg-dim">+{total - sample.length} more</li>
            ) : null}
          </ul>
        ) : null}
        <div className="mt-auto">
          <DifficultyMix counts={counts} total={total} />
        </div>
      </div>
    </Panel>
  );
}

function SearchBar({ inputRef, query, onQueryChange, results, onSelect, open, setOpen, onSubmit, activeIndex, setActiveIndex }) {
  const listId = "visualizer-search-results";
  const showList = open && query;

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    }
  };

  return (
    <form onSubmit={onSubmit} role="search" className="relative">
      <Search
        size={16}
        strokeWidth={1.5}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-dim"
      />
      <Input
        ref={inputRef}
        size="lg"
        value={query}
        onChange={(event) => {
          onQueryChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder="Search algorithms, topics, tags"
        aria-label="Search visualizers and topics"
        role="combobox"
        aria-expanded={Boolean(showList)}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-keyshortcuts="/"
        aria-activedescendant={showList && results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
        autoComplete="off"
        className="pl-10 pr-20"
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2">
        {query ? (
          <IconButton
            icon={X}
            size="sm"
            aria-label="Clear search"
            onClick={() => {
              onQueryChange("");
              setOpen(false);
              inputRef.current?.focus();
            }}
          />
        ) : null}
        <Kbd aria-hidden="true">/</Kbd>
      </div>

      {showList ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Search results"
          className="absolute inset-x-0 top-full z-overlay mt-1 max-h-80 overflow-y-auto border border-border-strong bg-surface"
        >
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center font-mono text-small text-fg-muted">
              No matches for &ldquo;<span className="text-fg">{query}</span>&rdquo;
            </p>
          ) : (
            results.map((item, index) => {
              const active = index === activeIndex;
              const meta =
                item.type === "problem"
                  ? `${displayName(item.topic)}${item.platforms?.length ? ` · ${item.platforms.join(", ")}` : ""}`
                  : null;
              return (
                <button
                  key={`${item.type}-${item.label}`}
                  id={`${listId}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  tabIndex={-1}
                  className={cn(
                    "flex min-h-12 w-full items-center gap-3 border-b border-border px-4 py-2 text-left font-mono last:border-b-0",
                    "transition-colors duration-[120ms] ease-out ds-hover:bg-elevated",
                    active && "bg-elevated"
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => onSelect(item)}
                >
                  <Badge tone={item.type === "problem" ? "neutral" : "outline"} className="shrink-0">
                    {item.type === "problem" ? "Algorithm" : "Topic"}
                  </Badge>
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate text-body text-fg">{item.label}</span>
                    {meta ? <span className="truncate text-small text-fg-muted">{meta}</span> : null}
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </form>
  );
}

const TopicsPage = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const totalProblems = useMemo(
    () => PROBLEM_CATALOG.filter((problem) => problem.topic && problem.subpage).length,
    []
  );

  const overview = useMemo(() => {
    const c = { Easy: 0, Medium: 0, Hard: 0 };
    PROBLEM_CATALOG.forEach((p) => {
      if (p.topic && p.subpage && c[p.difficulty] !== undefined) c[p.difficulty] += 1;
    });
    return c;
  }, []);

  const searchIndex = useMemo(() => {
    const topicItems = topics.map((topic) => {
      const config = getTopicByKey(topic.page);
      return {
        type: "topic",
        label: displayName(topic.name),
        topic: topic.page,
        path: config?.path || `/${topic.page.toLowerCase()}`,
        keywords: [topic.name.toLowerCase()],
      };
    });

    const problemItems = PROBLEM_CATALOG
      .filter((problem) => problem.topic && problem.subpage)
      .map((problem) => {
        const config = getTopicByKey(problem.topic);
        return {
          type: "problem",
          ...problem,
          topicPath: config?.path || `/${problem.topic.toLowerCase()}`,
        };
      });

    return [...topicItems, ...problemItems];
  }, []);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    const tokens = term.split(/\s+/);
    const matches = searchIndex.filter((item) => {
      const haystack = [
        item.label?.toLowerCase?.() || "",
        item.topic?.toLowerCase?.() || "",
        ...(item.keywords || []),
      ].join(" ");
      return tokens.every((token) => haystack.includes(token));
    });

    return matches.slice(0, 10);
  }, [query, searchIndex]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // "/" focuses the search from anywhere on the page.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(document.activeElement)) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSelect = (item) => {
    if (item.type === "topic") {
      navigate(item.path);
    } else {
      navigate(`${item.topicPath}/${item.subpage}`);
    }
    setOpen(false);
    setQuery("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (results.length > 0) {
      handleSelect(results[activeIndex] || results[0]);
    }
  };

  return (
    <PageShell>
      <div className="mb-8 grid gap-6 border-b border-border pb-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-stretch">
        <PageHeader
          className="mb-0 border-b-0 pb-0"
          eyebrow="Learn"
          title="Visualizers"
          description={`${totalProblems} step-by-step algorithm visualizers across ${topics.length} topics. Pick a topic, or search by algorithm name or keyword.`}
        />
        <div className="hidden min-h-[220px] border border-border bg-surface lg:block">
          <TopicHeroCanvas
            variant="tree"
            className="block h-full w-full"
            label="Animation of a breadth-first walk over a binary tree"
          />
        </div>
      </div>

      <Panel as="section" aria-label="Catalog overview" className="mb-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <Stat label="Topics" value={topics.length} />
          <Stat label="Easy" value={overview.Easy} />
          <Stat label="Medium" value={overview.Medium} />
          <Stat label="Hard" value={overview.Hard} />
        </div>
      </Panel>

      <section aria-label="Search" className="mb-8">
        <SearchBar
          inputRef={inputRef}
          query={query}
          onQueryChange={setQuery}
          results={results}
          onSelect={handleSelect}
          open={open}
          setOpen={setOpen}
          onSubmit={handleSubmit}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
        />
      </section>

      <section aria-labelledby="topics-heading">
        <h2 id="topics-heading" className="mb-4 font-mono text-label uppercase text-fg-muted">
          Topics · <span className="tabular-nums">{topics.length}</span>
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <li key={topic.name} className="min-w-0">
              <TopicTile topic={topic} />
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
};

export default TopicsPage;
