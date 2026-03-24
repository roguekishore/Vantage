import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { useGSAP } from "@gsap/react";
import useBattleStore from "../stores/useBattleStore";
import useGamificationStore from "../stores/useGamificationStore";
import useUserStore from "../stores/useUserStore";
import {
  Trophy, Skull, Minus, Swords, Coins, Sparkles,
  ArrowUp, ArrowDown, Loader2, RotateCcw, Home,
  Crown, Target, Clock, CheckCircle2,
} from "lucide-react";
import CustomCursor from "../components/CustomCursor";
import { MONUMENT_TYPO, getMonumentCanvasFont } from "../components/MonumentTypography";

const BATTLE_FONT_FAMILY = MONUMENT_TYPO.fontFamily;
const BATTLE_FONT_LETTER_SPACING = MONUMENT_TYPO.letterSpacing.monument;
const getBattleCanvasFont = getMonumentCanvasFont;

gsap.registerPlugin(ScrollTrigger);

const OUTCOMES = {
  WIN:  { word:"VICTORY", color:"#EDFF66",              glow:"rgba(237,255,102,0.15)",   fogColor:"rgba(237,255,102,0.04)",   barGrad:"linear-gradient(90deg,#7c3aed,#EDFF66)",                    Icon:Trophy },
  DRAW: { word:"DRAW",    color:"rgba(255,255,255,0.5)", glow:"transparent",              fogColor:"rgba(255,255,255,0.02)",   barGrad:"linear-gradient(90deg,rgba(255,255,255,0.1),rgba(255,255,255,0.3))", Icon:Minus  },
  LOSS: { word:"DEFEAT",  color:"#f87171",              glow:"rgba(248,113,113,0.14)",   fogColor:"rgba(248,113,113,0.05)",  barGrad:"linear-gradient(90deg,#450a0a,#f87171)",                    Icon:Skull  },
};

