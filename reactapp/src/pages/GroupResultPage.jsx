import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { getStoredUser } from "../services/userApi";
import useGroupBattleStore from "../stores/useGroupBattleStore";
import { fetchGroupBattleResult } from "../services/groupBattleApi";
import {
  Trophy, Medal, Star, Coins, Zap, ArrowRight,
  Users, Hash, CheckCircle2,
} from "lucide-react";
import CustomCursor from "../components/CustomCursor";
import { MONUMENT_TYPO } from "../components/MonumentTypography";

const BATTLE_FONT_FAMILY = MONUMENT_TYPO.fontFamily;
const BATTLE_FONT_LETTER_SPACING = MONUMENT_TYPO.letterSpacing.monument;

function PlacementIcon({ placement }) {
  if (placement === 1) return (
    <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
      <Trophy className="w-5 h-5 text-amber-400" />
    </div>
  );
  if (placement === 2) return (
    <div className="w-10 h-10 rounded-lg bg-slate-400/20 border border-slate-400/40 flex items-center justify-center">
      <Medal className="w-5 h-5 text-slate-400" />
    </div>
  );
  if (placement === 3) return (
    <div className="w-10 h-10 rounded-lg bg-amber-700/20 border border-amber-700/40 flex items-center justify-center">
      <Medal className="w-5 h-5 text-amber-700" />
    </div>
  );
  return (
    <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center">
      <span className="text-sm font-black text-zinc-400 tabular-nums">{placement}</span>
    </div>
  );
}

