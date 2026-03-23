import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import topics from "../data/topics";
import { problems as PROBLEM_CATALOG } from "../search/catalog";
import { topicConfig, getTopicByKey } from "../routes/config";
import { MONUMENT_TYPO } from "../components/MonumentTypography";
import { COMPLEX_ALGO_CONFIGS, ComplexAlgoCanvas } from "../components/ComplexAnimations";
import CustomCursor from "../components/CustomCursor";
import "./HomePage.css";
import TopicPixelCard from "../components/TopicPixelCard";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";

const BATTLE_HEADER_FONT_FAMILY = MONUMENT_TYPO.fontFamily;
const BATTLE_HEADER_LETTER_SPACING = MONUMENT_TYPO.letterSpacing.monument;

const TopicGrid = () => (
  <div className="category-grid">
    {topics.map((topic) => (
      <TopicPixelCard key={topic.name} topic={topic} />
    ))}
  </div>
);

const SearchBar = ({
  query,
  onQueryChange,
  results,
  onSelect,
  open,
  setOpen,
  onSubmit,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-white/10 bg-[#0d0d10] p-4">
      <form onSubmit={onSubmit} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-[13px] w-[13px] text-white/20" />
        <Input
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search problems, topics, tags…"
          className="h-10 rounded-[10px] border border-white/10 bg-white/[0.04] pl-9 pr-9 text-[13px] text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-[#EDFF66]/30"
          aria-label="Search problems or topics"
        />
        {query && (
          <button
            type="button"
            onClick={() => { onQueryChange(""); setOpen(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
          >
            <X className="h-[13px] w-[13px]" />
          </button>
        )}
      </form>

      {open && query && (
        <div className="mt-2 bg-[#0d0d10] border border-white/10 rounded-[10px] overflow-hidden max-h-80 overflow-y-auto z-50" role="listbox">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-white/35">
              No matches found for "<span className="font-medium text-white">{query}</span>"
            </div>
          ) : (
            <div className="py-1">
              {results.map((item) => (
                <button
                  key={`${item.type}-${item.label}`}
                  type="button"
                  className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onSelect(item)}
                >
                  <Badge variant={item.type === "problem" ? "secondary" : "outline"} className="text-[10px] uppercase tracking-wider shrink-0">
                    {item.type === "problem" ? "Problem" : "Topic"}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                    {item.type === "problem" && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {item.topic}
                        {item.platforms?.length ? ` · ${item.platforms.join(", ")}` : ""}
                      </p>
                    )}
                    {item.type === "topic" && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.topic}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TopicsPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const totalProblems = useMemo(
    () => PROBLEM_CATALOG.filter((problem) => problem.topic && problem.subpage).length,
    []
  );
  const configuredTopicsCount = useMemo(() => Object.keys(topicConfig || {}).length, []);
  const coverage = topics.length > 0
    ? Math.min(100, Math.round((configuredTopicsCount / topics.length) * 100))
    : 0;

  const searchIndex = useMemo(() => {
    const topicItems = topics.map((topic) => {
      const config = getTopicByKey(topic.page);
      return {
        type: "topic",
        label: topic.name,
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
      handleSelect(results[0]);
    }
  };

  return (
    <div className="relative min-h-screen w-screen bg-background pt-24 md:pt-28" style={{ cursor: "none" }}>
      <CustomCursor />

      {/* Masked complex animation background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.15,
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 82%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 82%, transparent 100%)",
        }}
      >
        <div
          style={{
            width: "100vw",
            height: "100vh",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            border: "1px solid rgba(255,255,255,0.04)",
            background: "rgba(255,255,255,0.005)",
          }}
        >
          {["nqueens", "knightstour"].map((key, index) => (
            <div
              key={key}
              style={{
                position: "relative",
                overflow: "hidden",
                borderRight: index === 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                background: "rgba(255,255,255,0.006)",
              }}
            >
              <div style={{ position: "absolute", inset: 0 }}>
                <ComplexAlgoCanvas algo={COMPLEX_ALGO_CONFIGS[key]} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="home-content" style={{ position: "relative", zIndex: 1 }}>
        {/* ── Hero ── */}
        <section style={{ position: "relative", overflow: "hidden" }}>
          {/* <div style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
            userSelect: "none",
            whiteSpace: "nowrap",
            fontFamily: BATTLE_HEADER_FONT_FAMILY,
            fontWeight: 900,
            fontSize: "clamp(4.8rem,13vw,10rem)",
            letterSpacing: "-0.02em",
            color: "rgba(255,255,255,0.03)",
            lineHeight: 0.9,
          }}>
            TOPICS
          </div> */}

          <div className="tp-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 30, alignItems: "end", paddingBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.05)", position: "relative" }}>
            <div>
              <div className="tp-hero-text" style={{ opacity: 1, fontSize: 9, fontWeight: 900, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: 14 }}>
                - Learning Hub
              </div>

              <h1 className="tp-hero-text" style={{ opacity: 1, fontFamily: BATTLE_HEADER_FONT_FAMILY, letterSpacing: "-0.02em", fontWeight: 900, fontSize: "clamp(2.6rem,5vw,4.8rem)", lineHeight: 0.9, margin: "0 0 14px" }}>
                <span style={{ color: "#fff", display: "block" }}>Explore</span>
                <span style={{ color: "#34d399", display: "block" }}>Topics.</span>
              </h1>

              <p className="tp-hero-text" style={{ opacity: 1, fontSize: 14, color: "rgba(255,255,255,0.3)", lineHeight: 1.7, maxWidth: 430 }}>
                Pick a track, discover core patterns, and jump straight into interactive algorithm visualizers.
              </p>
            </div>

            <div className="tp-hero-text tp-hero-stats" style={{ opacity: 1, display: "flex", flexDirection: "column", gap: 0, flexShrink: 0, minWidth: 250, background: "#0d0d10", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ height: 2, background: "linear-gradient(90deg,#34d399,rgba(52,211,153,0.2))" }} />

              <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 6 }}>
                  Topic Overview
                </div>
                <div style={{ fontFamily: BATTLE_HEADER_FONT_FAMILY, letterSpacing: "-0.015em", fontSize: 30, fontWeight: 900, color: "#34d399", lineHeight: 1, textShadow: "0 0 24px rgba(52,211,153,0.28)" }}>
                  {topics.length}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                {[
                  { label: "Topics", value: topics.length, color: "#34d399" },
                  { label: "Problems", value: totalProblems, color: "#fbbf24" },
                  { label: "Rate", value: `${coverage}%`, color: "#EDFF66" },
                ].map((metric, index) => (
                  <div key={metric.label} style={{ padding: "12px 14px", borderRight: index < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <div style={{ fontFamily: BATTLE_HEADER_FONT_FAMILY, fontSize: 17, fontWeight: 900, color: metric.color, lineHeight: 1, marginBottom: 3, textShadow: `0 0 14px ${metric.color}30` }}>
                      {metric.value}
                    </div>
                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>{metric.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "10px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${coverage}%`, borderRadius: 3, background: "linear-gradient(90deg,#34d399,#EDFF66)", boxShadow: "0 0 6px rgba(52,211,153,0.35)", transition: "width 0.7s ease-out" }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Search ── */}
        <section className="pb-2">
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            results={results}
            onSelect={handleSelect}
            open={open}
            setOpen={setOpen}
            onSubmit={handleSubmit}
          />
        </section>

        {/* ── Topic Grid ── */}
        <section>
          <TopicGrid />
        </section>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .tp-hero-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .tp-hero-stats { min-width: 0 !important; width: 100% !important; }
        }
      `}</style>
    </div>
  );
};

export default TopicsPage;
