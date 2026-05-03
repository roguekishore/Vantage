import React, { useState, useEffect, useCallback, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Trophy, Flame, Coins, Sparkles, Crown, Medal,
  ChevronLeft, ChevronRight, TrendingUp, Swords,
  Building2, Zap,
} from "lucide-react";
import { getStoredUser } from "@/services/userApi";
import {
  fetchGlobalXPLeaderboard, fetchWeeklyXPLeaderboard,
  fetchWeeklyCoinsLeaderboard, fetchStreakLeaderboard,
  fetchBattleRatingLeaderboard, fetchMyRank, fetchInstitutionLeaderboard,
} from "@/services/leaderboardApi";
import CustomCursor from "@/components/common/CustomCursor";
import { MONUMENT_TYPO } from "@/components/common/MonumentTypography";

const MF = MONUMENT_TYPO.fontFamily;
const ML = MONUMENT_TYPO.letterSpacing;
const ACCENT = "#EDFF66";
const ACCENT_GLOW = "#EDFF66";

/* ─── helpers ─── */

/* ─── config ─── */
const TABS = [
  { key: "global-xp",     label: "Global XP",  Icon: Sparkles,   color: ACCENT, glow: ACCENT_GLOW, weekly: false },
  { key: "weekly-xp",     label: "Weekly XP",   Icon: TrendingUp, color: ACCENT, glow: ACCENT_GLOW, weekly: true  },
  { key: "weekly-coins",  label: "Coins",        Icon: Coins,      color: ACCENT, glow: ACCENT_GLOW, weekly: true  },
  { key: "streaks",       label: "Streaks",      Icon: Flame,      color: ACCENT, glow: ACCENT_GLOW, weekly: false },
  { key: "battle-rating", label: "Battle",       Icon: Swords,     color: ACCENT, glow: ACCENT_GLOW, weekly: false },
  { key: "institution",   label: "Institution",  Icon: Building2,  color: ACCENT, glow: ACCENT_GLOW, weekly: false },
];
const FETCH = {
  "global-xp": fetchGlobalXPLeaderboard, "weekly-xp": fetchWeeklyXPLeaderboard,
  "weekly-coins": fetchWeeklyCoinsLeaderboard, "streaks": fetchStreakLeaderboard,
  "battle-rating": fetchBattleRatingLeaderboard,
};
const VL = { "global-xp": "XP", "weekly-xp": "XP", "weekly-coins": "Coins", "streaks": "Days", "battle-rating": "Rating", "institution": "XP" };
const PS = 20;
const RANK_CFG = {
  1: { Icon: Crown, color: "#fbbf24", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.22)" },
  2: { Icon: Medal, color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.22)" },
  3: { Icon: Medal, color: "#fb923c", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.22)" },
};

