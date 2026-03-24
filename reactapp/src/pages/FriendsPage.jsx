import { useEffect, useMemo, useState, useRef } from "react";
import {
  Check, Search, Swords, UserPlus, UserRoundX,
  Users, X, ChevronLeft, ChevronRight, Zap, Crown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import useFriendsStore from "@/stores/useFriendsStore";
import useUserStore from "@/stores/useUserStore";
import useBattleStore from "@/stores/useBattleStore";
import CustomCursor from "@/components/CustomCursor";
import { MONUMENT_TYPO as T } from "@/components/MonumentTypography";
import { Globe } from "@/components/ui/globe";

const PAGE_SIZE = 10;
const QUICK_DURATION_OPTIONS = [20, 30, 45, 60, 90, 120, 150, 180];

/* ─────────────────────────────────────────────────────────────────
   HERO CANVAS — soft floating nodes + gentle connections
   Think: a calm social graph, not a radar screen
───────────────────────────────────────────────────────────────── */
function HeroCanvas({ onlineCount, totalCount }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    // Build nodes — first is "you", then online friends, then offline
    const makeNodes = () => {
      const total = Math.min(Math.max(totalCount + 1, 7), 20);
      return Array.from({ length: total }, (_, i) => ({
        x: Math.random() * W(),
        y: Math.random() * H(),
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: i === 0 ? 6.5 : 3 + Math.random() * 2.8,
        online: i === 0 || i <= onlineCount,
        isUser: i === 0,
        phase: Math.random() * Math.PI * 2,
        opacity: 0,          // fade-in stagger
        targetOpacity: 1,
      }));
    };

    const nodes = makeNodes();
    let t = 0;
    let animId;

    const tick = () => {
      t += 0.01;
      ctx.clearRect(0, 0, W(), H());

      // Fade in staggered
      nodes.forEach((n, i) => {
        const target = t > i * 0.06 ? 1 : 0;
        n.opacity += (target - n.opacity) * 0.04;
      });

      // Move with soft boundary repulsion
      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        const pad = 30;
        if (n.x < pad)       { n.vx += 0.04; }
        if (n.x > W() - pad) { n.vx -= 0.04; }
        if (n.y < pad)       { n.vy += 0.04; }
        if (n.y > H() - pad) { n.vy -= 0.04; }
        // Gentle drag
        n.vx *= 0.998;
        n.vy *= 0.998;
      });

      // Edges between nearby nodes
      const maxDist = Math.min(W(), H()) * 0.28;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < maxDist) {
            const strength = (1 - d / maxDist);
            const alpha = strength * 0.1 * Math.min(a.opacity, b.opacity);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach(n => {
        if (n.opacity < 0.01) return;
        ctx.globalAlpha = n.opacity;
        const pulse = Math.sin(t * 1.6 + n.phase);

        if (n.isUser) {
          // YOU — warm yellow
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 32);
          glow.addColorStop(0, "rgba(237,255,102,0.18)");
          glow.addColorStop(1, "transparent");
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(n.x, n.y, 32, 0, Math.PI * 2); ctx.fill();

          ctx.beginPath(); ctx.arc(n.x, n.y, n.r + pulse * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(237,255,102,0.22)";
          ctx.strokeStyle = "rgba(237,255,102,0.85)";
          ctx.lineWidth = 1.4;
          ctx.fill(); ctx.stroke();

        } else if (n.online) {
          // Online friends — green
          if (pulse > 0.6) {
            ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 5 + pulse * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(52,211,153,${(pulse - 0.6) * 0.08})`; ctx.fill();
          }
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(52,211,153,0.28)";
          ctx.strokeStyle = "rgba(52,211,153,0.65)";
          ctx.lineWidth = 1;
          ctx.fill(); ctx.stroke();

        } else {
          // Offline — subtle white
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.05)";
          ctx.strokeStyle = "rgba(255,255,255,0.12)";
          ctx.lineWidth = 0.7;
          ctx.fill(); ctx.stroke();
        }

        ctx.globalAlpha = 1;
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [onlineCount, totalCount]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────
   AVATAR
───────────────────────────────────────────────────────────────── */
function Avatar({ name, online, size = 40 }) {
  return (
    <div style={{ position: "relative", flexShrink: 0, width: size, height: size }}>
      <div style={{
        width: size, height: size,
        borderRadius: Math.round(size * 0.28),
        background: online ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${online ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.08)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: T.fontFamily, fontWeight: 900,
        fontSize: Math.round(size * 0.38),
        color: online ? "#34d399" : "rgba(255,255,255,0.35)",
      }}>
        {name?.[0]?.toUpperCase() || "?"}
      </div>
      <div style={{
        position: "absolute", bottom: -1, right: -1,
        width: Math.round(size * 0.27), height: Math.round(size * 0.27),
        borderRadius: "50%",
        background: online ? "#34d399" : "rgba(255,255,255,0.15)",
        border: `${Math.max(2, Math.round(size * 0.055))}px solid #09090b`,
        boxShadow: online ? "0 0 7px rgba(52,211,153,0.7)" : "none",
      }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FRIEND ROW
───────────────────────────────────────────────────────────────── */
function FriendRow({ f, isOnline, onChallenge, actionLoading, activeBattleState }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "11px 16px", borderRadius: 12,
        background: hov ? "rgba(255,255,255,0.03)" : "transparent",
        transition: "background 0.15s", cursor: "none",
      }}
    >
      <Avatar name={f.username} online={isOnline} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 13.5, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {f.username}
        </div>
        <div style={{ fontSize: 11, color: isOnline ? "rgba(52,211,153,0.7)" : "rgba(255,255,255,0.22)", marginTop: 2, fontWeight: 500 }}>
          {isOnline ? "● Online" : "○ Offline"}
        </div>
      </div>
      {isOnline && !activeBattleState ? (
        <button onClick={() => onChallenge?.(f)} disabled={actionLoading} data-cursor="FIGHT"
          style={{ height: 32, paddingLeft: 14, paddingRight: 14, borderRadius: 8, border: "none", cursor: "none", background: hov ? "#f87171" : "rgba(248,113,113,0.12)", color: hov ? "#fff" : "#f87171", fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 5, opacity: actionLoading ? 0.4 : 1, transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0 }}>
          <Swords size={11} /> Fight
        </button>
      ) : (
        <div style={{ height: 32, paddingLeft: 12, paddingRight: 12, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", flexShrink: 0, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.18)" }}>Away</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   REQUEST ROW
───────────────────────────────────────────────────────────────── */
function RequestRow({ name, meta, onAccept, onReject, onCancel, actionLoading }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 16px", borderRadius: 12, cursor: "none" }}>
      <Avatar name={name} online={false} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.fontFamily, fontWeight: 900, fontSize: 13.5, letterSpacing: T.letterSpacing?.monument || "0.03em", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 2, fontWeight: 500 }}>{meta}</div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {onAccept && (
          <button disabled={actionLoading} onClick={onAccept} data-cursor="ACCEPT"
            style={{ width: 32, height: 32, borderRadius: 8, border: "none", cursor: "none", background: "rgba(52,211,153,0.1)", display: "flex", alignItems: "center", justifyContent: "center", opacity: actionLoading ? 0.4 : 1, transition: "background 0.15s" }}
            onMouseEnter={e => { if (!actionLoading) e.currentTarget.style.background = "rgba(52,211,153,0.22)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(52,211,153,0.1)"; }}
          ><Check size={13} color="#34d399" /></button>
        )}
        {onReject && (
          <button disabled={actionLoading} onClick={onReject} data-cursor="REJECT"
            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", cursor: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.28)", opacity: actionLoading ? 0.4 : 1, transition: "all 0.15s" }}
            onMouseEnter={e => { if (!actionLoading) { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)"; }}}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.28)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
          ><X size={13} /></button>
        )}
        {onCancel && (
          <button disabled={actionLoading} onClick={onCancel} data-cursor="CANCEL"
            style={{ height: 32, paddingLeft: 14, paddingRight: 14, borderRadius: 8, cursor: "none", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.28)", opacity: actionLoading ? 0.4 : 1, transition: "all 0.15s" }}
            onMouseEnter={e => { if (!actionLoading) { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)"; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.28)"; }}
          >Cancel</button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SEARCH RESULT ROW
───────────────────────────────────────────────────────────────── */
function SearchRow({ u, sendRequest, acceptRequest, actionLoading }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 10, cursor: "none", transition: "background 0.12s" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <Avatar name={u.username} online={false} size={34} />
      <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif" }}>{u.username}</span>
      {u.relationStatus === "NONE" && (
        <button disabled={actionLoading} onClick={() => sendRequest(u.uid)} data-cursor="ADD"
          style={{ height: 30, paddingLeft: 12, paddingRight: 12, borderRadius: 7, border: "none", cursor: "none", background: "#EDFF66", color: "#09090b", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", gap: 5, opacity: actionLoading ? 0.4 : 1, flexShrink: 0 }}>
          <UserPlus size={11} /> Add
        </button>
      )}
      {u.relationStatus === "FRIEND" && (
        <span style={{ fontSize: 10, fontWeight: 800, color: "#34d399", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", padding: "3px 10px", borderRadius: 6, flexShrink: 0 }}>Friends</span>
      )}
      {u.relationStatus === "REQUEST_SENT" && (
        <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "3px 10px", borderRadius: 6, flexShrink: 0 }}>Sent</span>
      )}
      {u.relationStatus === "REQUEST_RECEIVED" && u.pendingRequestId && (
        <button disabled={actionLoading} onClick={() => acceptRequest(u.pendingRequestId)} data-cursor="ACCEPT"
          style={{ width: 30, height: 30, borderRadius: 7, border: "none", cursor: "none", background: "rgba(52,211,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center", opacity: actionLoading ? 0.4 : 1, flexShrink: 0 }}>
          <Check size={12} color="#34d399" />
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   CHALLENGE MODAL
───────────────────────────────────────────────────────────────── */
function ChallengeModal({ target, onClose, onSubmit, loading }) {
  const [mode, setMode]   = useState("CASUAL_1V1");
  const [diff, setDiff]   = useState("MEDIUM");
  const [count, setCount] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const ref = useRef(null);

  useGSAP(() => {
    gsap.fromTo(".cm-bg",   { opacity: 0 }, { opacity: 1, duration: 0.18 });
    gsap.fromTo(ref.current, { opacity: 0, y: 16, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.36, ease: "expo.out", delay: 0.05 });
    gsap.fromTo(".cm-row",  { opacity: 0, y: 8 }, { opacity: 1, y: 0, stagger: 0.04, duration: 0.3, ease: "power3.out", delay: 0.14 });
  }, {});

  return (
    <div className="cm-bg" style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(14px)" }}>
      <div ref={ref} style={{ width: "100%", maxWidth: 400, background: "#0e0e11", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.7)" }}>
        <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(248,113,113,0.6),transparent)" }} />

        {/* Header */}
        <div className="cm-row" style={{ opacity: 0, padding: "20px 22px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={target.username} online size={36} />
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: 2 }}>Challenge</div>
              <div style={{ fontFamily: T.fontFamily, fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: T.letterSpacing?.monument || "0.03em" }}>{target.username}</div>
            </div>
          </div>
          <button onClick={onClose} data-cursor="CLOSE"
            style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", cursor: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.28)", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.28)"; }}
          ><X size={13} /></button>
        </div>

        <div style={{ padding: "18px 22px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Mode */}
          <div className="cm-row" style={{ opacity: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 8 }}>Mode</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {[{ v: "CASUAL_1V1", label: "Casual", icon: Zap, color: "#c4b5fd" }, { v: "RANKED_1V1", label: "Ranked", icon: Crown, color: "#EDFF66" }].map(({ v, label, icon: Icon, color }) => {
                const act = mode === v;
                return (
                  <button key={v} onClick={() => setMode(v)} data-cursor={label.toUpperCase()}
                    style={{ padding: "11px 13px", borderRadius: 10, border: `1px solid ${act ? color + "30" : "rgba(255,255,255,0.06)"}`, cursor: "none", background: act ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)", textAlign: "left", transition: "all 0.15s" }}>
                    <Icon size={13} color={act ? color : "rgba(255,255,255,0.2)"} style={{ marginBottom: 7 }} />
                    <div style={{ fontFamily: T.fontFamily, fontSize: 12, fontWeight: 900, color: act ? "#fff" : "rgba(255,255,255,0.35)", letterSpacing: T.letterSpacing?.monument || "0.03em" }}>{label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty */}
          <div className="cm-row" style={{ opacity: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 8 }}>Difficulty</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7 }}>
              {[{ v: "EASY", label: "Easy", color: "#34d399" }, { v: "MEDIUM", label: "Medium", color: "#fbbf24" }, { v: "HARD", label: "Hard", color: "#f87171" }].map(({ v, label, color }) => {
                const act = diff === v;
                return (
                  <button key={v} onClick={() => setDiff(v)} data-cursor={label.toUpperCase()}
                    style={{ padding: "9px 0", borderRadius: 9, border: `1px solid ${act ? color + "35" : "rgba(255,255,255,0.06)"}`, cursor: "none", background: act ? `${color}0d` : "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11, fontWeight: 800, color: act ? color : "rgba(255,255,255,0.3)", transition: "all 0.15s" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: act ? color : "rgba(255,255,255,0.18)" }} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Problems */}
          <div className="cm-row" style={{ opacity: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 8 }}>Problems</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7 }}>
              {[1, 2, 3].map(n => {
                const act = count === n;
                return (
                  <button key={n} onClick={() => setCount(n)} data-cursor="SELECT"
                    style={{ padding: "12px 0", borderRadius: 9, border: `1px solid ${act ? "rgba(237,255,102,0.25)" : "rgba(255,255,255,0.06)"}`, cursor: "none", background: act ? "#EDFF66" : "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, fontSize: 17, fontWeight: 900, color: act ? "#09090b" : "rgba(255,255,255,0.32)", transition: "all 0.15s" }}>
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Limit */}
          <div className="cm-row" style={{ opacity: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 8 }}>Time Limit</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7, marginBottom: 7 }}>
              {QUICK_DURATION_OPTIONS.map((m) => {
                const act = durationMinutes === m;
                return (
                  <button key={m} onClick={() => setDurationMinutes(m)} data-cursor="SELECT"
                    style={{ padding: "10px 0", borderRadius: 9, border: `1px solid ${act ? "rgba(237,255,102,0.25)" : "rgba(255,255,255,0.06)"}`, cursor: "none", background: act ? "rgba(237,255,102,0.12)" : "rgba(255,255,255,0.02)", fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: act ? "#EDFF66" : "rgba(255,255,255,0.35)", transition: "all 0.15s" }}>
                    {m}m
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="cm-row" style={{ opacity: 0, display: "flex", gap: 8 }}>
            <button onClick={onClose} data-cursor="CANCEL"
              style={{ height: 44, paddingLeft: 18, paddingRight: 18, borderRadius: 11, cursor: "none", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
            >Cancel</button>
            <button onClick={() => onSubmit({ mode, difficulty: diff, count, durationMinutes })} disabled={loading} data-cursor="FIGHT"
              style={{ flex: 1, height: 44, borderRadius: 11, border: "none", cursor: "none", background: loading ? "rgba(248,113,113,0.4)" : "#f87171", color: "#fff", fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "opacity 0.15s" }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            ><Swords size={13} /> Send Challenge</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PILL TABS
───────────────────────────────────────────────────────────────── */
function PillTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 2, padding: 3, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
      {tabs.map(tab => {
        const act = tab.key === active;
        return (
          <button key={tab.key} onClick={() => onChange(tab.key)} data-cursor={tab.label.toUpperCase()}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 7, border: "none", cursor: "none", background: act ? "rgba(255,255,255,0.08)" : "transparent", outline: act ? "1px solid rgba(255,255,255,0.1)" : "none", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: act ? "#fff" : "rgba(255,255,255,0.32)", transition: "all 0.15s" }}
            onMouseEnter={e => { if (!act) e.currentTarget.style.color = "rgba(255,255,255,0.58)"; }}
            onMouseLeave={e => { if (!act) e.currentTarget.style.color = "rgba(255,255,255,0.32)"; }}
          >
            <tab.icon size={11} />
            {tab.label}
            {tab.count > 0 && (
              <span style={{ background: act ? "rgba(237,255,102,0.14)" : "rgba(255,255,255,0.07)", color: act ? "#EDFF66" : "rgba(255,255,255,0.38)", borderRadius: 5, padding: "1px 6px", fontSize: 9, fontWeight: 900, fontFamily: T.fontFamily }}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────────────── */
function Empty({ icon: Icon, title, sub }) {
  return (
    <div style={{ padding: "52px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={18} color="rgba(255,255,255,0.15)" />
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>{title}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", lineHeight: 1.65, maxWidth: 220 }}>{sub}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════ */
export default function FriendsPage() {
  const navigate = useNavigate();
  const user = useUserStore(s => s.user);
  const activeBattleState = useBattleStore(s => s.activeBattleState);
  const pageRef = useRef(null);

  const {
    friends, incomingRequests, outgoingRequests,
    friendsPresence, searchResults, searchPage, searchTotalPages,
    loadingOverview, loadingSearch, actionLoading, error,
    loadOverview, loadFriendsPresence, searchUsers,
    sendRequest, acceptRequest, rejectRequest, cancelRequest, sendChallenge,
  } = useFriendsStore();

  const [query,           setQuery]           = useState("");
  const [activeTab,       setActiveTab]       = useState("friends");
  const [challengeTarget, setChallengeTarget] = useState(null);

  useEffect(() => { loadOverview(); loadFriendsPresence(); }, [loadOverview, loadFriendsPresence]);
  useEffect(() => {
    if (!query.trim()) return;
    const h = setTimeout(() => searchUsers(query, 0, PAGE_SIZE), 300);
    return () => clearTimeout(h);
  }, [query, searchUsers]);

  useGSAP(() => {
    gsap.fromTo(".fp-hero-text",
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, stagger: 0.09, duration: 0.65, ease: "expo.out", delay: 0.1 }
    );
    gsap.fromTo(".fp-card",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.07, duration: 0.55, ease: "expo.out", delay: 0.28 }
    );
  }, { scope: pageRef });

  const onlineFriends = useMemo(
    () => friends.filter(f => !!friendsPresence?.[f.uid]?.online),
    [friends, friendsPresence]
  );
  const onlineRate = friends.length > 0
    ? Math.round((onlineFriends.length / friends.length) * 100)
    : 0;

  const handleChallenge = async ({ mode, difficulty, count, durationMinutes }) => {
    if (!challengeTarget?.uid) return;
    const res = await sendChallenge({
      targetUserId: challengeTarget.uid,
      mode,
      difficulty,
      problemCount: count,
      durationMinutes,
    });
    if (res?.ok) setChallengeTarget(null);
  };

  // ── NOT LOGGED IN ──
  if (!user?.uid) {
    return (
      <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "none" }}>
        <CustomCursor />
        <div style={{ maxWidth: 360, width: "100%", background: "#0c0c0f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, overflow: "hidden", boxShadow: "0 32px 64px rgba(0,0,0,0.5)" }}>
          <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(237,255,102,0.5),transparent)" }} />
          <div style={{ padding: "36px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={20} color="rgba(255,255,255,0.3)" />
            </div>
            <div>
              <div style={{ fontFamily: T.fontFamily, fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: T.letterSpacing?.monument || "0.03em", marginBottom: 8 }}>Sign in to continue</div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 1.7 }}>Connect and challenge players on the platform.</p>
            </div>
            <button onClick={() => navigate("/login")} data-cursor="GO"
              style={{ width: "100%", height: 44, borderRadius: 11, border: "none", cursor: "none", background: "#EDFF66", color: "#09090b", fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const TABS = [
    { key: "friends",  icon: Users,      label: "Friends",  count: friends.length },
    { key: "incoming", icon: Check,      label: "Pending",  count: incomingRequests.length },
    { key: "sent",     icon: UserRoundX, label: "Sent",     count: outgoingRequests.length },
  ];

  return (
    <div ref={pageRef} style={{ minHeight: "100vh", background: "#09090b", paddingTop: 56, paddingBottom: 80, cursor: "none", overflowX: "hidden", position: "relative" }}>
      <CustomCursor />

      {/* Page-corner globe */}
      <div style={{ position: "fixed", right: 0, bottom: 0, width: "clamp(460px,56vw,780px)", height: "clamp(460px,56vw,780px)", transform: "translate(25%,25%)", opacity: 0.72, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <Globe />
        </div>
      </div>

      {/* ══ HERO ══ */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto", padding: "40px clamp(24px,5vw,56px) 0", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap", fontFamily: T.fontFamily, fontWeight: 900, fontSize: "clamp(4.8rem,13vw,10rem)", letterSpacing: "-0.02em", color: "rgba(255,255,255,0.03)", lineHeight: 0.9 }}>
            FRIENDS
          </div>

          <div className="fp-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 30, alignItems: "end", paddingBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.05)", position: "relative" }}>
            <div>
              <div className="fp-hero-text" style={{ opacity: 0, fontSize: 9, fontWeight: 900, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: 14 }}>
                - Social Hub
              </div>

              <h1 className="fp-hero-text" style={{ opacity: 0, fontFamily: T.fontFamily, letterSpacing: "-0.02em", fontWeight: 900, fontSize: "clamp(2.6rem,5vw,4.8rem)", lineHeight: 0.9, margin: "0 0 14px" }}>
                <span style={{ color: "#fff", display: "block" }}>Friends</span>
                <span style={{ color: "#34d399", display: "block" }}>Network.</span>
              </h1>

              <p className="fp-hero-text" style={{ opacity: 0, fontSize: 14, color: "rgba(255,255,255,0.3)", lineHeight: 1.7, maxWidth: 430 }}>
                Build your coding circle. Track online teammates and jump into live challenges.
              </p>
            </div>

            <div className="fp-hero-text fp-hero-stats" style={{ opacity: 0, display: "flex", flexDirection: "column", gap: 0, flexShrink: 0, minWidth: 250, background: "#0d0d10", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ height: 2, background: "linear-gradient(90deg,#34d399,rgba(52,211,153,0.2))" }} />

              <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 6 }}>
                  Network Overview
                </div>
                <div style={{ fontFamily: T.fontFamily, letterSpacing: "-0.015em", fontSize: 30, fontWeight: 900, color: "#34d399", lineHeight: 1, textShadow: "0 0 24px rgba(52,211,153,0.28)" }}>
                  {friends.length}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                {[
                  { label: "Online", value: onlineFriends.length, color: "#34d399" },
                  { label: "Pending", value: incomingRequests.length, color: "#fbbf24" },
                  { label: "Rate", value: `${onlineRate}%`, color: "#EDFF66" },
                ].map((s, i) => (
                  <div key={s.label} style={{ padding: "12px 14px", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <div style={{ fontFamily: T.fontFamily, fontSize: 17, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 3, textShadow: `0 0 14px ${s.color}30` }}>{s.value}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "10px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${onlineRate}%`, borderRadius: 3, background: "linear-gradient(90deg,#34d399,#EDFF66)", boxShadow: "0 0 6px rgba(52,211,153,0.35)", transition: "width 0.7s ease-out" }} />
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* ══ MAIN ══ */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto", padding: "28px clamp(24px,5vw,56px) 0", display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "start" }}>

        {/* ── Friends list ── */}
        <div className="fp-card" style={{ opacity: 0, background: "#0c0c0f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

          {/* Panel header */}
          <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <PillTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

            {activeTab === "friends" && onlineFriends.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 7, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.14)" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", animation: "blink 1.4s step-end infinite" }} />
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(52,211,153,0.8)" }}>
                  {onlineFriends.length} online
                </span>
              </div>
            )}
          </div>

          {/* List */}
          <div style={{ padding: "6px 4px" }}>
            {error && (
              <div style={{ margin: "6px 12px 8px", padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.18)", fontSize: 12, color: "#f87171", display: "flex", alignItems: "center", gap: 7 }}>
                <X size={12} /> {error}
              </div>
            )}

            {activeTab === "friends" && (
              loadingOverview
                ? <div style={{ padding: "44px 0", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)", animation: "pulse 1.4s ease-in-out infinite" }}>Loading…</div>
                : friends.length === 0
                  ? <Empty icon={Users} title="No friends yet" sub="Search for players on the right to start building your network." />
                  : friends.map(f => (
                    <FriendRow key={f.uid} f={f}
                      isOnline={!!friendsPresence?.[f.uid]?.online}
                      onChallenge={setChallengeTarget}
                      actionLoading={actionLoading}
                      activeBattleState={activeBattleState}
                    />
                  ))
            )}

            {activeTab === "incoming" && (
              incomingRequests.length === 0
                ? <Empty icon={Check} title="All clear" sub="No pending friend requests." />
                : incomingRequests.map(req => (
                  <RequestRow key={req.id} name={req.requester.username} meta="Wants to connect"
                    onAccept={() => acceptRequest(req.id)}
                    onReject={() => rejectRequest(req.id)}
                    actionLoading={actionLoading}
                  />
                ))
            )}

            {activeTab === "sent" && (
              outgoingRequests.length === 0
                ? <Empty icon={UserPlus} title="No sent requests" sub="Use search to find and add players." />
                : outgoingRequests.map(req => (
                  <RequestRow key={req.id} name={req.addressee.username} meta="Awaiting response"
                    onCancel={() => cancelRequest(req.id)}
                    actionLoading={actionLoading}
                  />
                ))
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 76 }}>

          {/* Search */}
          <div className="fp-card" style={{ opacity: 0, background: "#0c0c0f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ height: 1, background: "linear-gradient(90deg,rgba(237,255,102,0.4),transparent)" }} />
            <div style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: 12 }}>Find Players</div>

              <div style={{ position: "relative", marginBottom: 10 }}>
                <Search size={13} color="rgba(255,255,255,0.2)"
                  style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search username…"
                  style={{ width: "100%", height: 40, borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", paddingLeft: 36, paddingRight: 12, fontSize: 12.5, color: "#fff", outline: "none", transition: "border-color 0.15s" }}
                  onFocus={e => e.currentTarget.style.borderColor = "rgba(237,255,102,0.35)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              </div>

              {query.trim() ? (
                loadingSearch ? (
                  <div style={{ padding: "18px 0", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)", animation: "pulse 1.4s ease-in-out infinite" }}>Searching…</div>
                ) : searchResults.length === 0 ? (
                  <div style={{ padding: "18px 0", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No users found.</div>
                ) : (
                  <>
                    <div style={{ maxHeight: 300, overflowY: "auto", margin: "0 -4px" }}>
                      {searchResults.map(u => (
                        <SearchRow key={u.uid} u={u} sendRequest={sendRequest} acceptRequest={acceptRequest} actionLoading={actionLoading} />
                      ))}
                    </div>
                    {searchTotalPages > 1 && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <button disabled={searchPage === 0 || loadingSearch} onClick={() => searchUsers(query, searchPage - 1, PAGE_SIZE)}
                          style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", cursor: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", opacity: searchPage === 0 ? 0.3 : 1 }}>
                          <ChevronLeft size={11} />
                        </button>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.2)" }}>
                          {searchPage + 1} / {Math.max(searchTotalPages, 1)}
                        </span>
                        <button disabled={searchPage + 1 >= searchTotalPages || loadingSearch} onClick={() => searchUsers(query, searchPage + 1, PAGE_SIZE)}
                          style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", cursor: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", opacity: searchPage + 1 >= searchTotalPages ? 0.3 : 1 }}>
                          <ChevronRight size={11} />
                        </button>
                      </div>
                    )}
                  </>
                )
              ) : (
                <div style={{ paddingTop: 4, paddingBottom: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <Search size={10} color="rgba(255,255,255,0.18)" />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,0.2)" }}>Type to find players</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Online now — only shows if there are online friends */}
          {onlineFriends.length > 0 && (
            <div className="fp-card" style={{ opacity: 0, background: "#0c0c0f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ height: 1, background: "linear-gradient(90deg,rgba(52,211,153,0.35),transparent)" }} />
              <div style={{ padding: "14px 18px" }}>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.26em", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 7, color: "rgba(52,211,153,0.65)" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", animation: "blink 1.4s step-end infinite" }} />
                  Online Now
                </div>
                <div>
                  {onlineFriends.slice(0, 5).map((f, i) => (
                    <div key={f.uid} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < Math.min(onlineFriends.length, 5) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <Avatar name={f.username} online size={30} />
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.72)", fontFamily: T.fontFamily, letterSpacing: T.letterSpacing?.monument || "0.03em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.username}</span>
                      {!activeBattleState && (
                        <button onClick={() => setChallengeTarget(f)} data-cursor="FIGHT"
                          style={{ width: 28, height: 28, borderRadius: 7, border: "none", cursor: "none", background: "rgba(248,113,113,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171", transition: "background 0.15s", flexShrink: 0 }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.2)"}
                          onMouseLeave={e => e.currentTarget.style.background = "rgba(248,113,113,0.1)"}
                        ><Swords size={11} /></button>
                      )}
                    </div>
                  ))}
                  {onlineFriends.length > 5 && (
                    <div style={{ paddingTop: 8, fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>+{onlineFriends.length - 5} more online</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ CHALLENGE MODAL ══ */}
      {challengeTarget && (
        <ChallengeModal
          target={challengeTarget}
          onClose={() => setChallengeTarget(null)}
          onSubmit={handleChallenge}
          loading={actionLoading}
        />
      )}

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @media (max-width: 820px) {
          .fp-hero-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .fp-hero-stats { min-width: 0 !important; width: 100% !important; }
          div[style*="grid-template-columns: 1fr 320px"] { grid-template-columns: 1fr !important; }
          div[style*="position: sticky"] { position: static !important; }
        }
      `}</style>
    </div>
  );
}