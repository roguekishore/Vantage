import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { useGSAP } from "@gsap/react";
import {
  User, Target, CheckCircle,
  GraduationCap, Building2, Star, LogOut,
  Flame, Zap, TrendingUp, BookOpen, Lock, Clock,
  Coins, Sparkles, ChevronLeft, ChevronRight, Shield,
  VolumeX, Volume2,
} from "lucide-react";
import { fetchUserStats, fetchUserProfile } from "@/services/userApi";
import { fetchCoinHistory } from "@/services/gamificationApi";
import useGamificationStore from "@/stores/useGamificationStore";
import useUserStore from "@/stores/useUserStore";
import useFriendsStore from "@/stores/useFriendsStore";
import useProgressStore, {
  STAGES, STAGE_ORDER, ALL_PROBLEMS, Difficulty,
} from "@/map/useProgressStore";
import CustomCursor from "@/components/common/CustomCursor";
import { MONUMENT_TYPO } from "@/components/common/MonumentTypography";

gsap.registerPlugin(ScrollTrigger);

const MF = MONUMENT_TYPO.fontFamily;
const MLS = MONUMENT_TYPO.letterSpacing;
const ACID_YELLOW = "#EDFF66";
const ACID_GLOW = "#D2E85A";

const getRatingTier = (r) => {
  if (r >= 500) return { label: "Grandmaster", color: ACID_YELLOW, glow: ACID_GLOW, Icon: Flame };
  if (r >= 300) return { label: "Master", color: ACID_YELLOW, glow: ACID_GLOW, Icon: Zap };
  if (r >= 150) return { label: "Expert", color: ACID_YELLOW, glow: ACID_GLOW, Icon: Star };
  if (r >= 50) return { label: "Intermediate", color: ACID_YELLOW, glow: ACID_GLOW, Icon: TrendingUp };
  return { label: "Beginner", color: ACID_YELLOW, glow: ACID_GLOW, Icon: BookOpen };
};

const getDiffBreakdown = (cp) => {
  const s = ALL_PROBLEMS.filter(p => cp.includes(p.id));
  return {
    easy: s.filter(p => p.difficulty === Difficulty.EASY).length,
    medium: s.filter(p => p.difficulty === Difficulty.MEDIUM).length,
    hard: s.filter(p => p.difficulty === Difficulty.HARD).length,
  };
};

/* ── count-up hook ── */
function useCountUp(target, duration = 1000, delay = 0) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    const t0 = performance.now() + delay;
    const tick = (now) => {
      if (now < t0) { requestAnimationFrame(tick); return; }
      const p = Math.min((now - t0) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, delay]);
  return { val, start };
}

