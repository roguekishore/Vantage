import { useRef, useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Eye, BookOpen, Map as MapIcon, Swords, Trophy,
  Award, Bell, UserRoundPlus, Coins, Sparkles,
  Flame, Shield, VolumeX, ArrowUpRight,
} from "lucide-react";
import useUserStore from "@/stores/useUserStore";
import useGamificationStore from "@/stores/useGamificationStore";
import useAchievementStore from "@/stores/useAchievementStore";
import useFriendsStore from "@/stores/useFriendsStore";
import AppToast from "@/components/ui/app-toast";
import BrandLogo from "@/components/Logo";

/* ─────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────── */
const LINKS = [
  { label:"Visualize", path:"/visualizers", Icon:Eye           },
  { label:"Problems",  path:"/problems",    Icon:BookOpen      },
  { label:"Battle",    path:"/battle",      Icon:Swords        },
  { label:"Friends",   path:"/friends",     Icon:UserRoundPlus, friendBadge:true },
  { label:"Ranks",     path:"/leaderboard", Icon:Trophy        },
  { label:"Badges",    path:"/achievements",Icon:Award         },
  { label:"Map",       path:"/map",         Icon:MapIcon       },
];

const GLITCH = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijklmnpqrstuvwxyz0123456789!@#%^&*";

const NAV_TYPO = {
  fontFamily: "'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  canvasFontFamily: "'Inter'",
  letterSpacing: {
    monument: "0.02em",
    displayTight: "-0.015em",
    displayWide: "-0.02em",
    metric: "0.02em",
    logo: "0.03em",
  },
};