/* ════════════════════════════════════════
   BACKGROUND
════════════════════════════════════════ */
function Background({ color }) {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.028,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "180px",
      }} />
      <div style={{
        position: "absolute", top: "-15%", left: "30%", transform: "translateX(-50%)",
        width: 800, height: 500, borderRadius: "50%",
        background: `radial-gradient(ellipse 60% 100% at 50% 0%, ${color}0b 0%, transparent 70%)`,
        transition: "background 0.9s ease",
        animation: "orbPulse 9s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", top: "20%", right: "-8%",
        width: 460, height: 460, borderRadius: "50%",
        background: `radial-gradient(circle, ${color}05 0%, transparent 65%)`,
        animation: "orbFloat 14s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: "5%", left: "-8%",
        width: 380, height: 380, borderRadius: "50%",
        background: `radial-gradient(circle, ${color}04 0%, transparent 65%)`,
        animation: "orbFloat 18s ease-in-out infinite reverse",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)`,
        backgroundSize: "72px 72px",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 35%, #09090b 100%)",
      }} />
    </div>
  );
}

/* ════════════════════════════════════════
   AVATAR
════════════════════════════════════════ */
function Avatar({ name, size = 40, color, ringColor }) {
  const rc = ringColor || color || "rgba(255,255,255,0.1)";
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.3),
      background: color ? `${color}12` : "rgba(255,255,255,0.05)",
      border: `1.5px solid ${rc}40`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: MF, fontWeight: 900, fontSize: Math.round(size * 0.38),
      color: color || "rgba(255,255,255,0.45)",
      flexShrink: 0,
    }}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

/* ════════════════════════════════════════
   PODIUM — pixel-perfect, staggered
════════════════════════════════════════ */
const PODIUM_META = {
  1: { medalColor: "#fbbf24", barH: 148, avatarSize: 66, fontSize: 25, label: "GOLD"   },
  2: { medalColor: "#94a3b8", barH: 104, avatarSize: 54, fontSize: 20, label: "SILVER" },
  3: { medalColor: "#fb923c", barH: 76,  avatarSize: 50, fontSize: 18, label: "BRONZE" },
};

function PodiumSlot({ entry, rank }) {
  const cfg = PODIUM_META[rank];
  const [hov, setHov] = useState(false);

  if (!entry) return <div style={{ flex: 1 }} />;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
        transform: hov ? "translateY(-8px) scale(1.03)" : "translateY(0) scale(1)",
        transition: "transform 0.42s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      {/* label badge */}
      <div style={{
        fontSize: 7, fontWeight: 900, letterSpacing: "0.28em", textTransform: "uppercase",
        color: cfg.medalColor, opacity: 0.65, marginBottom: 7,
      }}>{cfg.label}</div>

      {/* avatar ring */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <div style={{
          width: cfg.avatarSize, height: cfg.avatarSize,
          borderRadius: Math.round(cfg.avatarSize * 0.26),
          background: `${cfg.medalColor}0e`,
          border: `2px solid ${cfg.medalColor}${rank === 1 ? "55" : "2e"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: MF, fontWeight: 900, fontSize: cfg.fontSize,
          color: cfg.medalColor,
          boxShadow: rank === 1 ? `0 0 32px ${cfg.medalColor}28, 0 0 70px ${cfg.medalColor}0e` : "none",
        }}>
          {entry.username?.charAt(0)?.toUpperCase() || "?"}
        </div>
        {/* medal pip */}
        <div style={{
          position: "absolute", bottom: -7, right: -7,
          width: rank === 1 ? 24 : 20, height: rank === 1 ? 24 : 20,
          borderRadius: 7, background: cfg.medalColor,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "2.5px solid #0d0d10",
          boxShadow: `0 0 12px ${cfg.medalColor}55`,
        }}>
          {rank === 1
            ? <Crown size={11} color="#000" strokeWidth={2.5} />
            : <span style={{ fontSize: 9, fontWeight: 900, color: "#000", lineHeight: 1 }}>{rank}</span>
          }
        </div>
      </div>

      {/* name */}
      <div style={{
        fontFamily: "'Inter', sans-serif", fontSize: rank === 1 ? 13 : 11, fontWeight: 700,
        color: rank === 1 ? "#fff" : "rgba(255,255,255,0.55)",
        letterSpacing: "-0.01em", textAlign: "center",
        maxWidth: 100,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        marginBottom: 3,
      }}>{entry.username}</div>

      {/* score */}
      <div style={{
        fontFamily: "'Inter', sans-serif", fontWeight: 800,
        fontSize: rank === 1 ? 21 : 16,
        letterSpacing: "-0.03em",
        color: cfg.medalColor,
        textShadow: `0 0 22px ${cfg.medalColor}50`,
        marginBottom: 12,
      }}>{entry.value?.toLocaleString()}</div>

      {/* bar */}
      <div style={{
        width: "100%", height: cfg.barH,
        borderRadius: "10px 10px 0 0",
        background: `linear-gradient(to top, ${cfg.medalColor}05, ${cfg.medalColor}12)`,
        border: `1px solid ${cfg.medalColor}20`,
        borderBottom: "none",
        position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* top shimmer */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${cfg.medalColor}50, transparent)`,
        }} />
        {/* ghost # */}
        <span style={{
          fontFamily: MF, fontSize: 32, fontWeight: 900,
          color: `${cfg.medalColor}15`, letterSpacing: "-0.04em",
        }}>#{rank}</span>
      </div>
    </div>
  );
}

function Podium({ entries }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const slots = ref.current.querySelectorAll(".pslot");
    gsap.fromTo(slots,
      { opacity: 0, y: 50, scale: 0.88 },
      { opacity: 1, y: 0, scale: 1, duration: 0.75, ease: "power4.out", stagger: { each: 0.1, from: "center" } }
    );
  }, [entries.length]);

  const first = entries[0], second = entries[1], third = entries[2];

  return (
    <div ref={ref} style={{
      display: "flex", alignItems: "flex-end", gap: 10,
      padding: "4px 16px 0",
    }}>
      <div className="pslot" style={{ flex: 1 }}><PodiumSlot entry={second} rank={2} /></div>
      <div className="pslot" style={{ flex: 1 }}><PodiumSlot entry={first}  rank={1} /></div>
      <div className="pslot" style={{ flex: 1 }}><PodiumSlot entry={third}  rank={3} /></div>
    </div>
  );
}

/* ════════════════════════════════════════
   TAB BAR
════════════════════════════════════════ */
function TabBar({ active, onChange }) {
  const pillRef = useRef(null);
  const refs = useRef([]);
  const activeTab = TABS.find(t => t.key === active);

  useEffect(() => {
    const idx = TABS.findIndex(t => t.key === active);
    const el = refs.current[idx];
    if (!el || !pillRef.current) return;
    gsap.to(pillRef.current, { x: el.offsetLeft, width: el.offsetWidth, duration: 0.38, ease: "power4.out" });
  }, [active]);

  return (
    <div style={{
      position: "relative", display: "flex",
      background: "rgba(255,255,255,0.025)", borderRadius: 12, padding: 4,
      border: "1px solid rgba(255,255,255,0.05)", overflowX: "auto", scrollbarWidth: "none",
    }}>
      <div ref={pillRef} style={{
        position: "absolute", top: 4, left: 4, height: "calc(100% - 8px)",
        background: `${activeTab?.color}12`, border: `1px solid ${activeTab?.color}28`,
        borderRadius: 8, pointerEvents: "none",
        boxShadow: `0 0 16px ${activeTab?.color}14`,
        transition: "background 0.38s, border-color 0.38s, box-shadow 0.38s",
      }} />
      {TABS.map((tab, i) => {
        const isActive = tab.key === active;
        return (
          <button key={tab.key} ref={el => refs.current[i] = el}
            onClick={() => onChange(tab.key)}
            style={{
              display: "flex", alignItems: "center", gap: 5, padding: "8px 12px",
              border: "none", cursor: "none", background: "transparent", borderRadius: 8,
              fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
              color: isActive ? tab.color : "rgba(255,255,255,0.26)",
              transition: "color 0.2s", whiteSpace: "nowrap", flexShrink: 0,
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.26)"; }}
          >
            <tab.Icon size={10} color={isActive ? tab.color : undefined} />
            {tab.label}
            {tab.weekly && (
              <span style={{
                fontSize: 7, fontWeight: 900, letterSpacing: "0.1em",
                color: activeTab?.color || ACCENT, background: `${activeTab?.color || ACCENT}12`,
                border: `1px solid ${activeTab?.color || ACCENT}28`, padding: "1px 4px", borderRadius: 3,
              }}>WK</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════
   MY RANK CARD
════════════════════════════════════════ */
function MyRankCard({ myRank, total, activeTab, color, glow }) {
  const barRef = useRef(null);
  const pct = total > 0 ? Math.max(2, Math.min(100, (myRank.rank / total) * 100)) : 50;

  useEffect(() => {
    if (!barRef.current) return;
    gsap.fromTo(barRef.current,
      { width: "0%" },
      { width: `${100 - pct}%`, duration: 1.4, ease: "power4.out", delay: 0.5 }
    );
  }, [pct]);

  return (
    <div style={{
      borderRadius: 14, overflow: "hidden",
      background: `linear-gradient(135deg, ${color}07 0%, transparent 70%)`,
      border: `1px solid ${color}1e`,
      boxShadow: `0 0 40px ${glow}0c`,
    }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${color}70, transparent)` }} />
      <div style={{ padding: "16px 18px 18px" }}>
        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 12 }}>
          Your Position
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{
            fontFamily: MF, fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1,
            fontSize: "clamp(2.2rem,4vw,3rem)", color,
            textShadow: `0 0 40px ${glow}50`, flexShrink: 0,
          }}>#{myRank.rank}</div>

          <div style={{ width: 1, height: 42, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />

          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            <Avatar name={myRank.username} size={42} color={color} />
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: MF, fontSize: 14, fontWeight: 900, color: "#fff",
                letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{myRank.username}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", marginTop: 2 }}>
                {myRank.value?.toLocaleString()} {VL[activeTab]}
              </div>
            </div>
          </div>

          <div style={{
            background: `${color}0a`, border: `1px solid ${color}1e`,
            borderRadius: 10, padding: "8px 14px", textAlign: "center", flexShrink: 0,
          }}>
            <div style={{ fontFamily: MF, fontSize: 18, fontWeight: 900, color, lineHeight: 1 }}>
              Top {Math.round(pct)}%
            </div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginTop: 3 }}>Percentile</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>Performance</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.18)", fontFamily: "monospace" }}>#{myRank.rank} of {total?.toLocaleString()}</span>
        </div>
        <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
          <div ref={barRef} style={{
            height: "100%", borderRadius: 3, width: "0%",
            background: `linear-gradient(90deg, ${glow}50, ${color})`,
            boxShadow: `0 0 8px ${glow}80`,
          }} />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   ROW