/* ── hero canvas ── */
function HeroCanvas({ color, glow }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    let animId, t = 0;
    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - .5) * 0.00013, vy: (Math.random() - .5) * 0.00013,
      r: Math.random() * 1.4 + 0.3, a: Math.random() * 0.38 + 0.07,
    }));
    const setup = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setup(); window.addEventListener("resize", setup);
    const W = () => canvas.offsetWidth, H = () => canvas.offsetHeight;
    const draw = () => {
      t += 0.005; ctx.clearRect(0, 0, W(), H());
      ctx.strokeStyle = "rgba(255,255,255,0.017)"; ctx.lineWidth = 0.5;
      const gs = 72;
      for (let x = 0; x < W(); x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H()); ctx.stroke(); }
      for (let y = 0; y < H(); y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W(), y); ctx.stroke(); }
      pts.forEach(p => {
        p.x = (p.x + p.vx + 1) % 1; p.y = (p.y + p.vy + 1) % 1;
        ctx.beginPath(); ctx.arc(p.x * W(), p.y * H(), p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${Math.round(p.a * 255).toString(16).padStart(2, "0")}`;
        ctx.fill();
      });
      for (let i = -4; i < 14; i++) {
        const off = (i * 140 + t * 13) % (W() + H() * 0.6);
        ctx.beginPath(); ctx.moveTo(off, 0); ctx.lineTo(off - H() * 0.55, H());
        ctx.strokeStyle = `${color}08`; ctx.lineWidth = 0.9; ctx.stroke();
      }
      const cg = ctx.createRadialGradient(W() * .5, H() * .5, 0, W() * .5, H() * .5, W() * .5);
      cg.addColorStop(0, `${glow}15`); cg.addColorStop(1, "transparent");
      ctx.fillStyle = cg; ctx.fillRect(0, 0, W(), H());
      const bf = ctx.createLinearGradient(0, H() * .45, 0, H());
      bf.addColorStop(0, "transparent"); bf.addColorStop(1, "#09090b");
      ctx.fillStyle = bf; ctx.fillRect(0, 0, W(), H());
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", setup); };
  }, [color, glow]);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />;
}

/* ── radar xp canvas ── */
function RadarXPCanvas({ pct, level, color, glow }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    let animId, ra = 0, cur = 0;
    const setup = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setup();
    const W = () => canvas.offsetWidth, H = () => canvas.offsetHeight;
    const draw = () => {
      ctx.clearRect(0, 0, W(), H());
      const cx = W() / 2, cy = H() / 2, R = Math.min(W(), H()) * 0.4;
      [0.32, 0.62, 1].forEach((f, i) => {
        ctx.beginPath(); ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${0.03 + i * 0.02})`; ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 9]); ctx.stroke(); ctx.setLineDash([]);
      });
      [[cx - R, cy, cx + R, cy], [cx, cy - R, cx, cy + R]].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = 0.6; ctx.stroke();
      });
      ra = (ra + 0.022) % (Math.PI * 2);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ra);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, -0.35, 0.35); ctx.closePath();
      ctx.fillStyle = `${color}0c`; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R, 0);
      ctx.strokeStyle = `${color}65`; ctx.lineWidth = 1.2;
      ctx.shadowColor = color; ctx.shadowBlur = 9; ctx.stroke(); ctx.shadowBlur = 0;
      ctx.restore();
      cur += (pct - cur) * 0.045;
      const arcR = R * 0.87;
      ctx.beginPath(); ctx.arc(cx, cy, arcR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 7; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, arcR, -Math.PI / 2, -Math.PI / 2 + (cur / 100) * Math.PI * 2);
      ctx.strokeStyle = color; ctx.lineWidth = 7; ctx.lineCap = "round";
      ctx.shadowColor = glow; ctx.shadowBlur = 18; ctx.stroke(); ctx.shadowBlur = 0; ctx.lineCap = "butt";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff"; ctx.font = `900 ${Math.round(R * .44)}px ${MF}`;
      ctx.fillText(level, cx, cy - R * 0.06);
      ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.font = `700 ${Math.round(R * .11)}px 'Syne',monospace`;
      ctx.fillText("LEVEL", cx, cy + R * 0.25);
      ctx.fillStyle = color; ctx.font = `700 ${Math.round(R * .1)}px 'Syne',monospace`;
      ctx.fillText(`${Math.round(cur)}%`, cx, cy + R * 0.44);
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [pct, level, color, glow]);
  return <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />;
}

/* ── stat chip (count-up) ── */
function StatChip({ icon: Icon, label, value, color, delay = 0 }) {
  const { val, start } = useCountUp(typeof value === "number" ? value : 0, 900, delay);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { start(); obs.disconnect(); } }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [start]);
  return (
    <div ref={ref} style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 10, padding: "22px 14px",
      background: `${color}0d`, border: `1px solid ${color}30`,
      borderRadius: 14, textAlign: "center", cursor: "none",
      transition: "border-color 0.2s,background 0.2s"
    }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}1a`; e.currentTarget.style.borderColor = `${color}50`; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${color}0d`; e.currentTarget.style.borderColor = `${color}30`; }}
    >
      <Icon size={15} color={color} />
      <div style={{
        fontFamily: MF, fontWeight: 900, fontSize: 32, letterSpacing: MLS.displayWide, lineHeight: 1,
        color, textShadow: `0 0 22px ${color}55`
      }}>
        {typeof value === "number" ? val : value}
      </div>
      <div style={{
        fontSize: 8, fontWeight: 900, letterSpacing: "0.22em",
        textTransform: "uppercase", color: "rgba(255,255,255,0.3)"
      }}>{label}</div>
    </div>
  );
}