/* ─────────────────────────────────────────────────────────
   GLITCH TEXT HOOK
───────────────────────────────────────────────────────── */
function useGlitchText(text, active) {
  const [out, setOut] = useState(text);
  const raf = useRef(null);

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    if (!active) { setOut(text); return; }
    const start = performance.now();
    const DUR   = 360;
    const tick  = now => {
      const pct      = Math.min(1, (now - start) / DUR);
      const resolved = Math.floor(pct * text.length);
      setOut(text.split("").map((ch, i) => {
        if (ch === " " || i < resolved) return ch;
        return GLITCH[Math.floor(Math.random() * GLITCH.length)];
      }).join(""));
      if (pct < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [active, text]);

  return out;
}

/* ─────────────────────────────────────────────────────────
   GLITCH LINK
───────────────────────────────────────────────────────── */
function GlitchLink({ label, path, active, badge }) {
  const [hover, setHover] = useState(false);
  const display = useGlitchText(label, hover && !active);

  return (
    <Link to={path}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      data-cursor={label.toUpperCase()}
      style={{ position:"relative", padding:"6px 12px", textDecoration:"none",
        borderRadius:8, cursor:"none", display:"inline-flex", alignItems:"center",
        fontFamily:NAV_TYPO.fontFamily,
        fontSize:12, fontWeight:active ? 900 : 600,
        letterSpacing: active ? NAV_TYPO.letterSpacing.metric : NAV_TYPO.letterSpacing.monument,
        color: active ? "#EDFF66" : hover ? "#fff" : "rgba(255,255,255,0.4)",
        transition:"color 0.1s" }}>
      {display}
      {active && (
        <div style={{ position:"absolute", bottom:1, left:"50%", transform:"translateX(-50%)",
          width:3, height:3, borderRadius:"50%", background:"#EDFF66",
          boxShadow:"0 0 7px 2px rgba(237,255,102,0.85)" }} />
      )}
      {badge > 0 && (
        <div style={{ position:"absolute", top:3, right:3,
          width:6, height:6, borderRadius:"50%", background:"#f87171",
          boxShadow:"0 0 5px rgba(248,113,113,0.8)",
          border:"1.5px solid #09090b" }} />
      )}
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────
   ROLLING COUNTER
───────────────────────────────────────────────────────── */
function Roll({ value, color, suffix="" }) {
  const [n, setN]  = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const from = prev.current, to = typeof value === "number" ? value : 0;
    prev.current = to;
    if (from === to) { setN(to); return; }
    const steps = 22; let i = 0;
    const id = setInterval(() => {
      i++;
      const t = i / steps, ease = t < .5 ? 2*t*t : -1+(4-2*t)*t;
      setN(Math.round(from + (to - from) * ease));
      if (i >= steps) { clearInterval(id); setN(to); }
    }, 18);
    return () => clearInterval(id);
  }, [value]);

  const display = typeof value === "number" ? n.toLocaleString() : value;

  return (
    <span style={{ fontFamily:NAV_TYPO.fontFamily, fontSize:12, fontWeight:900,
      color, letterSpacing:NAV_TYPO.letterSpacing.metric, lineHeight:1 }}>
      {typeof value === "string" ? value : display}{suffix}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   XP PROGRESS — 1px acid line at nav bottom
───────────────────────────────────────────────────────── */
function XPLine({ xp, cap }) {
  const ref = useRef(null);
  const sweepRef = useRef(null);
  const tlRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (!ref.current || !sweepRef.current) return;
    const el = ref.current;
    const sweepEl = sweepRef.current;

    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
    }
    gsap.killTweensOf(el);
    gsap.killTweensOf(sweepEl);
    gsap.set(el, { width: "0%" });
    gsap.set(sweepEl, { left: "-32%", opacity: 0 });

    const tl = gsap.timeline();
    tl.to(el, {
      width:"100%",
      duration:0.9,
      ease:"power3.out",
      overwrite:"auto",
    }, 0);
    tl.to(sweepEl, { opacity: 1, duration: 0.06, ease: "none" }, 0.02);
    tl.to(sweepEl, { left: "100%", duration: 0.98, ease: "power2.out" }, 0.02);
    tl.to(sweepEl, { opacity: 0, duration: 0.12, ease: "power1.out" }, 0.84);
    tlRef.current = tl;

    return () => {
      if (tlRef.current) {
        tlRef.current.kill();
        tlRef.current = null;
      }
      gsap.killTweensOf(el);
      gsap.killTweensOf(sweepEl);
    };
  }, [location.pathname]);

  return (
    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:1,
      background:"rgba(255,255,255,0.04)", overflow:"hidden", pointerEvents:"none" }}>
      <div ref={ref} style={{ height:"100%", width:"0%",
        background:"linear-gradient(90deg,rgba(237,255,102,0.3) 0%,#EDFF66 80%,rgba(255,255,255,0.9) 100%)",
        boxShadow:"0 0 8px rgba(237,255,102,0.6), 0 0 2px #EDFF66" }} />
      <div
        ref={sweepRef}
        style={{
          position:"absolute",
          top:0,
          bottom:0,
          left:"-32%",
          width:"32%",
          opacity:0,
          background:"linear-gradient(90deg, rgba(237,255,102,0) 0%, rgba(237,255,102,0.78) 45%, rgba(255,255,255,0.95) 52%, rgba(237,255,102,0.78) 60%, rgba(237,255,102,0) 100%)",
          filter:"blur(0.35px)",
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SCAN TICKER — scrolling DSA terms behind nav
───────────────────────────────────────────────────────── */
function Ticker({ visible }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!visible) return;
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    c.width  = c.offsetWidth  * dpr;
    c.height = c.offsetHeight * dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);

    const WORDS = ["TWO SUM","BINARY SEARCH","MERGE SORT","QUICK SORT","BFS TRAVERSAL",
      "DFS","DYNAMIC PROGRAMMING","SLIDING WINDOW","TRIE","HEAP SORT","DIJKSTRA",
      "LINKED LIST","STACK","QUEUE","BACKTRACKING","GREEDY","DIVIDE & CONQUER",
      "UNION FIND","SEGMENT TREE","TOPOLOGICAL SORT"];
    const str   = Array(4).fill(WORDS.join("  ·  ")).join("  ·  ") + "  ·  ";
    let offset  = 0, raf;

    const tick = () => {
      const W = c.offsetWidth, H = c.offsetHeight;
      ctx.clearRect(0,0,W,H);
      ctx.font = `600 7.5px ${NAV_TYPO.canvasFontFamily},monospace`;
      const mw  = ctx.measureText(str).width;
      offset = (offset + 0.3) % mw;
      ctx.fillStyle = "rgba(255,255,255,0.042)";
      ctx.textBaseline = "middle";
      ctx.fillText(str, -offset, H / 2);
      if (-offset + mw < W) ctx.fillText(str, -offset + mw, H / 2);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  return <canvas ref={ref} style={{ position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none" }} />;
}

/* ─────────────────────────────────────────────────────────
   LOGO CANVAS — scan-line hover effect
───────────────────────────────────────────────────────── */
function Logo() {
  return (
    <Link to="/" data-cursor="HOME"
      style={{ display:"flex",alignItems:"center",gap:9,textDecoration:"none",flexShrink:0,cursor:"none" }}>
      <div style={{ width:28,height:28,borderRadius:8,flexShrink:0,position:"relative",
        border:"1px solid rgba(255,255,255,0.1)",overflow:"hidden",
        background:"rgba(255,255,255,0.04)" }}>
        <BrandLogo size={28} style={{ borderRadius: 8 }} />
      </div>
      {/* <span style={{ fontFamily:NAV_TYPO.fontFamily,fontSize:14,fontWeight:900,
        color:"#fff",letterSpacing:NAV_TYPO.letterSpacing.logo,lineHeight:1 }}>Vantage</span> */}
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────
   FULLSCREEN MOBILE OVERLAY — giant editorial links
───────────────────────────────────────────────────────── */
function MobileOverlay({ open, onClose, links, isActive, incomingCount, stats, streak, user }) {
  const rootRef    = useRef(null);
  const itemRefs   = useRef([]);
  const footerRef  = useRef(null);
  const wasOpen    = useRef(false);

  useEffect(() => {
    const el = rootRef.current; if (!el) return;
    if (open && !wasOpen.current) {
      wasOpen.current = true;
      el.style.display = "flex";
      el.style.pointerEvents = "all";
      gsap.fromTo(el, { opacity:0 }, { opacity:1, duration:0.28, ease:"power2.out" });
      gsap.fromTo(itemRefs.current.filter(Boolean),
        { y:28, opacity:0 },
        { y:0, opacity:1, duration:0.5, stagger:0.04, ease:"power3.out", delay:0.1 }
      );
      if (footerRef.current)
        gsap.fromTo(footerRef.current, { opacity:0, y:16 }, { opacity:1, y:0, duration:0.4, ease:"power2.out", delay:0.35 });

    } else if (!open && wasOpen.current) {
      wasOpen.current = false;
      gsap.to(itemRefs.current.filter(Boolean), { y:16, opacity:0, duration:0.22, stagger:0.025, ease:"power2.in" });
      gsap.to(el, {
        opacity:0, duration:0.28, ease:"power2.in", delay:0.1,
        onComplete:() => { el.style.display="none"; el.style.pointerEvents="none"; }
      });
    }
  }, [open]);

  return (
    <div ref={rootRef}
      style={{ display:"none", position:"fixed", inset:0, zIndex:200,
        background:"#09090b", flexDirection:"column", pointerEvents:"none" }}>

      {/* grain */}
      <div style={{ position:"absolute",inset:0,pointerEvents:"none",opacity:0.028,
        backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundSize:"200px" }} />

      {/* corner deco */}
      <div style={{ position:"absolute",bottom:0,right:0,width:300,height:300,opacity:0.038,pointerEvents:"none" }}>
        <svg width="300" height="300" viewBox="0 0 300 300">
          {Array.from({length:10},(_,i)=>(
            <line key={i} x1={i*32} y1="300" x2="300" y2={i*32} stroke="white" strokeWidth="0.8"/>
          ))}
        </svg>
      </div>

      {/* acid top bar */}
      <div style={{ height:2,background:"linear-gradient(90deg,#EDFF66,rgba(237,255,102,0.08))",flexShrink:0 }} />

      {/* top row */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"0 clamp(24px,5vw,48px)",height:60,flexShrink:0,
        borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <Logo />
        <button onClick={onClose} data-cursor="CLOSE"
          style={{ height:32,padding:"0 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",
            background:"rgba(255,255,255,0.04)",cursor:"none",
            fontFamily:NAV_TYPO.fontFamily,fontSize:10,fontWeight:900,letterSpacing:NAV_TYPO.letterSpacing.monument,
            textTransform:"uppercase",color:"rgba(255,255,255,0.45)",
            transition:"all 0.15s" }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.08)";e.currentTarget.style.color="#fff";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.color="rgba(255,255,255,0.45)";}}
        >ESC</button>
      </div>

      {/* giant editorial links */}
      <nav style={{ flex:1,display:"flex",flexDirection:"column",justifyContent:"center",
        padding:"0 clamp(24px,5vw,48px)",gap:0,overflowY:"auto" }}>
        {links.map(({ label, path, Icon, friendBadge }, i) => {
          const active = isActive(path);
          const bc     = friendBadge ? incomingCount : 0;
          return (
            <Link key={label} to={path} onClick={onClose}
              ref={el => itemRefs.current[i] = el}
              data-cursor={label.toUpperCase()}
              style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"clamp(10px,2vh,16px) 0",textDecoration:"none",cursor:"none",
                borderBottom:"1px solid rgba(255,255,255,0.04)",
                transition:"padding-left 0.2s ease",opacity:active?1:0.5 }}
              onMouseEnter={e=>{e.currentTarget.style.paddingLeft="10px";e.currentTarget.style.opacity="1";}}
              onMouseLeave={e=>{e.currentTarget.style.paddingLeft="0";e.currentTarget.style.opacity=active?"1":"0.5";}}
            >
              <div style={{ display:"flex",alignItems:"center",gap:16 }}>
                <div style={{ width:38,height:38,borderRadius:10,flexShrink:0,
                  background:active?"rgba(237,255,102,0.07)":"rgba(255,255,255,0.04)",
                  border:`1px solid ${active?"rgba(237,255,102,0.18)":"rgba(255,255,255,0.06)"}`,
                  display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <Icon size={16} color={active?"#EDFF66":"rgba(255,255,255,0.38)"} />
                </div>
                <span style={{ fontFamily:NAV_TYPO.fontFamily,
                  fontSize:"clamp(1.8rem,4.5vw,3rem)",fontWeight:900,
                  color:active?"#EDFF66":"#fff",letterSpacing:NAV_TYPO.letterSpacing.displayWide,lineHeight:1 }}>
                  {label}
                </span>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:10,flexShrink:0 }}>
                {bc > 0 && (
                  <span style={{ fontFamily:NAV_TYPO.fontFamily,fontSize:12,fontWeight:900,
                    color:"#f87171",background:"rgba(248,113,113,0.1)",
                    border:"1px solid rgba(248,113,113,0.22)",padding:"3px 9px",borderRadius:7 }}>
                    {bc}
                  </span>
                )}
                <ArrowUpRight size={18}
                  color={active?"rgba(237,255,102,0.6)":"rgba(255,255,255,0.15)"} />
              </div>
            </Link>
          );
        })}
      </nav>

      {/* stats footer */}
      {user && stats && (
        <div ref={footerRef}
          style={{ padding:"clamp(14px,2.5vh,24px) clamp(24px,5vw,48px)",
            borderTop:"1px solid rgba(255,255,255,0.05)",flexShrink:0 }}>
          <div style={{ fontSize:9,fontWeight:900,letterSpacing:"0.3em",textTransform:"uppercase",
            color:"rgba(255,255,255,0.22)",marginBottom:12 }}>— Your Stats</div>
          <div style={{ display:"flex",gap:0,border:"1px solid rgba(255,255,255,0.06)",
            borderRadius:12,overflow:"hidden",background:"rgba(255,255,255,0.02)" }}>
            {[
              { Icon:Coins,    val:stats.coins.toLocaleString(), label:"Coins",  color:"#fbbf24" },
              { Icon:Sparkles, val:`Lv.${stats.level}`,           label:"Level",  color:"#c4b5fd" },
              ...(streak?.currentStreak>0?[{ Icon:Flame, val:`${streak.currentStreak}d`, label:"Streak", color:"#fb923c" }]:[]),
            ].map((s, i) => (
              <div key={i} style={{ flex:1,display:"flex",alignItems:"center" }}>
                {i > 0 && <div style={{ width:1,background:"rgba(255,255,255,0.05)",alignSelf:"stretch" }} />}
                <div style={{ padding:"12px 14px",width:"100%" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:4 }}>
                    <s.Icon size={12} color={s.color} />
                    <span style={{ fontFamily:NAV_TYPO.fontFamily,fontSize:19,fontWeight:900,
                      color:s.color,letterSpacing:NAV_TYPO.letterSpacing.metric,lineHeight:1,
                      textShadow:`0 0 20px ${s.color}50` }}>{s.val}</span>
                  </div>
                  <div style={{ fontSize:8,fontWeight:700,letterSpacing:"0.18em",
                    textTransform:"uppercase",color:"rgba(255,255,255,0.22)" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
const Navbar = ({ controls, allowTransparency = false }) => {
  const { scrollProgress } = controls;
  const location           = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);

  const user      = useUserStore(s => s.user);
  const stats     = useGamificationStore(s => s.stats);
  const streak    = useGamificationStore(s => s.streak);
  const toast     = useGamificationStore(s => s.shieldToast);
  const dToast    = useGamificationStore(s => s.dismissShieldToast);
  const incoming  = useFriendsStore(s => s.incomingCount);
  const fNotif    = useFriendsStore(s => s.lastNotification);
  const muteUntil = useFriendsStore(s => s.challengeMuteUntil);
  const clearF    = useFriendsStore(s => s.clearNotification);

  const isDnd    = Boolean(muteUntil && new Date(muteUntil).getTime() > Date.now());
  const dndLabel = isDnd ? new Date(muteUntil).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : null;
  const dndTip   = useRef(null);

  useEffect(() => { if (toast) { const t=setTimeout(dToast,5000); return ()=>clearTimeout(t); } }, [toast,dToast]);
  useEffect(() => setScrolled(scrollProgress > 0.01), [scrollProgress]);
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const isActive = useCallback(p =>
    location.pathname===p || location.pathname.startsWith(p+"/"),
    [location.pathname]
  );
  const floated = !allowTransparency || scrolled;

  return (
    <>
      {/* ══════ THE BAR ══════════════════════════════════ */}
      <div style={{ position:"fixed",inset:"0 0 auto 0",zIndex:150,
        padding: floated ? `8px clamp(12px,2.5vw,22px) 0` : "0",
        transition:"padding 0.45s cubic-bezier(0.4,0,0.2,1)",
        pointerEvents:"none" }}>

        <header style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
          height:44, padding:"30px 16px",
          background: floated ? "rgba(9,9,11,0.82)" : "transparent",
          backdropFilter: floated ? "blur(28px) saturate(200%)" : "none",
          WebkitBackdropFilter: floated ? "blur(28px) saturate(200%)" : "none",
          border: floated ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
          borderRadius: floated ? 12 : 0,
          transition:"all 0.45s cubic-bezier(0.4,0,0.2,1)",
          position:"relative", overflow:"hidden", pointerEvents:"all" }}>

          {/* Shimmer top edge */}
          {floated && (
            <div style={{ position:"absolute",top:0,left:0,right:0,height:1,pointerEvents:"none",
              background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.07),rgba(237,255,102,0.1),rgba(255,255,255,0.07),transparent)" }} />
          )}

          {/* XP line */}
          {user && stats?.xp != null && <XPLine xp={stats.xp} cap={stats.nextLevelXp||1000} />}

          {/* LOGO */}
          <div style={{ flexShrink:0, position:"relative", zIndex:1 }}>
            <Logo />
          </div>

          {/* DESKTOP LINKS */}
          <nav style={{ position:"absolute",left:"50%",transform:"translateX(-50%)",
            display:"flex",alignItems:"center",gap:0,zIndex:1 }}
            className="nb-desktop">
            {LINKS.map(({ label, path, friendBadge }) => (
              <GlitchLink key={label} label={label} path={path}
                active={isActive(path)}
                badge={friendBadge ? incoming : 0} />
            ))}
          </nav>

          {/* RIGHT */}
          <div style={{ display:"flex",alignItems:"center",gap:4,flexShrink:0,position:"relative",zIndex:1 }}>

            {/* Stats terminal pill */}
            {user && stats && (
              <div style={{ display:"flex",alignItems:"center",gap:0,marginRight:5,
                border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,overflow:"hidden",
                background:"rgba(255,255,255,0.025)" }}
                className="nb-desktop">
                {[
                  { Icon:Coins,    num:stats.coins,  disp:stats.coins.toLocaleString(), color:"#fbbf24" },
                  { Icon:Sparkles, num:stats.level,   disp:`Lv.${stats.level}`,          color:"#c4b5fd" },
                  ...(streak?.currentStreak>0?[{
                    Icon:Flame, num:streak.currentStreak, disp:String(streak.currentStreak),
                    color:"#fb923c",
                    extra: streak.shieldCount>0 ? <Shield size={8} color="#67e8f9" style={{marginLeft:2}}/> : null
                  }]:[]),
                ].map((s, i) => (
                  <div key={i} style={{ display:"flex",alignItems:"center" }}>
                    {i>0 && <div style={{ width:1,height:18,background:"rgba(255,255,255,0.06)" }}/>}
                    <div style={{ display:"flex",alignItems:"center",gap:5,padding:"0 10px",height:30 }}>
                      <s.Icon size={10} color={s.color} />
                      <Roll value={s.num} color={s.color} />
                      {s.extra}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* DND */}
            {user && isDnd && (
              <div style={{ position:"relative" }} className="nb-desktop">
                <button style={{ width:30,height:30,borderRadius:8,cursor:"none",
                  background:"rgba(196,181,253,0.07)",border:"1px solid rgba(196,181,253,0.2)",
                  display:"flex",alignItems:"center",justifyContent:"center" }}
                  onMouseEnter={()=>{ if(dndTip.current) dndTip.current.style.opacity="1"; }}
                  onMouseLeave={()=>{ if(dndTip.current) dndTip.current.style.opacity="0"; }}
                ><VolumeX size={12} color="#c4b5fd"/></button>
                <div ref={dndTip} style={{ position:"absolute",top:"calc(100% + 8px)",right:0,
                  background:"#0d0d10",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,
                  padding:"9px 13px",minWidth:160,opacity:0,pointerEvents:"none",
                  transition:"opacity 0.15s",zIndex:20 }}>
                  <div style={{ fontSize:11,fontWeight:800,fontFamily:NAV_TYPO.fontFamily,color:"#fff",marginBottom:3,letterSpacing:NAV_TYPO.letterSpacing.monument }}>DND Active</div>
                  <div style={{ fontSize:10,color:"rgba(255,255,255,0.35)" }}>Muted until {dndLabel}</div>
                </div>
              </div>
            )}

            {/* Bell */}
            {user && (
              <Link to="/friends" data-cursor="ALERTS"
                style={{ position:"relative",width:30,height:30,borderRadius:8,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  textDecoration:"none",cursor:"none",
                  color:"rgba(255,255,255,0.32)",transition:"color 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,0.85)"}
                onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.32)"}
              >
                <Bell size={14}/>
                {incoming > 0 && (
                  <div style={{ position:"absolute",top:3,right:3,
                    width:6,height:6,borderRadius:"50%",background:"#f87171",
                    boxShadow:"0 0 6px 1px rgba(248,113,113,0.7)",
                    border:"1.5px solid #09090b",
                    animation:"bellPulse 2.2s ease-in-out infinite" }} />
                )}
              </Link>
            )}

            {/* Avatar / sign-in */}
            {user ? (
              <Link to="/profile" data-cursor="PROFILE" title={user.username}
                style={{ cursor:"none",textDecoration:"none" }}>
                <div style={{ width:30,height:30,borderRadius:8,flexShrink:0,
                  background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontFamily:NAV_TYPO.fontFamily,fontWeight:900,fontSize:12,
                  color:"#fff",textTransform:"uppercase",transition:"all 0.15s" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(237,255,102,0.38)";e.currentTarget.style.background="rgba(237,255,102,0.06)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";e.currentTarget.style.background="rgba(255,255,255,0.06)";}}>
                  {user.username?.charAt(0)||"U"}
                </div>
              </Link>
            ) : (
              <Link to="/login" data-cursor="START"
                style={{ height:30,padding:"0 14px",borderRadius:8,
                  background:"#EDFF66",color:"#09090b",fontSize:11,
                  fontFamily:NAV_TYPO.fontFamily,fontWeight:900,letterSpacing:NAV_TYPO.letterSpacing.monument,
                  textTransform:"uppercase",display:"flex",alignItems:"center",
                  textDecoration:"none",cursor:"none",transition:"opacity 0.15s",flexShrink:0,
                  boxShadow:"0 0 18px rgba(237,255,102,0.22)" }}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.84"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}
              >Sign in</Link>
            )}

            {/* Hamburger */}
            <button onClick={() => setMobileOpen(o=>!o)}
              data-cursor={mobileOpen?"CLOSE":"MENU"}
              style={{ width:30,height:30,borderRadius:8,border:"none",
                background:"rgba(255,255,255,0.05)",cursor:"none",
                display:"flex",alignItems:"center",justifyContent:"center",
                color:"rgba(255,255,255,0.45)",transition:"all 0.15s",flexShrink:0 }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.09)";e.currentTarget.style.color="#fff";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.color="rgba(255,255,255,0.45)";}}
              className="nb-mobile"
            >
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                <line x1="0" y1="1" x2="14" y2="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                  style={{ transformOrigin:"7px 1px",transition:"transform 0.25s ease",
                    transform: mobileOpen?"rotate(45deg) translate(0,6px)":"none" }}/>
                <line x1="0" y1="5" x2="14" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                  style={{ transition:"opacity 0.2s",opacity: mobileOpen?0:1 }}/>
                <line x1="0" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                  style={{ transformOrigin:"7px 9px",transition:"transform 0.25s ease",
                    transform: mobileOpen?"rotate(-45deg) translate(0,-6px)":"none" }}/>
              </svg>
            </button>
          </div>
        </header>
      </div>

      {/* FULLSCREEN MOBILE */}
      <MobileOverlay open={mobileOpen} onClose={()=>setMobileOpen(false)}
        links={LINKS} isActive={isActive} incomingCount={incoming}
        stats={stats} streak={streak} user={user} />

      {/* TOASTS */}
      <AppToast message={toast} onDismiss={dToast}
        className="fixed top-[88px] left-1/2 -translate-x-1/2 z-[210] w-[calc(100vw-2rem)] md:w-auto md:min-w-[260px] md:max-w-[560px] px-4 py-3 rounded-xl bg-[#0c0c0f]/95 backdrop-blur-md border border-[#EDFF66]/35 shadow-[0_18px_50px_rgba(0,0,0,0.5),0_0_18px_rgba(237,255,102,0.12)]"
        contentClassName="w-full"
        messageClassName="text-[12px] font-semibold tracking-[0.04em] text-white/88"
        dismissButtonClassName="w-6 h-6 rounded-md border border-[#EDFF66]/35 bg-[#EDFF66]/[0.07] text-[#EDFF66]/80 hover:text-[#EDFF66] hover:border-[#EDFF66]/60 inline-flex items-center justify-center transition-colors" />
      <AppToast message={fNotif} onDismiss={clearF} dismissLabel="Dismiss"
        className="fixed top-[88px] left-1/2 -translate-x-1/2 z-[211] w-[calc(100vw-2rem)] md:w-auto md:min-w-[280px] md:max-w-[600px] px-4 py-3 rounded-xl bg-[#0c0c0f]/95 backdrop-blur-md border border-[#EDFF66]/35 shadow-[0_18px_50px_rgba(0,0,0,0.5),0_0_18px_rgba(237,255,102,0.12)]"
        contentClassName="w-full"
        messageClassName="text-[12px] font-semibold tracking-[0.04em] text-white"
        dismissButtonClassName="w-6 h-6 rounded-md border border-[#EDFF66]/35 bg-[#EDFF66]/[0.07] text-[#EDFF66]/80 hover:text-[#EDFF66] hover:border-[#EDFF66]/60 inline-flex items-center justify-center transition-colors" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .nb-desktop { display:none !important; }
        .nb-mobile  { display:flex  !important; }
        @media(min-width:1024px){
          .nb-desktop{ display:flex !important; }
          .nb-mobile { display:none !important; }
        }
        @keyframes bellPulse{
          0%,100%{ box-shadow:0 0 6px 1px rgba(248,113,113,0.7); }
          50%    { box-shadow:0 0 12px 3px rgba(248,113,113,0.35); }
        }
      `}</style>
    </>
  );
};

export default Navbar;