════════════════════════════════════════ */
function LBRow({ entry, isMe, vl, tabColor, tabGlow, idx }) {
  const rc = RANK_CFG[entry.rank];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "11px 18px",
      borderBottom: "1px solid rgba(255,255,255,0.035)",
      background: isMe ? `${tabColor}05` : "transparent",
      position: "relative",
      animation: `rowIn 0.38s ease-out ${idx * 0.028}s both`,
      transition: "background 0.18s", cursor: "none",
    }}
      onMouseEnter={e => { if (!isMe) e.currentTarget.style.background = "rgba(255,255,255,0.018)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = isMe ? `${tabColor}05` : "transparent"; }}
    >
      {rc ? (
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: rc.bg, border: `1px solid ${rc.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <rc.Icon size={13} color={rc.color} />
        </div>
      ) : (
        <div style={{ width: 28, flexShrink: 0, textAlign: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.18)", fontFamily: "monospace" }}>
            {String(entry.rank).padStart(2, "0")}
          </span>
        </div>
      )}

      <Avatar name={entry.username} size={34} color={isMe ? tabColor : undefined} ringColor={rc?.color} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700,
            color: isMe ? tabColor : rc ? rc.color : "#fff",
            letterSpacing: "-0.01em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{entry.username}</span>
          {isMe && (
            <span style={{
              fontSize: 7, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase",
              color: tabColor, background: `${tabColor}10`, border: `1px solid ${tabColor}22`,
              padding: "2px 6px", borderRadius: 4, flexShrink: 0,
            }}>YOU</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.18)" }}>Lv.{entry.level}</span>
          {entry.currentStreak > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 10, fontWeight: 700, color: isMe ? tabColor : "rgba(255,255,255,0.45)" }}>
              <Flame size={8} color={isMe ? tabColor : "rgba(255,255,255,0.45)"} />{entry.currentStreak}d
            </span>
          )}
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1,
          color: rc ? rc.color : isMe ? tabColor : "#fff",
          textShadow: rc ? `0 0 18px ${rc.color}40` : isMe ? `0 0 14px ${tabGlow}50` : "none",
        }}>{entry.value?.toLocaleString()}</div>
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginTop: 2 }}>{vl}</div>
      </div>
    </div>
  );
}

function Skeleton({ idx = 0 }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "11px 18px",
      borderBottom: "1px solid rgba(255,255,255,0.035)",
      animation: `rowIn 0.3s ease-out ${idx * 0.02}s both`,
    }}>
      {[28, 34].map((w, i) => (
        <div key={i} style={{ width: w, height: w, borderRadius: i ? 10 : 8, flexShrink: 0, background: "rgba(255,255,255,0.04)", animation: "shimmer 1.6s ease-in-out infinite" }} />
      ))}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ height: 10, width: "40%", borderRadius: 4, background: "rgba(255,255,255,0.04)", animation: "shimmer 1.6s ease-in-out infinite" }} />
        <div style={{ height: 8, width: "22%", borderRadius: 4, background: "rgba(255,255,255,0.03)", animation: "shimmer 1.6s ease-in-out infinite" }} />
      </div>
      <div style={{ width: 44, height: 13, borderRadius: 4, background: "rgba(255,255,255,0.04)", animation: "shimmer 1.6s ease-in-out infinite" }} />
    </div>
  );
}

function Pagination({ page, totalPages, onPage, color }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.045)",
    }}>
      <button onClick={() => onPage(Math.max(0, page - 1))} disabled={page === 0}
        style={{
          display: "flex", alignItems: "center", gap: 4, padding: "6px 14px",
          borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", background: "transparent",
          cursor: "none", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
          color: page === 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.45)",
          opacity: page === 0 ? 0.4 : 1, transition: "all 0.15s",
        }}
        onMouseEnter={e => { if (page > 0) { e.currentTarget.style.borderColor = color + "40"; e.currentTarget.style.color = color; } }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = page === 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.45)"; }}
      ><ChevronLeft size={12} /> Prev</button>

      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
        {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => (
          <button key={i} onClick={() => onPage(i)} style={{
            width: page === i ? 22 : 6, height: 6, borderRadius: 3,
            border: "none", cursor: "none", padding: 0,
            background: page === i ? color : "rgba(255,255,255,0.12)",
            boxShadow: page === i ? `0 0 8px ${color}60` : "none",
            transition: "all 0.32s cubic-bezier(0.34,1.56,0.64,1)",
          }} />
        ))}
      </div>

      <button onClick={() => onPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
        style={{
          display: "flex", alignItems: "center", gap: 4, padding: "6px 14px",
          borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", background: "transparent",
          cursor: "none", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
          color: page >= totalPages - 1 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.45)",
          opacity: page >= totalPages - 1 ? 0.4 : 1, transition: "all 0.15s",
        }}
        onMouseEnter={e => { if (page < totalPages - 1) { e.currentTarget.style.borderColor = color + "40"; e.currentTarget.style.color = color; } }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = page >= totalPages - 1 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.45)"; }}
      >Next <ChevronRight size={12} /></button>
    </div>
  );
}

/* ════════════════════════════════════════
   PAGE
════════════════════════════════════════ */
export default function LeaderboardPage() {
  const user     = getStoredUser();
  const pageRef  = useRef(null);
  const leftRef  = useRef(null);
  const rightRef = useRef(null);

  const [activeTab, setActiveTab] = useState("global-xp");
  const [page, setPage]           = useState(0);
  const [data, setData]           = useState(null);
  const [myRank, setMyRank]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [fading, setFading]       = useState(false);
  const [podiumPin, setPodiumPin] = useState({ left: null, width: null });

  const instId   = user?.institutionId   ?? null;
  const instName = user?.institutionName ?? null;
  const tab      = TABS.find(t => t.key === activeTab);
  const color    = tab?.color  || ACCENT;
  const glow     = tab?.glow   || ACCENT_GLOW;
  const isWeekly = tab?.weekly ?? false;

  const load = useCallback(async () => {
    if (activeTab === "institution" && !instId) { setData(null); setMyRank(null); setLoading(false); return; }
    setLoading(true);
    try {
      let pd, rd;
      if (activeTab === "institution") {
        pd = await fetchInstitutionLeaderboard(instId, page, PS); rd = null;
      } else {
        [pd, rd] = await Promise.all([
          FETCH[activeTab](page, PS),
          user?.uid ? fetchMyRank(user.uid, activeTab).catch(() => null) : null,
        ]);
      }
      setData(pd); setMyRank(rd);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [activeTab, page, user?.uid, instId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [activeTab]);

  useEffect(() => {
    const updatePodiumPin = () => {
      const el = rightRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPodiumPin({ left: rect.left, width: rect.width });
    };

    updatePodiumPin();
    window.addEventListener("resize", updatePodiumPin);

    let ro;
    if (typeof ResizeObserver !== "undefined" && rightRef.current) {
      ro = new ResizeObserver(updatePodiumPin);
      ro.observe(rightRef.current);
    }

    return () => {
      window.removeEventListener("resize", updatePodiumPin);
      if (ro) ro.disconnect();
    };
  }, []);

  const handleTabChange = (key) => {
    setFading(true);
    setTimeout(() => { setActiveTab(key); setFading(false); }, 160);
  };

  useGSAP(() => {
    // title lines
    gsap.fromTo(".title-word", { opacity: 0, y: 60, skewY: 4 }, {
      opacity: 1, y: 0, skewY: 0,
      duration: 0.95, ease: "power4.out", stagger: 0.1, delay: 0.1,
    });
    // hero line
    gsap.fromTo(".hero-rule", { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "expo.inOut", delay: 0.05, transformOrigin: "left" });
    // label
    gsap.fromTo(".hero-label", { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out", delay: 0.28 });
    // left staggered cards
    gsap.fromTo(leftRef.current?.querySelectorAll(".card-in") || [], {
      opacity: 0, y: 28,
    }, {
      opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.1, delay: 0.4,
    });

    gsap.fromTo(rightRef.current?.querySelectorAll(".card-in-right") || [], {
      opacity: 0, y: 28,
    }, {
      opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.1, delay: 0.5,
    });
  }, { scope: pageRef });

  const entries = data?.content || [];
  const top3 = entries.slice(0, 3);

  return (
    <div ref={pageRef} style={{
      minHeight: "100vh", background: "#09090b",
      paddingTop: 56, paddingBottom: 80, cursor: "none",
    }}>
      <CustomCursor />
      <Background color={color} />

      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: 1300, margin: "0 auto",
        padding: "48px clamp(16px,3vw,52px) 0",
      }}>

        {/* ══ SPLIT LAYOUT ══ */}
        <div className="split-grid" style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 7fr) minmax(0, 3fr)",
          gap: 22,
          alignItems: "start",
        }}>

          {/* ════ LEFT ════ */}
          <div ref={leftRef} style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>

            {/* HEADER */}
            <div>
              <div className="hero-rule" style={{
                height: 1,
                background: `linear-gradient(90deg, ${color}55, transparent)`,
                marginBottom: 20,
              }} />

              <div className="hero-label" style={{
                fontSize: 9, fontWeight: 900, letterSpacing: "0.36em",
                textTransform: "uppercase", color, opacity: 0.7,
                display: "flex", alignItems: "center", gap: 6, marginBottom: 14,
              }}>
                <Zap size={9} color={color} />
                Rankings
              </div>

              <h1 style={{ margin: 0, lineHeight: 0.92, overflow: "hidden" }}>
                <div style={{ overflow: "hidden" }}>
                  <div className="title-word" style={{
                    fontFamily: MF, fontWeight: 900,
                    fontSize: "clamp(3.2rem,5.5vw,5.2rem)",
                    letterSpacing: ML.monument,
                    color: "#fff", textShadow: `0 0 80px ${glow}35`,
                    transition: "text-shadow 0.5s ease",
                    whiteSpace: "nowrap",
                  }}>Leaderboard</div>
                </div>
              </h1>

              <p style={{
                fontSize: 12, color: "rgba(255,255,255,0.24)", marginTop: 14,
                lineHeight: 1.9, maxWidth: 280,
              }}>
                Rise through the ranks. Every point counts.
              </p>
            </div>

            {/* MY RANK */}
            {myRank && (
              <div className="card-in">
                <MyRankCard myRank={myRank} total={data?.totalElements} activeTab={activeTab} color={color} glow={glow} />
              </div>
            )}

            {/* INSTITUTION NOTE */}
            {activeTab === "institution" && (
              <div className="card-in" style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 13px",
                borderRadius: 10, width: "fit-content",
                background: `${color}0a`, border: `1px solid ${color}24`,
              }}>
                <Building2 size={12} color={color} />
                {instName
                  ? <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Rankings within <strong style={{ color: "#fff" }}>{instName}</strong></span>
                  : <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>You're not part of any institution.</span>}
              </div>
            )}

            {/* TABLE CARD */}
            <div className="card-in" style={{
              background: "#0d0d10",
              border: "1px solid rgba(255,255,255,0.055)",
              borderRadius: 16, overflow: "hidden",
              boxShadow: `0 0 60px ${glow}07, 0 32px 64px rgba(0,0,0,0.35)`,
              opacity: fading ? 0.4 : 1,
              transform: fading ? "translateY(6px)" : "translateY(0)",
              transition: "opacity 0.16s, transform 0.16s",
            }}>
              {/* TAB BAR */}
              <div style={{ padding: "10px 10px 0" }}>
                <TabBar active={activeTab} onChange={handleTabChange} />
              </div>

              {/* sub-header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 18px 9px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                marginTop: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {tab && <tab.Icon size={10} color={color} />}
                  <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>
                    {tab?.label} Rankings{activeTab === "institution" && instName ? ` · ${instName}` : ""}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {data?.totalElements != null && !isWeekly && (
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>{data.totalElements.toLocaleString()}</span> ranked
                    </span>
                  )}
                  {data?.totalPages > 1 && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.15)", fontFamily: "monospace" }}>
                      {page + 1}/{data.totalPages}
                    </span>
                  )}
                </div>
              </div>

              {/* ROWS */}
              <div>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} idx={i} />)
                  : !entries.length
                    ? (
                      <div style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        padding: "56px 24px", textAlign: "center", gap: 12,
                      }}>
                        <div style={{
                          width: 52, height: 52, borderRadius: 14,
                          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Trophy size={20} color="rgba(255,255,255,0.1)" />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.28)" }}>
                          {activeTab === "institution" && !instId ? "Join an institution first" : "No data yet"}
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.16)", lineHeight: 1.8, maxWidth: 240 }}>
                          {activeTab === "institution" && !instId
                            ? "Institution rankings require membership."
                            : "Solve problems and compete to appear here."}
                        </div>
                      </div>
                    )
                    : entries.map((entry, i) => (
                      <LBRow key={`${entry.userId}-${entry.rank}`} entry={entry}
                        isMe={user?.uid === entry.userId} vl={VL[activeTab]}
                        tabColor={color} tabGlow={glow} idx={i} />
                    ))
                }
              </div>

              {data?.totalPages > 1 && (
                <Pagination page={page} totalPages={data.totalPages} onPage={setPage} color={color} />
              )}
            </div>

          </div>{/* end left */}

          {/* ════ RIGHT ════ */}
          <div
            ref={rightRef}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              minWidth: 0,
              minHeight: 320,
            }}
          >
            <div className="card-in-right lb-podium-fixed" style={{
              background: "#0d0d10",
              border: "1px solid rgba(255,255,255,0.055)",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: `0 0 60px ${glow}07, 0 32px 64px rgba(0,0,0,0.35)`,
              position: podiumPin.width ? "fixed" : "relative",
              top: podiumPin.width ? 104 : "auto",
              left: podiumPin.left ?? "auto",
              width: podiumPin.width ?? "100%",
              zIndex: 3,
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>
                  Top 3
                </span>
                <Trophy size={12} color={color} />
              </div>

              <div style={{ padding: "10px 0 0" }}>
                <Podium entries={top3} />
              </div>
            </div>
          </div>{/* end right */}

        </div>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 0; height: 0; }

        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.32; }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes orbPulse {
          0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
          50%       { opacity: 0.62; transform: translateX(-50%) scale(1.08); }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-26px); }
        }

        @media (max-width: 860px) {
          .split-grid {
            grid-template-columns: 1fr !important;
          }
          .lb-podium-fixed {
            position: static !important;
            left: auto !important;
            width: 100% !important;
            top: auto !important;
          }
        }
      `}</style>
    </div>
  );
}