function OutcomeBanner({ myPlacement }) {
  const labels = {
    1: { text: "1st Place", sub: "You dominated the arena!", color: "border-amber-500/30 text-amber-300", glow: "rgba(237,255,102,0.14)", icon: Trophy },
    2: { text: "2nd Place", sub: "Great performance!", color: "border-slate-400/30 text-slate-300", glow: "rgba(148,163,184,0.12)", icon: Medal },
    3: { text: "3rd Place", sub: "Solid finish!", color: "border-amber-700/30 text-amber-600", glow: "rgba(180,83,9,0.14)", icon: Medal },
  };
  const info = labels[myPlacement] || { text: `#${myPlacement} Place`, sub: "Better luck next time!", color: "border-zinc-700 text-zinc-400", glow: "rgba(255,255,255,0.08)", icon: Hash };
  const Icon = info.icon;

  return (
    <div className={cn(
      "rounded-2xl border bg-zinc-900 p-5 text-center mb-6 relative overflow-hidden",
      info.color
    )}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 70% 80% at 50% 0%, ${info.glow} 0%, transparent 75%)`,
          pointerEvents: "none",
        }}
      />
      <div className="flex items-center justify-center gap-2 mb-1">
        <Icon className="w-5 h-5" />
        <h2 className="battle-monument text-3xl font-black tracking-tight">{info.text}</h2>
      </div>
      <p className="text-sm mt-1 text-zinc-500">{info.sub}</p>
    </div>
  );
}

export default function GroupResultPage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();
  const userId = user?.uid;

  const { result, reset } = useGroupBattleStore();

  /* ── If store has no result (direct URL), fetch it ── */
  useEffect(() => {
    if (!result && battleId && userId) {
      fetchGroupBattleResult(Number(battleId), userId)
        .then((r) => useGroupBattleStore.setState({ result: r }))
        .catch(() => {});
    }
  }, [battleId, userId, result]);

  const handlePlayAgain = () => {
    reset();
    navigate("/group");
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="group-battle-theme min-h-screen bg-zinc-950 pt-24 pb-16 px-4 sm:px-6" style={{ cursor: "none" }}>
      <CustomCursor />
      <div className="w-full max-w-3xl mx-auto space-y-4 battle-fade-up">

        {/* Header */}
        <div className="mb-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500 mb-2 text-center">- Group Battle</p>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm text-zinc-500 font-medium">FFA Final Results</span>
          </div>
        </div>

        {/* Outcome banner */}
        <OutcomeBanner myPlacement={result.myPlacement} />

        {/* My rewards */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-around battle-fade-up-delay-1">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-violet-400" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">XP Earned</p>
              <p className="battle-monument text-xl font-black tabular-nums text-white">+{result.myXp}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Coins</p>
              <p className="battle-monument text-xl font-black tabular-nums text-white">+{result.myCoins}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Rank</p>
              <p className="battle-monument text-xl font-black tabular-nums text-white">#{result.myPlacement}</p>
            </div>
          </div>
        </div>

        {/* Full scoreboard */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 battle-fade-up-delay-2">
          <h3 className="text-[10px] font-black text-zinc-600 mb-3 uppercase tracking-[0.2em]">
            Final Scoreboard
          </h3>
          <div className="space-y-2">
            {result.placements.map((entry) => (
              <div
                key={entry.userId}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3 transition-colors border",
                  entry.userId === userId
                    ? "bg-primary/10 border-primary/20"
                    : "bg-zinc-950 border-zinc-800"
                )}
              >
                <PlacementIcon placement={entry.placement} />

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white truncate">
                    {entry.username}
                    {entry.userId === userId && (
                      <span className="ml-1 text-xs text-primary font-normal">(you)</span>
                    )}
                    {entry.forfeited && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 align-middle">forfeit</span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {entry.problemsSolved} solved · {entry.totalSubmissions} submissions
                  </p>
                </div>

                <div className="text-right">
                  <p className="battle-monument font-black tabular-nums text-primary">{entry.groupScore} pts</p>
                  <p className="text-xs text-zinc-500">
                    +{entry.coinsEarned}🪙 +{entry.xpEarned}xp
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 battle-fade-up-delay-3">
          <button
            onClick={handlePlayAgain}
            className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" />
            Play Again
          </button>
          <button
            onClick={() => { reset(); navigate("/battle"); }}
            className="flex-1 h-11 rounded-xl border border-zinc-800 text-sm font-bold text-zinc-500 hover:text-white hover:border-zinc-700 hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            1v1 Battle
          </button>
        </div>
      </div>
      <style>{`
        .group-battle-theme{position:relative;overflow-x:hidden}
        .group-battle-theme::before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.025;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:200px;z-index:0}
        .group-battle-theme::after{content:"";position:fixed;inset:0;pointer-events:none;opacity:.014;
          background-image:linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px);
          background-size:64px 64px;z-index:0}
        .group-battle-theme > div{position:relative;z-index:1}
        .group-battle-theme .bg-zinc-900{background:#0d0d10!important}
        .group-battle-theme .bg-zinc-950{background:#09090b!important}
        .group-battle-theme .border-zinc-800{border-color:rgba(255,255,255,.06)!important}
        .group-battle-theme .bg-primary{background:#EDFF66!important;color:#09090b!important}
        .group-battle-theme .text-primary{color:#EDFF66!important}
        .group-battle-theme .border-primary\/20{border-color:rgba(237,255,102,.22)!important}
        .group-battle-theme .bg-primary\/10{background:rgba(237,255,102,.1)!important}
        .group-battle-theme .text-primary-foreground{color:#09090b!important}
        .group-battle-theme .text-zinc-500{color:rgba(255,255,255,.35)!important}
        .group-battle-theme .text-zinc-600{color:rgba(255,255,255,.22)!important}
        .group-battle-theme .rounded-2xl{border-radius:18px!important}
        .group-battle-theme .rounded-xl{border-radius:12px!important}
        .group-battle-theme .battle-monument{font-family:${BATTLE_FONT_FAMILY};letter-spacing:${BATTLE_FONT_LETTER_SPACING}}
        .group-battle-theme .hover\:opacity-90:hover{opacity:.86!important}
        .group-battle-theme button{cursor:none!important}
      `}</style>
    </div>
  );
}
