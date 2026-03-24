import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import useBattleStore from "../stores/useBattleStore";
import useFriendsStore from "../stores/useFriendsStore";
import { getStoredUser } from "../services/userApi";
import { fetchPlayerStats } from "../services/gamificationApi";
import { fetchBattleHistory } from "../services/battleApi";
import {
  Swords, Loader2, X, Check, Trophy, Zap, Crown,
  Clock, ArrowUp, ArrowDown, Minus, ChevronRight,
  History, AlertTriangle, Users, Search, RotateCcw,
} from "lucide-react";
import CustomCursor from "../components/CustomCursor";
import { MONUMENT_TYPO } from "../components/MonumentTypography";

const BATTLE_FONT_FAMILY = MONUMENT_TYPO.fontFamily;
const BATTLE_FONT_LETTER_SPACING = MONUMENT_TYPO.letterSpacing.monument;

/* ═══ Config ══════════════════════════════════════════════ */
const MODES = [
  { value: "CASUAL_1V1", label: "Casual", desc: "No rating changes. Warm up.", icon: Zap },
  { value: "RANKED_1V1", label: "Ranked", desc: "ELO on the line. Prove it.", icon: Crown },
];
const DIFFICULTIES = [
  { value: "EASY", label: "Easy", color: "#34d399", dot: "#10b981" },
  { value: "MEDIUM", label: "Medium", color: "#fbbf24", dot: "#f59e0b" },
  { value: "HARD", label: "Hard", color: "#f87171", dot: "#ef4444" },
];
const PROBLEM_COUNTS = [1, 2, 3];
const QUICK_DURATION_OPTIONS = [20, 30, 45, 60, 90, 120, 150, 180];
const LANGUAGES = [{ value: "cpp", label: "C++" }, { value: "java", label: "Java" }];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const OUTCOME = {
  WIN: { color: "#34d399", label: "Win", Icon: Trophy },
  LOSS: { color: "#f87171", label: "Loss", Icon: X },
  DRAW: { color: "#fbbf24", label: "Draw", Icon: Minus },
  FORFEIT: { color: "rgba(255,255,255,0.25)", label: "Forfeit", Icon: X },
};

/* ═══ Shared sub-components ══════════════════════════════ */
function Avatar({ name, size = 36, accent }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, flexShrink: 0,
      background: accent ? `${accent}0f` : "rgba(255,255,255,0.05)",
      border: `1px solid ${accent ? `${accent}22` : "rgba(255,255,255,0.08)"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING, fontWeight: 900,
      fontSize: size > 40 ? 18 : 14, color: accent || "rgba(255,255,255,0.5)"
    }}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

function SectionRule({ label, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "0 0 20px" }}>
      <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.05)" }} />
      <span style={{
        fontSize: 9, fontWeight: 900, letterSpacing: "0.28em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.22)"
      }}>
        {label}
      </span>
      <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.05)" }} />
    </div>
  );
}

/* ═══ Loading / Not-logged-in screens ════════════════════ */
function CenteredCard({ children }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#09090b", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24
    }}>
      <CustomCursor />
      <div style={{
        background: "#0d0d10", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 18, padding: 40, width: "100%", maxWidth: 380,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 24, textAlign: "center"
      }}>
        {children}
      </div>
    </div>
  );
}

/* ═══ Queue searching screen ═════════════════════════════ */
function QueueScreen({ mode, difficulty, problemCount, durationMinutes, onCancel }) {
  const canvasRef = useRef(null);

  // Radar animation on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    const cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 16;

    let angle = 0, animId;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);

      // Rings
      [1, 0.66, 0.33].forEach(scale => {
        ctx.beginPath();
        ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Cross hairs
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();

      // Sweep
      const gradient = ctx.createConicalGradient
        ? null
        : (() => {
          const g = ctx.createLinearGradient(cx, cy, cx + r, cy);
          g.addColorStop(0, "rgba(237,255,102,0.18)");
          g.addColorStop(1, "rgba(237,255,102,0)");
          return g;
        })();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, -0.5, 0.5);
      ctx.closePath();
      ctx.fillStyle = "rgba(237,255,102,0.06)";
      ctx.fill();

      // Sweep line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r, 0);
      ctx.strokeStyle = "rgba(237,255,102,0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Random blips
      const blips = [
        { a: 0.8, d: 0.55 },
        { a: 2.1, d: 0.78 },
        { a: 4.5, d: 0.38 },
        { a: 5.2, d: 0.85 },
      ];
      blips.forEach(b => {
        const diff = ((b.a - angle) + Math.PI * 2) % (Math.PI * 2);
        if (diff < 1.2) {
          const alpha = (1 - diff / 1.2) * 0.9;
          const bx = cx + Math.cos(b.a) * r * b.d;
          const by = cy + Math.sin(b.a) * r * b.d;
          ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(237,255,102,${alpha})`;
          ctx.shadowColor = "#EDFF66";
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      angle = (angle + 0.018) % (Math.PI * 2);
      animId = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(animId);
  }, []);

  const diffColor = DIFFICULTIES.find(d => d.value === difficulty)?.color || "#fff";

  return (
    <div style={{
      minHeight: "100vh", background: "#09090b", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24, cursor: "none"
    }}>
      <CustomCursor />

      {/* Grain */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", opacity: 0.025,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundSize: "200px"
      }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 36, maxWidth: 320 }}>

        {/* Radar canvas */}
        <div style={{ position: "relative", width: 180, height: 180 }}>
          <canvas ref={canvasRef} style={{ width: 180, height: 180, display: "block" }} />
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center"
          }}>
            <Swords size={28} color="rgba(255,255,255,0.85)" />
          </div>
        </div>

        {/* Text */}
        <div style={{ textAlign: "center" }}>
          <h2 style={{
            fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING, fontSize: 26, fontWeight: 900,
            color: "#fff", lineHeight: 1, marginBottom: 12
          }}>
            Finding opponent
          </h2>
          {/* Match config chips */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
            {[
              { label: mode.replace("_1V1", ""), color: mode === "RANKED_1V1" ? "#EDFF66" : "rgba(255,255,255,0.4)" },
              { label: difficulty, color: diffColor },
              { label: `${problemCount}P`, color: "rgba(255,255,255,0.4)" },
              { label: `${durationMinutes}M`, color: "rgba(255,255,255,0.4)" },
            ].map(({ label, color }) => (
              <span key={label} style={{
                fontSize: 9, fontWeight: 900, letterSpacing: "0.2em",
                textTransform: "uppercase", color, background: `${color}10`,
                border: `1px solid ${color}25`, padding: "3px 9px", borderRadius: 6
              }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          width: "100%", height: 2, borderRadius: 2,
          background: "rgba(255,255,255,0.06)", overflow: "hidden"
        }}>
          <div style={{
            height: "100%", width: "45%", background: "#EDFF66",
            borderRadius: 2, boxShadow: "0 0 8px rgba(237,255,102,0.5)",
            animation: "scanBar 2s ease-in-out infinite alternate"
          }} />
        </div>

        <button onClick={onCancel} style={{
          background: "none", border: "none", cursor: "none",
          fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.28)", transition: "color 0.15s"
        }}
          onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.28)"}
        >Cancel Search</button>
      </div>

      <style>{`@keyframes scanBar { 0%{margin-left:0} 100%{margin-left:55%} }`}</style>
    </div>
  );
}