/* ── diff ring ── */
function DiffRing({ count, total, color, label }) {
  const r = 30, circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative", width: 76, height: 76 }}>
        <svg width="76" height="76" viewBox="0 0 76 76" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${(total > 0 ? count / total : 0) * circ} ${circ}`}
            style={{ filter: `drop-shadow(0 0 5px ${color}80)`, transition: "stroke-dasharray 1.2s ease" }} />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center"
        }}>
          <span style={{ fontFamily: MF, fontWeight: 900, fontSize: 18, color, lineHeight: 1 }}>{count}</span>
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", fontWeight: 700, marginTop: 1 }}>/{total}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{
          width: 5, height: 5, borderRadius: "50%", background: color,
          boxShadow: `0 0 5px ${color}90`
        }} />
        <span style={{
          fontSize: 9, fontWeight: 900, letterSpacing: "0.18em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.4)"
        }}>{label}</span>
      </div>
    </div>
  );
}

/* ── overall progress ── */
function OverallProgress({ percentage, completed, total }) {
  const barRef = useRef(null), done = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        gsap.fromTo(barRef.current, { width: "0%" }, { width: `${percentage}%`, duration: 1.6, ease: "power4.out", delay: 0.2 });
        obs.disconnect();
      }
    }, { threshold: 0.4 });
    if (barRef.current) obs.observe(barRef.current);
    return () => obs.disconnect();
  }, [percentage]);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: MF, fontWeight: 900, fontSize: 52, letterSpacing: MLS.displayWide, lineHeight: 1, color: "#fff" }}>
            {percentage}<span style={{ fontSize: 24, color: "rgba(255,255,255,0.18)" }}>%</span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>{completed} of {total} solved</div>
        </div>
        <div style={{
          padding: "10px 16px", borderRadius: 11, textAlign: "center",
          background: "rgba(237,255,102,0.09)", border: "1px solid rgba(237,255,102,0.28)"
        }}>
          <div style={{ fontFamily: MF, fontWeight: 900, fontSize: 22, color: ACID_YELLOW, lineHeight: 1 }}>{total - completed}</div>
          <div style={{
            fontSize: 8, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "rgba(237,255,102,0.55)", marginTop: 4
          }}>Left</div>
        </div>
      </div>
      <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div ref={barRef} style={{
          height: "100%", borderRadius: 3, width: "0%",
          background: "linear-gradient(90deg,rgba(237,255,102,0.45),#EDFF66,rgba(255,255,255,0.95))",
          boxShadow: "0 0 14px rgba(237,255,102,0.7)"
        }} />
      </div>
    </div>
  );
}

/* ── stage row ── */
function StageRow({ stageKey, stage, prog, idx }) {
  const barRef = useRef(null), done = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        gsap.fromTo(barRef.current, { width: "0%" }, { width: `${prog.percentage}%`, duration: 1.0, ease: "power3.out", delay: idx * 0.04 });
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    if (barRef.current) obs.observe(barRef.current);
    return () => obs.disconnect();
  }, [prog.percentage, idx]);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, padding: "11px 20px",
      borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s", cursor: "none"
    }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{
        width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
        background: prog.isComplete ? stage.color : "rgba(255,255,255,0.1)",
        boxShadow: prog.isComplete ? `0 0 7px ${stage.color}` : undefined
      }} />
      <span style={{
        flex: 1, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis",
        whiteSpace: "nowrap", color: prog.isComplete ? "#fff" : "rgba(255,255,255,0.35)"
      }}>{stage.name}</span>
      <div style={{ width: 72, height: 2, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden", flexShrink: 0 }}>
        <div ref={barRef} style={{
          height: "100%", borderRadius: 2, width: "0%",
          background: prog.isComplete ? stage.color : "rgba(255,255,255,0.18)",
          boxShadow: prog.isComplete ? `0 0 5px ${stage.color}60` : undefined
        }} />
      </div>
      <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.24)", fontFamily: "monospace", flexShrink: 0, width: 36, textAlign: "right" }}>
        {prog.completed}/{prog.total}
      </span>
      {prog.isComplete && <CheckCircle size={11} color={ACID_YELLOW} style={{ flexShrink: 0 }} />}
    </div>
  );
}

/* ── coin tx row ── */
function CoinTx({ tx }) {
  const pos = tx.amount > 0;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
      borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s", cursor: "none"
    }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.018)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: "rgba(237,255,102,0.1)",
        border: "1px solid rgba(237,255,102,0.22)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: MF, fontWeight: 900, fontSize: 14, color: ACID_YELLOW
      }}>
        {pos ? "+" : "−"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {tx.source.replace(/_/g, " ")}
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", marginTop: 2 }}>
          {new Date(tx.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontFamily: MF, fontWeight: 900, fontSize: 14, letterSpacing: MLS.displayWide, color: ACID_YELLOW }}>
          {pos ? "+" : ""}{tx.amount}
        </div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "monospace", marginTop: 1 }}>Bal: {tx.balanceAfter}</div>
      </div>
    </div>
  );
}

/* ── card ── */
function Card({ children, accent, style = {} }) {
  return (
    <div style={{ background: "#0d0d10", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden", ...style }}>
      {accent && <div style={{ height: 2, background: `linear-gradient(90deg,${accent}75,transparent)` }} />}
      {children}
    </div>
  );
}

/* ── scroll-triggered section ── */
function Section({ children, style = {} }) {
  return <div className="prof-sec" style={{ opacity: 0, ...style }}>{children}</div>;
}

/* ════════════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════════════ */
const ProfilePage = () => {
  const navigate = useNavigate(), pageRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coinHistory, setCoinHistory] = useState(null);
  const [coinPage, setCoinPage] = useState(0);

  const user = useUserStore(s => s.user);
  const gamStats = useGamificationStore(s => s.stats);
  const streakData = useGamificationStore(s => s.streak);
  const completedProblems = useProgressStore(s => s.completedProblems);
  const getStageProgress = useProgressStore(s => s.getStageProgress);
  const getTotalProgress = useProgressStore(s => s.getTotalProgress);
  const loadProgress = useProgressStore(s => s.loadProgress);
  const challengeMuteUntil = useFriendsStore(s => s.challengeMuteUntil);
  const loadChallengeMuteStatus = useFriendsStore(s => s.loadChallengeMuteStatus);
  const unmuteChallenges = useFriendsStore(s => s.unmuteChallenges);
  const friendsActionLoading = useFriendsStore(s => s.actionLoading);

  const totalProgress = getTotalProgress();
  const diffBreakdown = useMemo(() => getDiffBreakdown(completedProblems), [completedProblems]);

  useEffect(() => {
    if (!user?.uid) { navigate("/login"); return; }
    (async () => {
      try {
        const [pd, sd, cd] = await Promise.all([
          fetchUserProfile(user.uid), fetchUserStats(user.uid),
          fetchCoinHistory(user.uid, 0, 10).catch(() => null),
          loadProgress(user.uid), loadChallengeMuteStatus(),
        ]);
        setProfile(pd); setStats(sd); setCoinHistory(cd);
        if (!gamStats) useGamificationStore.getState().loadStats(user.uid);
      } catch { useUserStore.getState().clearUser(); navigate("/login"); }
      finally { setLoading(false); }
    })();
  }, [user?.uid]); // eslint-disable-line

  /* ════════════════════════════════════════
     TAPE-ROLL ENTRANCE
     ─────────────────────────────────────
     Think of it like a film projector gate
     opening: content rolls upward into view
     from behind horizontal overflow clips,
     while the canvas breathes in underneath.
  ════════════════════════════════════════ */
  useGSAP(() => {
    if (loading) return;
    const tl = gsap.timeline({ delay: 0.05 });

    // 1. canvas bg fades in (atmosphere first)
    tl.fromTo(".hero-canvas-wrap",
      { opacity: 0 },
      { opacity: 1, duration: 0.75, ease: "power2.out" }
    )
      // 2. eyebrow clips in from left
      .fromTo(".hero-eyebrow",
        { clipPath: "inset(0 100% 0 0)" },
        { clipPath: "inset(0 0% 0 0)", duration: 0.85, ease: "expo.inOut" },
        "-=0.35"
      )
      // 3. tape-roll: each word travels up from overflow:hidden slot
      .fromTo(".hero-word",
        { y: "105%" },
        { y: "0%", duration: 1.05, stagger: 0.1, ease: "expo.out" },
        "-=0.6"
      )
      // 4. accent rule draws right
      .fromTo(".hero-rule",
        { scaleX: 0, transformOrigin: "left" },
        { scaleX: 1, duration: 1.0, ease: "expo.inOut" },
        "-=0.82"
      )
      // 5. info badges bounce up
      .fromTo(".hero-badge",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.07, ease: "back.out(1.8)" },
        "-=0.72"
      );

    // identity card: wipe from left behind clip
    gsap.fromTo(".identity-card",
      { opacity: 0, clipPath: "inset(0 100% 0 0)" },
      { opacity: 1, clipPath: "inset(0 0% 0 0)", duration: 0.9, ease: "expo.inOut", delay: 0.5 }
    );

    // scroll sections: clip-path wipe from bottom
    gsap.utils.toArray(".prof-sec").forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, y: 28, clipPath: "inset(0 0 35% 0)" },
        {
          opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 84%", toggleActions: "play none none none" }
        }
      );
    });
  }, { scope: pageRef, dependencies: [loading] });

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, background: "#0d0d10",
          border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center",
          justifyContent: "center", animation: "shimmer 1.6s ease-in-out infinite"
        }}>
          <User size={20} color="rgba(255,255,255,0.15)" />
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontWeight: 700, letterSpacing: "0.1em" }}>Loading profile…</span>
      </div>
    </div>
  );

  const du = profile || user;
  const muts = challengeMuteUntil ? new Date(challengeMuteUntil).getTime() : 0;
  const isDnd = Boolean(muts && muts > Date.now());
  const mutLabel = isDnd ? new Date(challengeMuteUntil).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

  const rating = du?.rating ?? 0;
  const tier = getRatingTier(rating);
  const { color, glow, Icon: TierIcon, label: tierLabel } = tier;

  const xpPct = gamStats && gamStats.xpForNextLevel > gamStats.xpForCurrentLevel
    ? Math.min(100, ((gamStats.xp - gamStats.xpForCurrentLevel) / (gamStats.xpForNextLevel - gamStats.xpForCurrentLevel)) * 100)
    : gamStats ? 100 : 0;

  const fc = ACID_YELLOW;

  const pStats = [
    { icon: CheckCircle, label: "Solved", value: stats?.solved ?? totalProgress.completed, color: ACID_YELLOW },
    { icon: Clock, label: "Attempted", value: stats?.attempted ?? 0, color: ACID_YELLOW },
    { icon: Lock, label: "Remaining", value: stats?.notStarted ?? (totalProgress.total - totalProgress.completed), color: ACID_YELLOW },
    { icon: Target, label: "Total", value: stats?.total ?? totalProgress.total, color: ACID_YELLOW },
  ];

  return (
    <div ref={pageRef} style={{ minHeight: "100vh", background: "#09090b", paddingTop: 56, paddingBottom: 100, cursor: "none", overflowX: "hidden" }}>
      <CustomCursor />

      {/* fixed bg glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px"
        }} />
        <div style={{
          position: "absolute", top: "-15%", right: "-8%", width: 700, height: 600,
          background: `radial-gradient(ellipse 60% 70% at 70% 0%, ${color}0e 0%, transparent 70%)`, transition: "background 0.9s"
        }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 25%, #09090b 100%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "0 clamp(24px,5vw,72px)" }}>

        {/* ══ HERO - auto height, never clips text ══ */}
        <div style={{
          position: "relative",
          marginLeft: "calc(-1 * clamp(24px,5vw,72px))",
          marginRight: "calc(-1 * clamp(24px,5vw,72px))",
          paddingTop: 72, paddingBottom: 44,
          overflow: "hidden",
          borderBottom: `1px solid ${color}30`
        }}>

          {/* canvas */}
          <div className="hero-canvas-wrap" style={{ position: "absolute", inset: 0, opacity: 0 }}>
            <HeroCanvas color={color} glow={glow} />
          </div>
          {/* grain */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.022,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "180px"
          }} />

          {/* content */}
          <div style={{ position: "relative", zIndex: 2, padding: "0 clamp(24px,5vw,72px)" }}>

            {/* eyebrow */}
            {/* <div className="hero-eyebrow" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{
                width: 5, height: 5, borderRadius: "50%", background: color,
                boxShadow: `0 0 8px ${color}`, animation: "blink 1.4s step-end infinite"
              }} />
              <span style={{
                fontSize: 9, fontWeight: 900, letterSpacing: "0.3em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.22)"
              }}>- Identity File</span>
              <div style={{ height: 1, width: 48, background: `${color}45` }} />
              <span style={{
                fontSize: 9, fontWeight: 900, letterSpacing: "0.18em",
                textTransform: "uppercase", color: `${color}90`, fontFamily: "'Syne',monospace"
              }}>
                {tierLabel}
              </span>
            </div> */}

            {/* tape-roll words - overflow:hidden parent is the gate */}
            <div style={{ marginBottom: 26 }}>
              {[du?.username || "Operative", "Dossier."].map((word, i) => (
                <div key={word} style={{ overflow: "hidden", lineHeight: 1.05, paddingBottom: 6, marginBottom: i === 0 ? 3 : 0 }}>
                  <div className="hero-word" style={{
                    fontFamily: MF, fontWeight: 900,
                    /* clamp keeps both words visible at all viewport widths */
                    fontSize: "clamp(2.0rem,4.5vw,4.8rem)",
                    letterSpacing: MLS.displayWide,
                    color: i === 0 ? "#fff" : i === 1 ? "#EDFF66" : `${color}cc`,
                    display: "block", willChange: "transform",
                  }}>{word}</div>
                </div>
              ))}
            </div>

            {/* accent rule */}
            <div className="hero-rule" style={{
              height: 1, marginBottom: 22,
              background: `linear-gradient(90deg,rgba(237,255,102,0.75),rgba(255,255,255,0.06) 55%,transparent)`,
              transform: "scaleX(0)", transformOrigin: "left"
            }} />

            {/* badges */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {/* rating */}
              <div className="hero-badge" style={{
                opacity: 0, display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px", borderRadius: 10,
                background: `${color}18`, border: `1px solid ${color}45`, backdropFilter: "blur(12px)"
              }}>
                <TierIcon size={13} color={color} />
                <span style={{ fontFamily: MF, fontWeight: 900, fontSize: 15, letterSpacing: MLS.displayWide, color }}>
                  {rating}
                </span>
                <span style={{
                  fontSize: 8, fontWeight: 900, letterSpacing: "0.16em",
                  textTransform: "uppercase", color: `${color}90`
                }}>Rating</span>
              </div>

              {gamStats && (
                <div className="hero-badge" style={{
                  opacity: 0, display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 16px", borderRadius: 10,
                  background: "rgba(9,9,11,0.75)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)"
                }}>
                  <Coins size={13} color={ACID_YELLOW} />
                  <span style={{ fontFamily: MF, fontWeight: 900, fontSize: 14, color: ACID_YELLOW }}>{gamStats.coins.toLocaleString()}</span>
                  <div style={{ width: 1, height: 13, background: "rgba(255,255,255,0.1)" }} />
                  <Sparkles size={13} color={ACID_YELLOW} />
                  <span style={{ fontFamily: MF, fontWeight: 900, fontSize: 14, color: ACID_YELLOW }}>Lv {gamStats.level}</span>
                </div>
              )}

              {streakData && streakData.currentStreak > 0 && (
                <div className="hero-badge" style={{
                  opacity: 0, display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 14px", borderRadius: 10,
                  background: `${fc}14`, border: `1px solid ${fc}40`, backdropFilter: "blur(12px)"
                }}>
                  <Flame size={13} color={fc} />
                  <span style={{ fontFamily: MF, fontWeight: 900, fontSize: 14, color: fc }}>{streakData.currentStreak}</span>
                  <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: `${fc}90` }}>day streak</span>
                </div>
              )}

              {du?.institutionName && (
                <div className="hero-badge" style={{
                  opacity: 0, display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 13px", borderRadius: 10,
                  background: "rgba(9,9,11,0.65)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)"
                }}>
                  <Building2 size={11} color="rgba(255,255,255,0.35)" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.42)" }}>{du.institutionName}</span>
                </div>
              )}

              <button className="hero-badge"
                onClick={() => { useUserStore.getState().clearUser(); window.postMessage({ type: "VANTAGE_LOGOUT" }, "*"); navigate("/login"); }}
                data-cursor="OUT"
                style={{
                  opacity: 0, marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 10,
                  background: "rgba(9,9,11,0.65)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)",
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)", cursor: "none", transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(237,255,102,0.35)"; e.currentTarget.style.color = ACID_YELLOW; e.currentTarget.style.background = "rgba(237,255,102,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.background = "rgba(9,9,11,0.65)"; }}
              ><LogOut size={11} /> Sign out</button>
            </div>
          </div>
        </div>

        {/* ══ BODY - TERMINAL DASHBOARD ══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 32 }}>
          {/* Top Row: Identity */}
          <Section>
            <Card accent="#EDFF66" style={{ border: `1px solid rgba(237,255,102,0.15)`, boxShadow: `0 0 40px rgba(237,255,102,0.05)` }}>
              <div style={{ padding: "28px", display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 88, height: 88, borderRadius: 16, background: `linear-gradient(135deg,${color}22,${color}08)`, border: `2px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MF, fontWeight: 900, fontSize: 40, color, boxShadow: `0 10px 30px ${glow}20` }}>
                    {du?.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div style={{ position: "absolute", bottom: -6, right: -6, width: 28, height: 28, borderRadius: 10, background: `${color}1c`, border: `1.5px solid ${color}45`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <TierIcon size={14} color={color} />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: `${color}90`, marginBottom: 4 }}>- Player Identity</div>
                  <div style={{ fontFamily: MF, fontWeight: 900, fontSize: 32, letterSpacing: MLS.displayWide, color: "#fff", lineHeight: 1, marginBottom: 6 }}>{du?.username}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>{du?.email}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ padding: "4px 10px", borderRadius: 6, background: `${color}15`, border: `1px solid ${color}30`, fontSize: 9, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color }}>{tierLabel} Tier</span>
                    {(du?.institutionName) && (
                      <span style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 9, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>{du.institutionName}</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right", paddingLeft: 24, borderLeft: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>ELO Rating</div>
                  <div style={{ fontFamily: MF, fontWeight: 900, fontSize: 48, letterSpacing: "-0.03em", lineHeight: 1, color, paddingRight: 4, textShadow: `0 0 20px ${glow}40` }}>{rating}</div>
                </div>
              </div>
            </Card>
          </Section>

          {/* DND Toggle Row */}
          <Section>
            <Card>
              <div style={{ padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {isDnd ? <VolumeX size={18} color={ACID_YELLOW} /> : <Volume2 size={18} color="rgba(255,255,255,0.3)" />}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 3 }}>Distress Beacon (DND)</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{isDnd ? `Active until ${mutLabel}` : "Receiving challenges normally"}</div>
                  </div>
                </div>
                {isDnd && (
                  <button onClick={unmuteChallenges} disabled={friendsActionLoading} data-cursor="OFF" style={{ padding: "8px 16px", borderRadius: 8, fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: ACID_YELLOW, background: "rgba(237,255,102,0.1)", border: "1px solid rgba(237,255,102,0.2)", cursor: "none", transition: "all 0.15s" }}>Turn Off</button>
                )}
              </div>
            </Card>
          </Section>

          {/* Grid Layout */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24 }}>
            {/* Column 1: XP & Overall Progress */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <Section>
                <Card accent="#EDFF66" style={{ border: "1px solid rgba(237,255,102,0.15)", height: "100%" }}>
                  <div style={{ padding: "24px", display: "flex", flexDirection: "column", height: "100%" }}>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>- Progress & XP</div>
                    <OverallProgress percentage={totalProgress.percentage} completed={totalProgress.completed} total={totalProgress.total} />

                    {gamStats && (
                      <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 20 }}>
                        <div style={{ height: 130, width: 130, flexShrink: 0 }}>
                          <RadarXPCanvas pct={xpPct} level={gamStats.level} color={ACID_YELLOW} glow={ACID_GLOW} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                            <div>
                              <div style={{ fontFamily: MF, fontWeight: 900, fontSize: 20, color: ACID_YELLOW, lineHeight: 1 }}>{(gamStats.xp || 0).toLocaleString()}</div>
                              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginTop: 5 }}>Total XP</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontFamily: MF, fontWeight: 900, fontSize: 20, color: "rgba(255,255,255,0.4)", lineHeight: 1 }}>{(gamStats.xpForNextLevel || 1).toLocaleString()}</div>
                              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginTop: 5 }}>Next Level</div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(237,255,102,0.1)", border: "1px solid rgba(237,255,102,0.2)", borderRadius: 10 }}>
                            <Coins size={18} color={ACID_YELLOW} />
                            <div style={{ flex: 1, fontFamily: MF, fontWeight: 900, fontSize: 20, color: ACID_YELLOW, lineHeight: 1 }}>{(gamStats.coins || 0).toLocaleString()}</div>
                            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(237,255,102,0.7)" }}>Credits</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </Section>

              {/* Stats Chips */}
              <Section>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
                  {pStats.map((s, i) => <StatChip key={s.label} {...s} delay={i * 80} />)}
                </div>
              </Section>
            </div>

            {/* Column 2: Streak & Difficulty Split */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Streak */}
              {streakData && (
                <Section>
                  <Card accent="#EDFF66" style={{ border: `1px solid rgba(237,255,102,0.15)` }}>
                    <div style={{ padding: "24px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>- Streak Metrics</div>
                          <div style={{ fontFamily: MF, fontWeight: 900, fontSize: "clamp(2.8rem,4vw,4rem)", letterSpacing: "-0.03em", lineHeight: 1, color: fc, textShadow: `0 0 40px ${fc}40` }}>
                            {streakData.currentStreak}
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
                            Day{streakData.currentStreak !== 1 ? "s" : ""} Active
                          </div>
                        </div>
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <div style={{ width: 72, height: 72, borderRadius: 20, background: `${fc}15`, border: `1.5px solid ${fc}30`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 35px ${fc}20` }}>
                            <Flame size={32} color={fc} />
                          </div>
                          {streakData.currentStreak > 0 && (<div style={{ position: "absolute", inset: -4, borderRadius: 24, border: `1px solid ${fc}25`, animation: "ringPulse 2s ease-in-out infinite" }} />)}
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
                        {[
                          { label: "Record", value: streakData.longestStreak || 0, color: "rgba(255,255,255,0.7)" },
                          { label: "Multi", value: `${(streakData.multiplier || 1).toFixed(1)}×`, color: ACID_YELLOW },
                          { label: "Shields", value: streakData.shieldCount || 0, color: ACID_YELLOW },
                          { label: "Goal", value: streakData.nextMilestone || "-", color: fc },
                        ].map(s => (
                          <div key={s.label} style={{ textAlign: "center", padding: "12px 6px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ fontFamily: MF, fontWeight: 900, fontSize: 16, color: s.color, lineHeight: 1 }}>{s.value}</div>
                            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginTop: 6 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(237,255,102,0.1)", border: "1px solid rgba(237,255,102,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
                        {streakData.solvedToday
                          ? <><CheckCircle size={14} color={ACID_YELLOW} /><span style={{ fontSize: 11, fontWeight: 700, color: ACID_YELLOW }}>Streak secured today</span></>
                          : streakData.shieldCount > 0
                            ? <><Shield size={14} color={ACID_YELLOW} /><span style={{ fontSize: 11, fontWeight: 700, color: ACID_YELLOW }}>{streakData.shieldCount} shield active</span></>
                            : <><Flame size={14} color={ACID_YELLOW} /><span style={{ fontSize: 11, fontWeight: 700, color: ACID_YELLOW }}>Solve today to {streakData.currentStreak > 0 ? "keep streak" : "start one"}</span></>
                        }
                      </div>
                    </div>
                  </Card>
                </Section>
              )}

              <Section>
                <Card accent="#EDFF66" style={{ border: "1px solid rgba(237,255,102,0.1)" }}>
                  <div style={{ padding: "24px" }}>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>- Difficulty Split</div>
                    <div style={{ display: "flex", justifyContent: "space-around" }}>
                      {[
                        { label: "Easy", count: diffBreakdown.easy, total: ALL_PROBLEMS.filter(p => p.difficulty === Difficulty.EASY).length, color: ACID_YELLOW },
                        { label: "Med", count: diffBreakdown.medium, total: ALL_PROBLEMS.filter(p => p.difficulty === Difficulty.MEDIUM).length, color: ACID_YELLOW },
                        { label: "Hard", count: diffBreakdown.hard, total: ALL_PROBLEMS.filter(p => p.difficulty === Difficulty.HARD).length, color: ACID_YELLOW },
                      ].map(d => <DiffRing key={d.label} {...d} />)}
                    </div>
                  </div>
                </Card>
              </Section>
            </div>
          </div>

          {/* Bottom Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24 }}>
            {/* Stage Progress */}
            <Section>
              <Card accent="#EDFF66" style={{ border: `1px solid rgba(237,255,102,0.1)`, height: "100%" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>- Stage Uplink</div>
                  <Target size={14} color="#EDFF66" />
                </div>
                <div style={{ paddingBottom: 12 }}>
                  {STAGE_ORDER.map((key, i) => (
                    <StageRow key={key} stageKey={key} stage={STAGES[key]} prog={getStageProgress(key)} idx={i} />
                  ))}
                </div>
              </Card>
            </Section>

            {/* Coin History */}
            {coinHistory?.content?.length > 0 && (
              <Section>
                <Card accent={ACID_YELLOW} style={{ height: "100%" }}>
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Coins size={14} color={ACID_YELLOW} />
                      <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>Credit Logs</span>
                    </div>
                    {coinHistory.totalPages > 1 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>[{coinPage + 1}/{coinHistory.totalPages}]</span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {coinHistory.content.map(tx => <CoinTx key={tx.id} tx={tx} />)}
                  </div>
                  {coinHistory.totalPages > 1 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <button data-cursor="PREV" onClick={async () => { if (coinPage > 0) { const p = coinPage - 1; setCoinPage(p); setCoinHistory(await fetchCoinHistory(user.uid, p, 10)); } }} disabled={coinPage === 0} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", color: coinPage === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)", cursor: "none", background: "none", border: "none", transition: "color 0.15s" }} onMouseEnter={e => { if (coinPage > 0) e.currentTarget.style.color = ACID_YELLOW; }} onMouseLeave={e => { e.currentTarget.style.color = coinPage === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)"; }}>
                        <ChevronLeft size={14} /> Prev
                      </button>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {Array.from({ length: Math.min(coinHistory.totalPages, 7) }).map((_, i) => (
                          <button key={i} data-cursor="PAGE" onClick={async () => { setCoinPage(i); setCoinHistory(await fetchCoinHistory(user.uid, i, 10)); }} style={{ width: coinPage === i ? 24 : 8, height: 4, borderRadius: 2, border: "none", cursor: "none", background: coinPage === i ? ACID_YELLOW : "rgba(255,255,255,0.15)", transition: "all 0.2s" }} />
                        ))}
                      </div>
                      <button data-cursor="NEXT" onClick={async () => { if (coinPage < coinHistory.totalPages - 1) { const p = coinPage + 1; setCoinPage(p); setCoinHistory(await fetchCoinHistory(user.uid, p, 10)); } }} disabled={coinPage >= coinHistory.totalPages - 1} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", color: coinPage >= coinHistory.totalPages - 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)", cursor: "none", background: "none", border: "none", transition: "color 0.15s" }} onMouseEnter={e => { if (coinPage < coinHistory.totalPages - 1) e.currentTarget.style.color = ACID_YELLOW; }} onMouseLeave={e => { e.currentTarget.style.color = coinPage >= coinHistory.totalPages - 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)"; }}>
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </Card>
              </Section>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        ::-webkit-scrollbar{width:0;height:0;}
        @keyframes blink    {0%,100%{opacity:1}50%{opacity:0.1}}
        @keyframes shimmer  {0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes ringPulse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:0;transform:scale(1.3)}}
      `}</style>
    </div >
  );
};

export default ProfilePage;