function formatTime(ms) {
  if (!ms || ms === 0) return "DNF";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2,"0")}`;
}

/* Rating graph canvas */
function RatingGraph({ before, after, color }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = canvas.offsetWidth  * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    const W = canvas.offsetWidth, H = canvas.offsetHeight, pad = 16;
    const diff = after - before;
    const points = [
      { x:0,    y:before },
      { x:0.2,  y:before + diff*0.05 },
      { x:0.5,  y:before + diff*0.08 },
      { x:0.75, y:before + diff*0.6  },
      { x:1,    y:after  },
    ];
    const minY = Math.min(before,after) - Math.abs(diff)*0.6;
    const maxY = Math.max(before,after) + Math.abs(diff)*0.6;
    const range = maxY - minY || 1;
    const toX = t => pad + t*(W-pad*2);
    const toY = v => H - pad - ((v-minY)/range)*(H-pad*2);
    const pts  = points.map(p => ({ x:toX(p.x), y:toY(p.y) }));
    let progress=0, animId;
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      const lastIdx = Math.min(Math.floor(progress*(pts.length-1)), pts.length-2);
      const frac = (progress*(pts.length-1)) - lastIdx;
      const interp = { x:pts[lastIdx].x+(pts[lastIdx+1].x-pts[lastIdx].x)*frac, y:pts[lastIdx].y+(pts[lastIdx+1].y-pts[lastIdx].y)*frac };
      const linePts = [...pts.slice(0,lastIdx+1), interp];
      if (linePts.length > 1) {
        ctx.beginPath(); ctx.moveTo(linePts[0].x, H-pad);
        linePts.forEach(p=>ctx.lineTo(p.x,p.y));
        ctx.lineTo(linePts[linePts.length-1].x,H-pad); ctx.closePath();
        const g = ctx.createLinearGradient(0,0,0,H);
        g.addColorStop(0,`${color}22`); g.addColorStop(1,`${color}00`);
        ctx.fillStyle=g; ctx.fill();
        ctx.beginPath(); ctx.moveTo(linePts[0].x,linePts[0].y);
        linePts.forEach(p=>ctx.lineTo(p.x,p.y));
        ctx.strokeStyle=color; ctx.lineWidth=1.5; ctx.lineJoin="round"; ctx.lineCap="round";
        ctx.shadowColor=color; ctx.shadowBlur=6; ctx.stroke(); ctx.shadowBlur=0;
        const ep = linePts[linePts.length-1];
        ctx.beginPath(); ctx.arc(ep.x,ep.y,3.5,0,Math.PI*2);
        ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=10; ctx.fill(); ctx.shadowBlur=0;
      }
      ctx.font=getBattleCanvasFont(700, "9px"); ctx.fillStyle="rgba(255,255,255,0.22)";
      ctx.textAlign="left"; ctx.fillText(String(before),pad,H-4);
      if (progress > 0.9) { ctx.fillStyle=color; ctx.textAlign="right"; ctx.fillText(String(after),W-pad,H-4); }
      if (progress<1) { progress=Math.min(1,progress+0.018); animId=requestAnimationFrame(draw); }
      else {
        ctx.clearRect(0,0,W,H);
        ctx.font=getBattleCanvasFont(900, `${H * 0.92}px`);
        // final static
        const fp=pts;
        ctx.beginPath(); ctx.moveTo(fp[0].x,H-pad);
        fp.forEach(p=>ctx.lineTo(p.x,p.y));
        ctx.lineTo(fp[fp.length-1].x,H-pad); ctx.closePath();
        const g2=ctx.createLinearGradient(0,0,0,H);
        g2.addColorStop(0,`${color}22`); g2.addColorStop(1,`${color}00`);
        ctx.fillStyle=g2; ctx.fill();
        ctx.beginPath(); ctx.moveTo(fp[0].x,fp[0].y); fp.forEach(p=>ctx.lineTo(p.x,p.y));
        ctx.strokeStyle=color; ctx.lineWidth=1.5; ctx.shadowColor=color; ctx.shadowBlur=6; ctx.stroke(); ctx.shadowBlur=0;
        const lp=fp[fp.length-1];
        ctx.beginPath(); ctx.arc(lp.x,lp.y,3.5,0,Math.PI*2);
        ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=10; ctx.fill(); ctx.shadowBlur=0;
        ctx.font=getBattleCanvasFont(700, "9px"); ctx.fillStyle="rgba(255,255,255,0.22)"; ctx.textAlign="left"; ctx.fillText(String(before),pad,H-4);
        ctx.fillStyle=color; ctx.textAlign="right"; ctx.fillText(String(after),W-pad,H-4);
      }
    };
    const t=setTimeout(()=>{ animId=requestAnimationFrame(draw); },600);
    return ()=>{ cancelAnimationFrame(animId); clearTimeout(t); };
  },[before,after,color]);
  return <canvas ref={canvasRef} style={{ width:"100%",height:"100%",display:"block" }} />;
}

/* Animated stat bar */
function StatBar({ label, value, max, color, Icon, mono, delay=0 }) {
  const barRef = useRef(null);
  const pct = max > 0 ? Math.min(100,(value/max)*100) : 0;
  useEffect(()=>{
    if (!barRef.current) return;
    const t = setTimeout(()=>{
      gsap.fromTo(barRef.current,{width:"0%"},{width:`${pct}%`,duration:0.9,ease:"power3.out"});
    },delay);
    return ()=>clearTimeout(t);
  },[pct,delay]);
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"rgba(255,255,255,0.28)" }}>
          <Icon size={10}/>{label}
        </div>
        <span style={{ fontFamily:mono?"monospace":BATTLE_FONT_FAMILY,fontSize:14,fontWeight:900,color:"#fff",letterSpacing:mono?"0":BATTLE_FONT_LETTER_SPACING }}>{value}</span>
      </div>
      <div style={{ height:2,borderRadius:2,background:"rgba(255,255,255,0.06)",overflow:"hidden" }}>
        <div ref={barRef} style={{ height:"100%",borderRadius:2,width:"0%",background:`linear-gradient(90deg,${color}60,${color})`,boxShadow:`0 0 6px ${color}60` }} />
      </div>
    </div>
  );
}

/* Outcome word - canvas scan reveal */
function OutcomeCanvas({ word, color, shadowColor }) {
  const canvasRef = useRef(null);
  useEffect(()=>{
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio||1;
    canvas.width=canvas.offsetWidth*dpr; canvas.height=canvas.offsetHeight*dpr;
    ctx.scale(dpr,dpr);
    const W=canvas.offsetWidth, H=canvas.offsetHeight;
    let fontSize=H*0.88;
    ctx.font=getBattleCanvasFont(900, `${fontSize}px`);
    const m=ctx.measureText(word);
    if (m.width > W*0.96) fontSize=fontSize*(W*0.96/m.width);
    let scanY=0, animId;
    const SPEED=H/36;
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      ctx.font=getBattleCanvasFont(900, `${fontSize}px`);
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillStyle=`${color}14`; ctx.fillText(word,W/2,H/2);
      ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,scanY); ctx.clip();
      ctx.fillStyle=color; ctx.shadowColor=shadowColor; ctx.shadowBlur=36;
      ctx.fillText(word,W/2,H/2); ctx.shadowBlur=0; ctx.restore();
      if (scanY<H) {
        const lg=ctx.createLinearGradient(0,scanY-14,0,scanY+4);
        lg.addColorStop(0,`${color}00`); lg.addColorStop(1,color);
        ctx.fillStyle=lg; ctx.fillRect(0,scanY-14,W,16);
        scanY=Math.min(H,scanY+SPEED); animId=requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0,0,W,H);
        ctx.font=getBattleCanvasFont(900, `${fontSize}px`);
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillStyle=color; ctx.shadowColor=shadowColor; ctx.shadowBlur=32;
        ctx.fillText(word,W/2,H/2); ctx.shadowBlur=0;
      }
    };
    const t=setTimeout(()=>{ animId=requestAnimationFrame(draw); },80);
    return ()=>{ cancelAnimationFrame(animId); clearTimeout(t); };
  },[word,color,shadowColor]);
  return <canvas ref={canvasRef} style={{ width:"100%",height:"100%",display:"block" }} />;
}

/* Reward chip - counting number */
function RewardChip({ icon:Icon, label, value, color, delay=0 }) {
  const [display, setDisplay] = useState(0);
  useEffect(()=>{
    const t=setTimeout(()=>{
      let cur=0; const step=Math.max(1,Math.ceil(value/28));
      const id=setInterval(()=>{ cur=Math.min(cur+step,value); setDisplay(cur); if(cur>=value)clearInterval(id); },30);
      return ()=>clearInterval(id);
    },delay);
    return ()=>clearTimeout(t);
  },[value,delay]);
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
      <div style={{ display:"flex",alignItems:"center",gap:6 }}>
        <div style={{ width:24,height:24,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",background:`${color}0d`,border:`1px solid ${color}20` }}>
          <Icon size={11} color={color}/>
        </div>
        <span style={{ fontSize:9,fontWeight:900,letterSpacing:"0.22em",textTransform:"uppercase",color:"rgba(255,255,255,0.22)" }}>{label}</span>
      </div>
      <div style={{ fontFamily:BATTLE_FONT_FAMILY,fontSize:"clamp(2.2rem,3.5vw,3.4rem)",fontWeight:900,color,letterSpacing:BATTLE_FONT_LETTER_SPACING,lineHeight:1,textShadow:`0 0 32px ${color}40` }}>
        +{display}
      </div>
    </div>
  );
}

/* Player side */
function PlayerSide({ stats, isYou, isWinner, isRanked, animDelay, solvedMax }) {
  const avatarColor = isYou ? "#c4b5fd" : "#f87171";
  const maxSolved   = Math.max(1, solvedMax || 1, stats.problemsSolved || 0);
  const maxAttempts = Math.max(stats.totalSubmissions||1,5);
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:22,padding:"clamp(24px,3.5vh,44px) clamp(20px,3.5vw,44px)" }}>
      {/* Identity */}
      <div style={{ display:"flex",flexDirection:"column",alignItems:isYou?"flex-start":"flex-end",gap:10 }}>
        <span style={{ fontSize:9,fontWeight:900,letterSpacing:"0.28em",textTransform:"uppercase",color:"rgba(255,255,255,0.2)" }}>{isYou?"You":"Opponent"}</span>
        <div style={{ display:"flex",alignItems:"center",gap:12,flexDirection:isYou?"row":"row-reverse" }}>
          <div style={{ position:"relative" }}>
            <div style={{ width:56,height:56,borderRadius:15,fontFamily:BATTLE_FONT_FAMILY,letterSpacing:BATTLE_FONT_LETTER_SPACING,fontWeight:900,fontSize:24,color:avatarColor,background:`${avatarColor}0d`,border:`1px solid ${avatarColor}25`,display:"flex",alignItems:"center",justifyContent:"center" }}>
              {stats.username?.charAt(0)?.toUpperCase()||"?"}
            </div>
            {isWinner && (
              <div style={{ position:"absolute",top:-7,right:-7,width:20,height:20,borderRadius:"50%",background:"#EDFF66",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 14px rgba(237,255,102,0.6)" }}>
                <Crown size={10} color="#09090b"/>
              </div>
            )}
          </div>
          <div style={{ textAlign:isYou?"left":"right" }}>
            <div style={{ fontFamily:BATTLE_FONT_FAMILY,fontSize:"clamp(14px,1.8vw,20px)",fontWeight:900,color:"#fff",letterSpacing:BATTLE_FONT_LETTER_SPACING,lineHeight:1,marginBottom:isWinner?5:0 }}>{stats.username}</div>
            {isWinner && (
              <span style={{ display:"inline-flex",alignItems:"center",gap:5,fontSize:8,fontWeight:900,letterSpacing:"0.2em",textTransform:"uppercase",color:"#EDFF66",background:"rgba(237,255,102,0.08)",border:"1px solid rgba(237,255,102,0.2)",padding:"3px 9px",borderRadius:20 }}>
                <Crown size={8}/> Winner
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stat bars */}
      <div style={{ display:"flex",flexDirection:"column",gap:13 }}>
        <StatBar label="Solved"   value={stats.problemsSolved}             max={maxSolved}   color={avatarColor} Icon={Target}    delay={animDelay}       />
        <StatBar label="Attempts" value={stats.totalSubmissions}            max={maxAttempts} color={avatarColor} Icon={RotateCcw} delay={animDelay+120}   />
        <StatBar label="Time"     value={formatTime(stats.totalSolveTimeMs)} max={0}          color={avatarColor} Icon={Clock}     delay={animDelay+240} mono />
      </div>

      {/* ELO */}
      <div style={{ display:"flex",flexDirection:"column",alignItems:isYou?"flex-start":"flex-end",gap:5 }}>
        <span style={{ fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(255,255,255,0.2)" }}>ELO Rating</span>
        <div style={{ display:"flex",alignItems:"baseline",gap:8,flexDirection:isYou?"row":"row-reverse" }}>
          <span style={{ fontFamily:BATTLE_FONT_FAMILY,fontSize:"clamp(24px,3vw,38px)",fontWeight:900,letterSpacing:BATTLE_FONT_LETTER_SPACING,lineHeight:1,color:"#fff" }}>
            {stats.ratingAfter??stats.ratingBefore}
          </span>
          {stats.ratingAfter!=null && stats.ratingAfter!==stats.ratingBefore && (
            <span style={{ display:"flex",alignItems:"center",gap:4,fontFamily:BATTLE_FONT_FAMILY,letterSpacing:BATTLE_FONT_LETTER_SPACING,fontSize:14,fontWeight:900,color:stats.ratingAfter>stats.ratingBefore?"#34d399":"#f87171" }}>
              {stats.ratingAfter>stats.ratingBefore?<ArrowUp size={12}/>:<ArrowDown size={12}/>}
              {stats.ratingAfter>stats.ratingBefore?"+":""}{stats.ratingAfter-stats.ratingBefore}
            </span>
          )}
        </div>
        {isRanked && stats.ratingAfter!=null && stats.ratingAfter!==stats.ratingBefore && (
          <div style={{ height:48,width:"100%",maxWidth:160 }}>
            <RatingGraph before={stats.ratingBefore} after={stats.ratingAfter} color={stats.ratingAfter>stats.ratingBefore?"#34d399":"#f87171"} />
          </div>
        )}
      </div>
    </div>
  );
}

/* Page */
export default function BattleResultPage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const userId   = useUserStore((s) => s.user?.uid ?? null);
  const pageRef  = useRef(null);

  const { result, loading, error, fetchResult, abandon, reset } = useBattleStore();

  const handleForceExit = async () => {
    if (!battleId || !userId) return;
    await abandon(Number(battleId), userId);
    navigate("/battle", { replace: true });
  };

  useEffect(()=>{
    let mounted = true;
    const run = async () => {
      if (!battleId || !userId) return;
      const response = await fetchResult(Number(battleId), userId);
      if (!mounted || !response) return;

      // Backend returns 409 while battle is still WAITING/ACTIVE.
      // Route user back to the correct live screen instead of hanging on result page.
      if (response.status === 409) {
        if (response.pendingState === "ACTIVE") {
          navigate(`/battle/match/${battleId}`, { replace: true });
          return;
        }
        if (response.pendingState === "WAITING") {
          navigate("/battle", { replace: true });
          return;
        }
      }

      useGamificationStore.getState().loadStats(userId);
    };

    run();
    return ()=>reset();
  },[battleId,userId,navigate,fetchResult,reset]);

  useGSAP(()=>{
    if (!result) return;
    const items = gsap.utils.toArray(".ri-fade");
    if (!items.length) return;
    gsap.killTweensOf(items);
    gsap.fromTo(items,{opacity:0,y:18},{opacity:1,y:0,duration:0.65,stagger:0.1,ease:"power3.out",delay:0.1,overwrite:"auto"});
  },{ scope:pageRef, dependencies:[result] });

  if (loading || !result) {
    return (
      <div style={{ minHeight:"100vh",background:"#09090b",display:"flex",alignItems:"center",justifyContent:"center",gap:14,flexDirection:"column" }}>
        <Loader2 size={22} color="rgba(255,255,255,0.2)" style={{ animation:"spin 1s linear infinite" }}/>
        <span style={{ fontSize:13,color:"rgba(255,255,255,0.3)" }}>{error || "Loading results…"}</span>
        {error && (
          <button
            onClick={handleForceExit}
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 10,
              border: "1px solid rgba(248,113,113,0.32)",
              background: "rgba(248,113,113,0.08)",
              color: "#f87171",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Force Exit Battle
          </button>
        )}
        <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const O          = OUTCOMES[result.outcome]||OUTCOMES.LOSS;
  const isRanked   = result.mode==="RANKED_1V1";
  const ratingDiff = (result.ratingAfter??result.ratingBefore) - result.ratingBefore;
  const solvedMax  = Math.max(
    1,
    Number(result.problemCount || 0),
    Number(result.you?.problemsSolved || 0),
    Number(result.opponent?.problemsSolved || 0)
  );

  return (
    <div ref={pageRef} style={{ minHeight:"100vh",background:"#09090b",display:"flex",flexDirection:"column",overflowX:"hidden",paddingTop:56,cursor:"none" }}>
      <CustomCursor />

      {/* Background */}
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:0 }}>
        <div style={{ position:"absolute",top:"-10%",left:"50%",transform:"translateX(-50%)",width:"100%",height:"55%",background:`radial-gradient(ellipse 80% 100% at 50% 0%, ${O.glow} 0%, transparent 70%)` }}/>
        <div style={{ position:"absolute",bottom:0,left:0,right:0,height:"30%",background:`radial-gradient(ellipse 60% 100% at 50% 100%, ${O.fogColor} 0%, transparent 70%)` }}/>
        <div style={{ position:"absolute",inset:0,opacity:0.028,backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",backgroundSize:"200px" }}/>
        <div style={{ position:"absolute",inset:0,opacity:0.016,backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",backgroundSize:"60px 60px" }}/>
      </div>

      <div style={{ position:"relative",zIndex:1,display:"flex",flexDirection:"column",flex:1,maxWidth:1100,margin:"0 auto",width:"100%",padding:"0 clamp(16px,4vw,48px)" }}>

        {/* OUTCOME WORD */}
        <div style={{ height:"clamp(90px,15vh,140px)",width:"100%",marginTop:"clamp(12px,2vh,20px)" }}>
          <OutcomeCanvas word={O.word} color={O.color} shadowColor={O.glow}/>
        </div>

        {/* Subtitle */}
        <div className="ri-fade" style={{ display:"flex",alignItems:"center",gap:12,margin:"clamp(12px,1.5vh,20px) 0 clamp(20px,2.5vh,36px)" }}>
          <span style={{ fontSize:9,fontWeight:900,letterSpacing:"0.28em",textTransform:"uppercase",color:"rgba(255,255,255,0.22)" }}>- Battle · {result.mode.replace(/_/g," ")}</span>
          <div style={{ height:1,width:80,background:"rgba(255,255,255,0.05)" }}/>
          <span style={{ fontSize:11,color:"rgba(255,255,255,0.28)" }}>{result.you.problemsSolved} solved</span>
          {isRanked && (
            <>
              <div style={{ width:3,height:3,borderRadius:"50%",background:"rgba(255,255,255,0.18)" }}/>
              <span style={{ display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:800,color:ratingDiff>=0?"#34d399":"#f87171" }}>
                {ratingDiff>=0?<ArrowUp size={11}/>:<ArrowDown size={11}/>} Rating {ratingDiff>=0?"+":""}{ratingDiff}
              </span>
            </>
          )}
        </div>

        {/* BATTLE STAGE */}
        <div className="ri-fade" style={{ background:"#0d0d10",borderRadius:20,overflow:"hidden",border:"1px solid rgba(255,255,255,0.06)",boxShadow:`0 0 60px ${O.glow}`,marginBottom:"clamp(14px,2vh,20px)" }}>
          <div style={{ height:3,background:O.barGrad }}/>
          <div style={{ display:"grid",gridTemplateColumns:"1fr auto 1fr" }}>
            <PlayerSide stats={result.you}      isYou isWinner={result.winnerId===result.you.userId}      isRanked={isRanked} animDelay={350} solvedMax={solvedMax}/>
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 0",gap:10,borderLeft:"1px solid rgba(255,255,255,0.05)",borderRight:"1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ width:1,height:"clamp(16px,3vh,36px)",background:"rgba(255,255,255,0.06)" }}/>
              <div style={{ width:44,height:44,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)" }}>
                <Swords size={18} color="rgba(255,255,255,0.38)"/>
              </div>
              <span style={{ fontFamily:BATTLE_FONT_FAMILY,fontSize:9,fontWeight:900,letterSpacing:BATTLE_FONT_LETTER_SPACING,color:"rgba(255,255,255,0.22)",textTransform:"uppercase" }}>vs</span>
              <div style={{ width:1,height:"clamp(16px,3vh,36px)",background:"rgba(255,255,255,0.06)" }}/>
            </div>
            <PlayerSide stats={result.opponent} isYou={false} isWinner={result.winnerId===result.opponent.userId} isRanked={isRanked} animDelay={450} solvedMax={solvedMax}/>
          </div>
        </div>

        {/* BOTTOM STRIP */}
        <div className="ri-fade" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:"clamp(14px,2vh,20px)" }}>
          {/* Rewards */}
          <div style={{ background:"#0d0d10",border:"1px solid rgba(255,255,255,0.06)",borderRadius:18,overflow:"hidden" }}>
            <div style={{ height:2,background:"linear-gradient(90deg,rgba(255,255,255,0.07),transparent)" }}/>
            <div style={{ padding:"clamp(18px,2.5vh,26px) clamp(18px,2.5vw,28px)" }}>
              <div style={{ fontSize:9,fontWeight:900,letterSpacing:"0.28em",textTransform:"uppercase",color:"rgba(255,255,255,0.22)",marginBottom:20 }}>- Rewards</div>
              <div style={{ display:"flex",gap:"clamp(24px,3.5vw,44px)",flexWrap:"wrap" }}>
                <RewardChip icon={Sparkles} label="XP"    value={result.xpEarned}    color="#c4b5fd" delay={700}/>
                <RewardChip icon={Coins}    label="Coins"  value={result.coinsEarned} color="#fbbf24" delay={820}/>
              </div>
            </div>
          </div>
          {/* Actions */}
          <div style={{ background:"#0d0d10",border:"1px solid rgba(255,255,255,0.06)",borderRadius:18,overflow:"hidden",display:"flex",flexDirection:"column" }}>
            <div style={{ height:2,background:O.barGrad }}/>
            <div style={{ padding:"clamp(18px,2.5vh,26px) clamp(18px,2.5vw,28px)",display:"flex",flexDirection:"column",gap:10,flex:1,justifyContent:"center" }}>
              <button onClick={()=>{reset();navigate("/battle");}} data-cursor="REMATCH"
                style={{ height:50,borderRadius:12,border:"none",cursor:"none",background:"#EDFF66",color:"#09090b",fontSize:12,fontWeight:900,letterSpacing:"0.12em",textTransform:"uppercase",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"opacity 0.15s",width:"100%" }}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.84"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}
              ><RotateCcw size={13}/> Play Again</button>
              <div style={{ display:"flex",gap:8 }}>
                {[
                  { label:"Ranks", Icon:Trophy, path:"/leaderboard" },
                  { label:"Home",  Icon:CheckCircle2, path:"/" },
                ].map(({ label, Icon, path }) => (
                  <button key={label} onClick={()=>navigate(path)} data-cursor={label.toUpperCase()}
                    style={{ flex:1,height:40,borderRadius:10,cursor:"none",background:"transparent",border:"1px solid rgba(255,255,255,0.08)",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(255,255,255,0.35)",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all 0.15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.2)";e.currentTarget.style.color="#fff";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.color="rgba(255,255,255,0.35)";}}
                  ><Icon size={12}/>{label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RATING GRAPH - ranked only */}
        {isRanked && (
          <div className="ri-fade" style={{ marginBottom:"clamp(24px,4vh,48px)" }}>
            <div style={{ background:"#0d0d10",border:"1px solid rgba(255,255,255,0.06)",borderRadius:18,overflow:"hidden" }}>
              <div style={{ height:2,background:"linear-gradient(90deg,rgba(255,255,255,0.06),transparent)" }}/>
              <div style={{ padding:"clamp(18px,2.5vh,26px) clamp(18px,2.5vw,28px)" }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
                  <span style={{ fontSize:9,fontWeight:900,letterSpacing:"0.28em",textTransform:"uppercase",color:"rgba(255,255,255,0.22)" }}>- Rating Change</span>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <span style={{ fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.2)",fontFamily:"monospace" }}>{result.ratingBefore}</span>
                    <span style={{ fontSize:9,color:"rgba(255,255,255,0.14)" }}>→</span>
                    <span style={{ fontSize:12,fontWeight:900,fontFamily:BATTLE_FONT_FAMILY,letterSpacing:BATTLE_FONT_LETTER_SPACING,color:ratingDiff>=0?"#34d399":"#f87171" }}>{result.ratingAfter}</span>
                  </div>
                </div>
                <div style={{ height:80 }}>
                  <RatingGraph before={result.ratingBefore} after={result.ratingAfter} color={ratingDiff>=0?"#34d399":"#f87171"}/>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        ::-webkit-scrollbar{width:0;}
        @keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
      `}</style>
    </div>
  );
}