/* ═══ Lobby waiting screen ═══════════════════════════════ */
function LobbyWaitScreen({ lobby, language, onReady, onLeave, loading }) {
  const ref = useRef(null);

  useGSAP(() => {
    gsap.fromTo(".lby-in", { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: "power3.out" });
  }, { scope: ref });

  return (
    <div ref={ref} style={{
      minHeight: "100vh", background: "#09090b",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, position: "relative", overflow: "hidden", cursor: "none"
    }}>
      <CustomCursor />

      {/* Diagonal stripes */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.03 }} preserveAspectRatio="xMidYMid slice">
          <defs><pattern id="diag" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="36" stroke="white" strokeWidth="1" />
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#diag)" />
        </svg>
        <div style={{
          position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(248,113,113,0.06) 0%, transparent 65%)"
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 520 }}>
        <div className="lby-in" style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 9, fontWeight: 900, letterSpacing: "0.3em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.22)", marginBottom: 10
          }}>- Match Found</div>
          <h1 style={{
            fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING, fontSize: "clamp(2.4rem,5vw,4rem)",
            fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: 6
          }}>
            Ready Up
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Both players must confirm to begin.</p>
        </div>

        {/* Main card */}
        <div className="lby-in" style={{
          background: "#0d0d10",
          border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, overflow: "hidden"
        }}>

          {/* 2px red accent top */}
          <div style={{ height: 2, background: "linear-gradient(90deg,#ef4444,#f87171)" }} />

          <div style={{ padding: "32px 28px" }}>
            {/* VS row */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 60px 1fr",
              gap: 16, alignItems: "center", marginBottom: 28
            }}>

              {/* You */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <span style={{
                  fontSize: 9, fontWeight: 900, letterSpacing: "0.22em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.2)"
                }}>YOU</span>
                <Avatar name={lobby.you.username} size={52} accent="#c4b5fd" />
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING, fontSize: 14, fontWeight: 900,
                    color: "#fff", marginBottom: 2
                  }}>{lobby.you.username}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                    ⚡ {lobby.you.battleRating} · Lv.{lobby.you.level}
                  </div>
                </div>
                {/* Ready status */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
                  borderRadius: 20, border: `1px solid ${lobby.you.isReady ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.08)"}`,
                  background: lobby.you.isReady ? "rgba(52,211,153,0.08)" : "transparent"
                }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: lobby.you.isReady ? "#34d399" : "rgba(255,255,255,0.2)",
                    boxShadow: lobby.you.isReady ? "0 0 6px rgba(52,211,153,0.7)" : "none"
                  }} />
                  <span style={{
                    fontSize: 9, fontWeight: 900, letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: lobby.you.isReady ? "#34d399" : "rgba(255,255,255,0.3)"
                  }}>
                    {lobby.you.isReady ? "Ready" : "Waiting"}
                  </span>
                </div>
              </div>

              {/* VS */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)"
                }}>
                  <Swords size={16} color="#f87171" />
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 900, letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.4)"
                }}>VS</span>
              </div>

              {/* Opponent */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <span style={{
                  fontSize: 9, fontWeight: 900, letterSpacing: "0.22em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.2)"
                }}>OPP</span>
                <Avatar name={lobby.opponent.username} size={52} accent="#f87171" />
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING, fontSize: 14, fontWeight: 900,
                    color: "#fff", marginBottom: 2
                  }}>{lobby.opponent.username}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                    ⚡ {lobby.opponent.battleRating} · Lv.{lobby.opponent.level}
                  </div>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
                  borderRadius: 20, border: `1px solid ${lobby.opponent.isReady ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.08)"}`,
                  background: lobby.opponent.isReady ? "rgba(52,211,153,0.08)" : "transparent"
                }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: lobby.opponent.isReady ? "#34d399" : "rgba(255,255,255,0.2)",
                    boxShadow: lobby.opponent.isReady ? "0 0 6px rgba(52,211,153,0.7)" : "none"
                  }} />
                  <span style={{
                    fontSize: 9, fontWeight: 900, letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: lobby.opponent.isReady ? "#34d399" : "rgba(255,255,255,0.3)"
                  }}>
                    {lobby.opponent.isReady ? "Ready" : "Waiting"}
                  </span>
                </div>
              </div>
            </div>

            {/* Match tags */}
            <div style={{
              display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap",
              paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 24
            }}>
              {[lobby.mode.replace("_1V1", ""), `${lobby.problemCount}P`, `${lobby.durationMinutes}min`, lobby.difficulty]
                .map(tag => (
                  <span key={tag} style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: "0.14em",
                    textTransform: "uppercase", color: "rgba(255,255,255,0.38)",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                    padding: "4px 10px", borderRadius: 7
                  }}>{tag}</span>
                ))}
            </div>

            {/* Language */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{
                  fontSize: 9, fontWeight: 900, letterSpacing: "0.2em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.22)"
                }}>Language</span>
                <div style={{
                  display: "flex", gap: 4, padding: 4, borderRadius: 10,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)"
                }}>
                  {LANGUAGES.map((l) => (
                    <div key={l.value} style={{
                      padding: "5px 14px", borderRadius: 7,
                      fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase",
                      background: "rgba(255,255,255,0.1)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.08)"
                    }}>
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={onReady} disabled={lobby.you.isReady || loading}
                  style={{
                    height: 46, padding: "0 28px", borderRadius: 11, border: "none", cursor: "none",
                    background: lobby.you.isReady ? "rgba(52,211,153,0.1)" : "#EDFF66",
                    color: lobby.you.isReady ? "#34d399" : "#09090b",
                    fontSize: 12, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase",
                    display: "flex", alignItems: "center", gap: 8, transition: "opacity 0.15s",
                    outline: lobby.you.isReady ? "1px solid rgba(52,211,153,0.25)" : "none"
                  }}
                  onMouseEnter={e => { if (!lobby.you.isReady) e.currentTarget.style.opacity = "0.85"; }}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  {lobby.you.isReady
                    ? <><Check size={14} /> Ready</>
                    : loading
                      ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Readying…</>
                      : "Ready Up"
                  }
                </button>
                <button onClick={onLeave}
                  style={{
                    height: 46, padding: "0 22px", borderRadius: 11, cursor: "none",
                    background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
                    fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.35)", transition: "all 0.15s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
                >Leave</button>
              </div>

              {!lobby.opponent.isReady && lobby.you.isReady && (
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: "50%", background: "#fbbf24",
                    animation: "blink 1.1s step-end infinite"
                  }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Waiting for opponent…</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ History row ══════════════════════════════════════════ */
function HistoryRow({ b, navigate }) {
  const o = OUTCOME[b.outcome] || OUTCOME.LOSS;
  const isCompleted = b.state === "COMPLETED" || b.state === "FORFEITED";
  const diffColor = { EASY: "#34d399", MEDIUM: "#fbbf24", HARD: "#f87171" }[b.difficulty] || "rgba(255,255,255,0.4)";

  return (
    <button onClick={() => isCompleted && navigate(`/battle/result/${b.battleId}`)}
      disabled={!isCompleted}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 14,
        padding: "12px 20px", background: "transparent", border: "none", cursor: "none",
        borderBottom: "1px solid rgba(255,255,255,0.04)", textAlign: "left",
        transition: "background 0.15s", opacity: isCompleted ? 1 : 0.4
      }}
      onMouseEnter={e => { if (isCompleted) e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {/* Outcome chip */}
      <div style={{
        display: "flex", alignItems: "center", gap: 5, padding: "3px 9px",
        borderRadius: 7, fontSize: 9, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase",
        color: o.color, background: `${o.color}0d`, border: `1px solid ${o.color}20`,
        flexShrink: 0, width: 58, justifyContent: "center"
      }}>
        <o.Icon size={9} />{o.label}
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: "#fff",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3
        }}>
          vs {b.opponentUsername || "Unknown"}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: diffColor }}>{b.difficulty}</span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: b.mode === "RANKED_1V1" ? "#fbbf24" : "rgba(255,255,255,0.2)",
            letterSpacing: "0.1em", textTransform: "uppercase"
          }}>{b.mode === "RANKED_1V1" ? "Ranked" : "Casual"}</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{b.yourSolved}/{b.problemCount} solved</span>
          {b.durationMinutes > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
              <Clock size={8} />{b.durationMinutes}m
            </span>
          )}
        </div>
      </div>

      {/* Rating change */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        {b.mode === "RANKED_1V1" && b.ratingChange != null ? (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3,
            fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING, fontSize: 14, fontWeight: 900,
            color: b.ratingChange > 0 ? "#34d399" : b.ratingChange < 0 ? "#f87171" : "rgba(255,255,255,0.3)"
          }}>
            {b.ratingChange > 0 ? <ArrowUp size={11} /> : b.ratingChange < 0 ? <ArrowDown size={11} /> : <Minus size={11} />}
            {b.ratingChange > 0 ? "+" : ""}{b.ratingChange}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>-</div>
        )}
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", marginTop: 3 }}>{timeAgo(b.completedAt || b.createdAt)}</div>
      </div>

      {isCompleted && <ChevronRight size={12} color="rgba(255,255,255,0.18)" />}
    </button>
  );
}

/* ═══ Main Page ═══════════════════════════════════════════ */
export default function BattleLobbyPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const userId = user?.uid;
  const pageRef = useRef(null);

  const { queueStatus, activeBattleState, activeBattleMode, activeBattleRoomCode, battleId, lobby, loading, error,
    joinQueue, leaveQueue, fetchLobby, readyUp, reset, stopPolling, abandon } = useBattleStore();

  const { friends, friendsPresence, loadOverview: loadFriendsOverview,
    loadFriendsPresence, sendChallenge, actionLoading: friendActionLoading } = useFriendsStore();

  const [mode, setMode] = useState("RANKED_1V1");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [problemCount, setProblemCount] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const language = "cpp";
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [friendQuery, setFriendQuery] = useState("");
  const [sendingFriendId, setSendingFriendId] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchPlayerStats(userId).then(setStats).catch(() => { });
      setHistoryLoading(true);
      fetchBattleHistory(userId, 0, 20).then(setHistory).catch(() => { }).finally(() => setHistoryLoading(false));
      loadFriendsOverview(); loadFriendsPresence();
    }
  }, [userId, loadFriendsOverview, loadFriendsPresence]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    if (lobby?.state === "ACTIVE" && battleId) navigate(`/battle/match/${battleId}`);
  }, [lobby?.state, battleId, navigate]);

  useEffect(() => {
    if (!battleId || !userId) return;
    if (activeBattleState === "WAITING" && !lobby) {
      fetchLobby(battleId, userId);
    }
  }, [activeBattleState, battleId, userId, lobby, fetchLobby]);

  useEffect(() => {
    if (!battleId || !userId || lobby?.state === "ACTIVE" || activeBattleState === "ACTIVE") return;
    const id = setInterval(() => fetchLobby(battleId, userId), 3000);
    return () => clearInterval(id);
  }, [battleId, userId, lobby?.state, fetchLobby, activeBattleState]);

  useGSAP(() => {
    gsap.fromTo(".lp-in", { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power3.out", delay: 0.05 });
  }, { scope: pageRef });

  const handleFindBattle = () => {
    if (userId) joinQueue(userId, mode, difficulty, problemCount, durationMinutes);
  };
  const handleCancel = () => { if (userId) leaveQueue(userId); };
  const handleReady = () => { if (battleId && userId) readyUp(battleId, userId, language); };
  const handleRejoin = () => {
    const isGroup = activeBattleMode === "GROUP_FFA";
    if (activeBattleState === "ACTIVE") {
      navigate(isGroup ? `/group/match/${battleId}` : `/battle/match/${battleId}`);
    } else if (activeBattleState === "WAITING") {
      if (isGroup && activeBattleRoomCode) {
        navigate(`/group/${activeBattleRoomCode}`);
      } else {
        fetchLobby(battleId, userId);
      }
    }
  };
  const handleAbandon = async () => {
    if (!battleId || !userId) return;
    await abandon(battleId, userId);
    fetchBattleHistory(userId, 0, 20).then(setHistory).catch(() => { });
  };

  const onlineFriends = (friends || []).filter(f => !!friendsPresence?.[f.uid]?.online);
  const filteredFriends = onlineFriends.filter(f =>
    !friendQuery.trim() || f.username.toLowerCase().includes(friendQuery.trim().toLowerCase())
  );
  const handleChallengeFriend = async (friend) => {
    if (!friend?.uid) return;
    setSendingFriendId(friend.uid);
    try {
      await sendChallenge({
        targetUserId: friend.uid,
        mode,
        difficulty,
        problemCount,
        durationMinutes,
      });
    }
    finally { setSendingFriendId(null); }
  };

  /* ── State-based screens ── */
  if (!userId) {
    return (
      <CenteredCard>
        <div style={{
          width: 48, height: 48, borderRadius: 13, background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Swords size={22} color="rgba(255,255,255,0.4)" />
        </div>
        <div>
          <h2 style={{
            fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING, fontSize: 20, fontWeight: 900, color: "#fff",
            marginBottom: 8
          }}>Sign in to Battle</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.32)", lineHeight: 1.7 }}>Challenge other players in real-time 1v1 coding duels.</p>
        </div>
        <button onClick={() => navigate("/login")} style={{
          width: "100%", height: 46, borderRadius: 11,
          border: "none", cursor: "none", background: "#EDFF66", color: "#09090b",
          fontSize: 12, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase"
        }}>
          Log In
        </button>
      </CenteredCard>
    );
  }

  if (lobby && lobby.state === "WAITING") {
    return <LobbyWaitScreen lobby={lobby} language={language}
      onReady={handleReady} onLeave={() => { reset(); navigate("/battle"); }} loading={loading} />;
  }

  if (activeBattleState === "WAITING" && battleId) {
    return (
      <CenteredCard>
        <Loader2 size={26} style={{ color: "#EDFF66", animation: "spin 1s linear infinite" }} />
        <div>
          <h2 style={{
            fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING, fontSize: 20, fontWeight: 900, color: "#fff",
            marginBottom: 8
          }}>Rejoining Lobby</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.32)", lineHeight: 1.7 }}>
            Restoring your battle lobby…
          </p>
        </div>
      </CenteredCard>
    );
  }

  if (activeBattleState === "ACTIVE" && battleId) {
    return (
      <CenteredCard>
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: "rgba(251,191,36,0.1)",
          border: "1px solid rgba(251,191,36,0.22)", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <AlertTriangle size={22} color="#fbbf24" />
        </div>
        <div>
          <h2 style={{
            fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING, fontSize: 20, fontWeight: 900, color: "#fff",
            marginBottom: 8
          }}>Active Battle Found</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.32)", lineHeight: 1.7 }}>
            You have a battle <strong style={{ color: "rgba(255,255,255,0.75)" }}>
              {activeBattleState === "ACTIVE" ? "in progress" : "in the lobby"}</strong>. Rejoin or abandon?
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          <button onClick={handleRejoin} style={{
            height: 46, borderRadius: 11, border: "none", cursor: "none",
            background: "#EDFF66", color: "#09090b", fontSize: 12, fontWeight: 900,
            letterSpacing: "0.1em", textTransform: "uppercase",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}>
            <Swords size={14} /> {activeBattleState === "ACTIVE" ? "Rejoin Battle" : "Rejoin Lobby"}
          </button>
          <button onClick={handleAbandon} style={{
            height: 42, borderRadius: 11, border: "none", cursor: "none",
            background: "transparent", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.3)",
            transition: "color 0.15s"
          }}
            onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
          >Abandon &amp; Start Fresh</button>
        </div>
      </CenteredCard>
    );
  }

  if (queueStatus === "QUEUED") {
    return <QueueScreen mode={mode} difficulty={difficulty} problemCount={problemCount} durationMinutes={durationMinutes} onCancel={handleCancel} />;
  }

  /* ── Main config page ── */
  const wins = history.filter(b => b.outcome === "WIN").length;
  const losses = history.filter(b => b.outcome === "LOSS").length;
  const played = history.length;
  const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

  return (
    <div ref={pageRef} style={{
      minHeight: "100vh", background: "#09090b",
      paddingTop: 56, paddingBottom: 80, cursor: "none"
    }}>
      <CustomCursor />

      {/* Fixed background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.025,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "200px"
        }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: 440, height: 440, opacity: 0.04 }}>
          <svg width="440" height="440" viewBox="0 0 440 440">
            {Array.from({ length: 13 }, (_, i) => <line key={i} x1={i * 36} y1="0" x2="0" y2={i * 36} stroke="white" strokeWidth="0.8" />)}
          </svg>
        </div>
        {/* Red fog top-right */}
        <div style={{
          position: "absolute", top: "-5%", right: "-10%", width: 500, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(248,113,113,0.05) 0%, transparent 65%)"
        }} />
      </div>

      <div style={{
        position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto",
        padding: "0 clamp(24px,5vw,72px)"
      }}>

        {/* ── HERO HEADER - dramatic ── */}
        <div className="lp-in" style={{ paddingTop: 40, paddingBottom: 0, position: "relative", overflow: "hidden" }}>

          {/* Watermark - giant BATTLE behind content */}
          <div style={{
            position: "absolute", right: -20, top: "50%", transform: "translateY(-50%)",
            fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING, fontSize: "clamp(6rem,14vw,11rem)", fontWeight: 900,
            color: "rgba(255,255,255,0.025)", lineHeight: 1,
            pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap"
          }}>
            BATTLE
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "end",
            paddingBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.05)", position: "relative"
          }}>

            <div>
              <div style={{
                fontSize: 9, fontWeight: 900, letterSpacing: "0.3em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.22)", marginBottom: 14
              }}>- 1v1 Arena</div>

              {/* Title with red accent on "Arena" */}
              <h1 style={{
                fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING, fontWeight: 900,
                fontSize: "clamp(2.8rem,5vw,4.8rem)", lineHeight: 0.9,
                margin: "0 0 14px"
              }}>
                <span style={{ color: "#fff", display: "block" }}>Battle</span>
                <span style={{ color: "#f87171", display: "block" }}>Arena.</span>
              </h1>

              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", lineHeight: 1.7, maxWidth: 360 }}>
                Real-time coding duels. ELO on the line. First to solve wins.
              </p>
            </div>

            {/* Right - stats as a vertical mini war-room */}
            {stats && (
              <div style={{
                display: "flex", flexDirection: "column", gap: 0, flexShrink: 0,
                background: "#0d0d10", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16, overflow: "hidden", minWidth: 220
              }}>
                <div style={{ height: 2, background: "linear-gradient(90deg,#f87171,rgba(248,113,113,0.2))" }} />

                {/* Rating - big */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{
                    fontSize: 9, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.2)", marginBottom: 6
                  }}>ELO Rating</div>
                  <div style={{
                    fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING, fontSize: 32, fontWeight: 900,
                    color: "#c4b5fd", lineHeight: 1,
                    textShadow: "0 0 28px rgba(196,181,253,0.3)"
                  }}>{stats.battleRating}</div>
                </div>

                {/* W/L/Rate row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                  {[
                    { label: "Wins", value: wins, color: "#34d399" },
                    { label: "Losses", value: losses, color: "#f87171" },
                    { label: "Win %", value: `${winRate}%`, color: "#EDFF66" },
                  ].map((s, i) => (
                    <div key={s.label} style={{
                      padding: "12px 14px",
                      borderRight: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}>
                      <div style={{
                        fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING, fontSize: 18, fontWeight: 900,
                        color: s.color, lineHeight: 1, marginBottom: 3,
                        textShadow: `0 0 16px ${s.color}30`
                      }}>{s.value}</div>
                      <div style={{
                        fontSize: 8, fontWeight: 700, letterSpacing: "0.16em",
                        textTransform: "uppercase", color: "rgba(255,255,255,0.2)"
                      }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Win rate bar */}
                <div style={{ padding: "10px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${winRate}%`, borderRadius: 3,
                      background: "linear-gradient(90deg,#f87171,#EDFF66)",
                      boxShadow: "0 0 6px rgba(237,255,102,0.4)",
                      transition: "width 1s ease-out"
                    }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="lp-in" style={{
            padding: "12px 16px", borderRadius: 12, margin: "20px 0 0",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            fontSize: 13, color: "#f87171"
          }}>{error}</div>
        )}

        {/* Group battle banner */}
        <button className="lp-in" onClick={() => navigate("/group")} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", marginBottom: 20, marginTop: 24, borderRadius: 14, cursor: "none",
          background: "#0d0d10", border: "1px solid rgba(255,255,255,0.06)", transition: "border-color 0.2s, background 0.2s"
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(237,255,102,0.2)"; e.currentTarget.style.background = "rgba(237,255,102,0.02)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "#0d0d10"; }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Users size={15} color="rgba(255,255,255,0.4)" />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING, fontSize: 14, fontWeight: 900, color: "#fff" }}>Group Battle</span>
                <span style={{
                  fontSize: 8, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase",
                  color: "#EDFF66", background: "rgba(237,255,102,0.1)", border: "1px solid rgba(237,255,102,0.2)",
                  padding: "2px 6px", borderRadius: 5
                }}>New</span>
              </div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>3–8 players · FFA · Points-based scoring</span>
            </div>
          </div>
          <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

          {/* ── CONFIG CARD ── */}
          <div className="lp-in" style={{
            background: "#0d0d10", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, overflow: "hidden", position: "sticky", top: 80
          }}>
            <div style={{ height: 2, background: "linear-gradient(90deg,#ef4444,#f87171)" }} />
            <div style={{
              padding: "20px 22px", borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", gap: 12
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.18)", display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Swords size={14} color="#f87171" />
              </div>
              <div>
                <div style={{ fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING, fontSize: 14, fontWeight: 900, color: "#fff", marginBottom: 2 }}>New Battle</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>Configure your match</div>
              </div>
            </div>

            <div style={{ padding: "22px 22px", display: "flex", flexDirection: "column", gap: 22 }}>

              {/* Mode */}
              <div>
                <div style={{
                  fontSize: 9, fontWeight: 900, letterSpacing: "0.28em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)", marginBottom: 10
                }}>Mode</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {MODES.map(m => {
                    const active = mode === m.value;
                    const accentCol = m.value === "RANKED_1V1" ? "#EDFF66" : "#c4b5fd";
                    return (
                      <button key={m.value} onClick={() => setMode(m.value)} style={{
                        padding: "14px 14px", borderRadius: 12, border: "none", cursor: "none", textAlign: "left",
                        background: active ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                        outline: active ? `1px solid ${accentCol}25` : "1px solid rgba(255,255,255,0.06)",
                        transition: "all 0.15s", position: "relative"
                      }}>
                        <m.icon size={14} color={active ? accentCol : "rgba(255,255,255,0.3)"} style={{ marginBottom: 8 }} />
                        <div style={{
                          fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING, fontSize: 13, fontWeight: 900,
                          color: active ? "#fff" : "rgba(255,255,255,0.45)", marginBottom: 4
                        }}>{m.label}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", lineHeight: 1.5 }}>{m.desc}</div>
                        {active && <div style={{
                          position: "absolute", top: 12, right: 12, width: 5, height: 5,
                          borderRadius: "50%", background: accentCol, boxShadow: `0 0 6px ${accentCol}80`
                        }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <div style={{
                  fontSize: 9, fontWeight: 900, letterSpacing: "0.28em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)", marginBottom: 10
                }}>Difficulty</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {DIFFICULTIES.map(d => {
                    const active = difficulty === d.value;
                    return (
                      <button key={d.value} onClick={() => setDifficulty(d.value)} style={{
                        padding: "10px 0", borderRadius: 11, border: "none", cursor: "none",
                        background: active ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                        outline: active ? `1px solid ${d.color}30` : "1px solid rgba(255,255,255,0.06)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                        fontSize: 11, fontWeight: 800, letterSpacing: "0.04em",
                        color: active ? "#fff" : "rgba(255,255,255,0.38)", transition: "all 0.15s"
                      }}>
                        <div style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: active ? d.dot : "rgba(255,255,255,0.2)"
                        }} />
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Problems */}
              <div>
                <div style={{
                  fontSize: 9, fontWeight: 900, letterSpacing: "0.28em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)", marginBottom: 10
                }}>Problems</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {PROBLEM_COUNTS.map(c => {
                    const active = problemCount === c;
                    return (
                      <button key={c} onClick={() => setProblemCount(c)} style={{
                        padding: "10px 0", borderRadius: 11, border: "none", cursor: "none",
                        background: active ? "#EDFF66" : "rgba(255,255,255,0.02)",
                        outline: active ? "none" : "1px solid rgba(255,255,255,0.06)",
                        fontSize: 13, fontWeight: 900, letterSpacing: "-0.01em",
                        color: active ? "#09090b" : "rgba(255,255,255,0.38)",
                        transition: "all 0.15s", display: "flex", flexDirection: "column",
                        alignItems: "center", gap: 2
                      }}>
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Limit */}
              <div>
                <div style={{
                  fontSize: 9, fontWeight: 900, letterSpacing: "0.28em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)", marginBottom: 10
                }}>Time Limit</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 8 }}>
                  {QUICK_DURATION_OPTIONS.map(m => {
                    const active = durationMinutes === m;
                    return (
                      <button key={m} onClick={() => setDurationMinutes(m)} style={{
                        padding: "10px 0", borderRadius: 11, border: "none", cursor: "none",
                        background: active ? "rgba(237,255,102,0.14)" : "rgba(255,255,255,0.02)",
                        outline: active ? "1px solid rgba(237,255,102,0.25)" : "1px solid rgba(255,255,255,0.06)",
                        fontSize: 11, fontWeight: 900, letterSpacing: "0.08em",
                        color: active ? "#EDFF66" : "rgba(255,255,255,0.38)",
                        transition: "all 0.15s"
                      }}>
                        {m}m
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Find Battle */}
              <button onClick={handleFindBattle} disabled={loading}
                style={{
                  height: 48, borderRadius: 12, border: "none", cursor: "none",
                  background: "#EDFF66", color: "#09090b",
                  fontSize: 12, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "opacity 0.15s", opacity: loading ? 0.5 : 1
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={e => e.currentTarget.style.opacity = loading ? "0.5" : "1"}
              >
                {loading
                  ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Joining queue…</>
                  : <><Swords size={14} /> Find Battle</>
                }
              </button>

              {/* Challenge a friend */}
              <div style={{ paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{
                  fontSize: 9, fontWeight: 900, letterSpacing: "0.28em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)", marginBottom: 12
                }}>Challenge a Friend</div>

                <div style={{ position: "relative", marginBottom: 8 }}>
                  <Search size={13} color="rgba(255,255,255,0.22)"
                    style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input value={friendQuery} onChange={e => setFriendQuery(e.target.value)}
                    placeholder="Search online friends…"
                    style={{
                      width: "100%", height: 38, borderRadius: 10,
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                      paddingLeft: 36, paddingRight: 12, fontSize: 13, color: "#fff", outline: "none",
                      transition: "border-color 0.15s"
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"}
                    onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
                  />
                </div>

                <div style={{
                  border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10,
                  overflow: "hidden", maxHeight: 180, overflowY: "auto"
                }}>
                  {filteredFriends.length === 0 ? (
                    <div style={{ padding: "14px 14px", fontSize: 11, color: "rgba(255,255,255,0.22)", textAlign: "center" }}>
                      {onlineFriends.length === 0 ? "No online friends right now." : "No friends match."}
                    </div>
                  ) : filteredFriends.slice(0, 8).map(f => {
                    const busy = sendingFriendId === f.uid && friendActionLoading;
                    return (
                      <div key={f.uid} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        gap: 10, padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)"
                      }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: 12, fontWeight: 700, color: "#fff",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2
                          }}>{f.username}</div>
                          <div style={{
                            display: "flex", alignItems: "center", gap: 5, fontSize: 9,
                            fontWeight: 700, letterSpacing: "0.12em", color: "#34d399", textTransform: "uppercase"
                          }}>
                            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#34d399" }} /> Online
                          </div>
                        </div>
                        <button onClick={() => handleChallengeFriend(f)} disabled={friendActionLoading}
                          style={{
                            height: 30, padding: "0 12px", borderRadius: 8, border: "none", cursor: "none",
                            background: "#EDFF66", color: "#09090b", fontSize: 10, fontWeight: 900,
                            letterSpacing: "0.08em", textTransform: "uppercase",
                            display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                            opacity: friendActionLoading ? 0.5 : 1, transition: "opacity 0.15s"
                          }}>
                          {busy ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : <Swords size={10} />}
                          Challenge
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.16)", marginTop: 8, lineHeight: 1.6 }}>
                  Uses your selected mode, difficulty, count, and time limit.
                </p>
              </div>
            </div>
          </div>

          {/* ── RIGHT COL: History ── */}
          <div className="lp-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#0d0d10", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ height: 2, background: "linear-gradient(90deg,rgba(255,255,255,0.08), transparent)" }} />

              {/* Header */}
              <div style={{
                padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", justifyContent: "space-between"
              }}>
                <div>
                  <div style={{
                    fontSize: 9, fontWeight: 900, letterSpacing: "0.28em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.22)", marginBottom: 6
                  }}>- War Log</div>
                  <div style={{
                    fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING, fontSize: 16, fontWeight: 900,
                    color: "#fff"
                  }}>Battle History</div>
                </div>
                {history.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                    <span style={{
                      fontFamily: BATTLE_FONT_FAMILY, letterSpacing: BATTLE_FONT_LETTER_SPACING, fontSize: 22, fontWeight: 900,
                      color: "rgba(255,255,255,0.12)", lineHeight: 1
                    }}>
                      {history.length}
                    </span>
                    <span style={{
                      fontSize: 8, fontWeight: 700, letterSpacing: "0.18em",
                      textTransform: "uppercase", color: "rgba(255,255,255,0.18)"
                    }}>matches</span>
                  </div>
                )}
              </div>

              {/* Content */}
              {historyLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
                  <Loader2 size={18} color="rgba(255,255,255,0.2)" style={{ animation: "spin 1s linear infinite" }} />
                </div>
              ) : history.length === 0 ? (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", padding: "52px 24px", textAlign: "center", gap: 14
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <Swords size={18} color="rgba(255,255,255,0.15)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>No battles yet</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Find an opponent to start your first match</div>
                  </div>
                </div>
              ) : (
                <div style={{ maxHeight: "calc(100vh - 320px)", overflowY: "auto" }}>
                  {history.map(b => <HistoryRow key={b.battleId} b={b} navigate={navigate} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        @keyframes spin  { 0%{transform:rotate(0deg)}  100%{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.12} }
      `}</style>
    </div>
  );
}