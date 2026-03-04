import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useBattleStore from "../stores/useBattleStore";
import useGamificationStore from "../stores/useGamificationStore";
import { getStoredUser } from "../services/userApi";
import { NumberTicker } from "../components/ui/number-ticker";
import { cn } from "../lib/utils";
import {
  Trophy, Skull, Minus, Swords, Coins, Sparkles,
  ArrowUp, ArrowDown, Timer, Loader2, RotateCcw, Home, ArrowLeft,
  Crown, Shield, Check, Target,
} from "lucide-react";

export default function BattleResultPage() {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();
  const userId = user?.uid;

  const { result, loading, error, fetchResult, reset } = useBattleStore();

  useEffect(() => {
    if (battleId && userId) {
      fetchResult(Number(battleId), userId);
      useGamificationStore.getState().loadStats(userId);
    }
    return () => reset();
  }, [battleId, userId]);

  if (loading || !result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading results…</span>
        </div>
      </div>
    );
  }

  const isWin  = result.outcome === "WIN";
  const isDraw = result.outcome === "DRAW";
  const isLoss = !isWin && !isDraw;

  const ratingDiff = result.ratingAfter - result.ratingBefore;
  const isRanked   = result.mode === "RANKED_1V1";

  const OUTCOME = {
    WIN:  { label: "Victory",  icon: Trophy, color: "text-amber-500",      bg: "bg-amber-500/10",  border: "border-amber-500/20" },
    DRAW: { label: "Draw",     icon: Minus,  color: "text-muted-foreground", bg: "bg-muted/30",     border: "border-border/40" },
    LOSS: { label: "Defeat",   icon: Skull,  color: "text-red-500",         bg: "bg-red-500/10",   border: "border-red-500/20" },
  };
  const outcome = OUTCOME[result.outcome] || OUTCOME.LOSS;
  const OutcomeIcon = outcome.icon;

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="battle-fade-up">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 group"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Battle Result</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {result.mode.replace("_", " ")} · {result.you.problemsSolved}/{result.you.problemsSolved + (result.opponent?.problemsSolved ?? 0)} problems solved
              </p>
            </div>
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border",
              outcome.bg, outcome.border
            )}>
              <OutcomeIcon className={cn("w-5 h-5", outcome.color)} />
              <span className={cn("text-base font-bold", outcome.color)}>{outcome.label}</span>
            </div>
          </div>
        </div>

        {/* Player Comparison */}
        <div className="battle-fade-up battle-fade-up-delay-1 rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Match Summary</span>
          </div>

          <div className="grid grid-cols-2 divide-x divide-border/60">
            <PlayerColumn stats={result.you} label="You" isWinner={result.winnerId === result.you.userId} />
            <PlayerColumn stats={result.opponent} label="Opponent" isWinner={result.winnerId === result.opponent.userId} />
          </div>
        </div>

        {/* Rewards + Rating */}
        <div className="battle-fade-up battle-fade-up-delay-2 grid grid-cols-3 gap-4">
          {/* XP */}
          <div className="rounded-xl border border-border/60 bg-card px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#5542FF]/10 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-[#5542FF]" />
              </div>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">XP Earned</span>
            </div>
            <div className="text-2xl font-black text-foreground tabular-nums">
              +<NumberTicker value={result.xpEarned} className="font-black text-foreground" />
            </div>
          </div>

          {/* Coins */}
          <div className="rounded-xl border border-border/60 bg-card px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Coins</span>
            </div>
            <div className="text-2xl font-black text-foreground tabular-nums">
              +<NumberTicker value={result.coinsEarned} className="font-black text-foreground" />
            </div>
          </div>

          {/* Rating */}
          <div className="rounded-xl border border-border/60 bg-card px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center",
                isRanked
                  ? ratingDiff >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
                  : "bg-muted/50"
              )}>
                {isRanked
                  ? ratingDiff >= 0
                    ? <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />
                    : <ArrowDown className="w-3.5 h-3.5 text-red-500" />
                  : <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
              </div>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Battle Rating</span>
            </div>
            {isRanked ? (
              <div className="flex items-baseline gap-1.5">
                <span className={cn(
                  "text-2xl font-black tabular-nums",
                  ratingDiff >= 0 ? "text-emerald-500" : "text-red-500"
                )}>
                  {ratingDiff >= 0 ? "+" : ""}{ratingDiff}
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  ({result.ratingBefore} → {result.ratingAfter})
                </span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Casual — no change</div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="battle-fade-up battle-fade-up-delay-3 flex items-center gap-3">
          <button
            onClick={() => { reset(); navigate("/battle"); }}
            className={cn(
              "flex items-center gap-2 h-11 px-6 rounded-lg text-sm font-semibold transition-all",
              "bg-foreground text-background dark:bg-white dark:text-black",
              "hover:opacity-90 active:scale-[0.98] shadow-sm"
            )}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Play Again
          </button>
          <button
            onClick={() => navigate("/leaderboard")}
            className="flex items-center gap-2 h-11 px-5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all border border-border/50"
          >
            <Trophy className="w-3.5 h-3.5" /> Leaderboard
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 h-11 px-5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all border border-border/50"
          >
            <Home className="w-3.5 h-3.5" /> Home
          </button>
        </div>

      </div>
    </div>
  );
}

/* ──── Player Column ──── */
function PlayerColumn({ stats, label, isWinner }) {
  const formatTime = (ms) => {
    if (!ms || ms === 0) return "DNF";
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</span>
        {isWinner && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
            <Crown className="w-2.5 h-2.5" /> Winner
          </span>
        )}
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-foreground shrink-0">
          {stats.username?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <span className="font-semibold text-foreground truncate">{stats.username}</span>
      </div>

      {/* Stats */}
      <div className="space-y-3">
        {[
          { label: "Solved",    value: stats.problemsSolved,              icon: Target },
          { label: "Time",      value: formatTime(stats.totalSolveTimeMs), icon: Timer, mono: true },
          { label: "Attempts",  value: stats.totalSubmissions,            icon: RotateCcw },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <row.icon className="w-3 h-3" />
              {row.label}
            </div>
            <span className={cn(
              "text-sm font-semibold text-foreground",
              row.mono && "font-mono tabular-nums"
            )}>{row.value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" /> Rating
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground tabular-nums">{stats.ratingBefore}</span>
            {stats.ratingAfter != null && stats.ratingAfter !== stats.ratingBefore && (
              <>
                <span className="text-muted-foreground/40 text-xs">→</span>
                <span className={cn(
                  "text-sm font-bold tabular-nums",
                  stats.ratingAfter > stats.ratingBefore ? "text-emerald-500" : "text-red-500"
                )}>{stats.ratingAfter}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// export default function BattleResultPage() {
//   const { battleId } = useParams();
//   const navigate = useNavigate();
//   const user = getStoredUser();
//   const userId = user?.uid;

//   const { result, loading, error, fetchResult, reset } = useBattleStore();

//   useEffect(() => {
//     if (battleId && userId) {
//       fetchResult(Number(battleId), userId);
//       // Refresh global gamification stats so navbar coins/XP/level update
//       useGamificationStore.getState().loadStats(userId);
//     }
//     return () => reset();
//   }, [battleId, userId]);

//   if (loading || !result) {
//     return (
//       <div className="battle-page min-h-screen bg-background flex items-center justify-center">
//         <div className="flex flex-col items-center gap-3">
//           <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
//           <span className="text-sm text-muted-foreground">Loading results…</span>
//         </div>
//       </div>
//     );
//   }

//   const isWin = result.outcome === "WIN";
//   const isDraw = result.outcome === "DRAW";
//   const isLoss = !isWin && !isDraw;

//   const OutcomeIcon = isWin ? Trophy : isDraw ? Minus : Skull;
//   const outcomeText = isWin ? "Victory" : isDraw ? "Draw" : "Defeat";

//   const outcomeColor = isWin
//     ? "text-amber-500"
//     : isDraw
//       ? "text-muted-foreground"
//       : "text-red-500";

//   const outcomeBg = isWin
//     ? "bg-amber-500/5"
//     : isDraw
//       ? "bg-foreground/[0.02] dark:bg-white/[0.02]"
//       : "bg-red-500/5";

//   const outcomeGlow = isWin
//     ? "shadow-amber-500/10"
//     : isDraw
//       ? "shadow-none"
//       : "shadow-red-500/10";

//   const ratingDiff = result.ratingAfter - result.ratingBefore;
//   const ratingPositive = ratingDiff >= 0;

//   return (
//     <div className="battle-page min-h-screen bg-background pt-28 pb-16 px-4">
//       <div className="max-w-2xl mx-auto">
//         {/* Header */}
//         <div className="battle-fade-up mb-10">
//           <button
//             onClick={() => navigate(-1)}
//             className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
//           >
//             <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
//             <span>Back</span>
//           </button>
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 rounded-lg bg-foreground/5 dark:bg-white/5 flex items-center justify-center">
//               <Swords className="w-4 h-4 text-muted-foreground" />
//             </div>
//             <div>
//               <h1 className="text-xl font-semibold text-foreground tracking-tight">Battle Result</h1>
//               <p className="text-xs text-muted-foreground mt-0.5">{result.mode.replace("_", " ")}</p>
//             </div>
//           </div>
//         </div>

//         {/* ══════ Outcome Banner ══════ */}
//         <div className={cn(
//           "battle-card battle-fade-up battle-fade-up-delay-1 overflow-hidden",
//           outcomeGlow && `shadow-2xl ${outcomeGlow}`
//         )}>
//           {/* Outcome Header */}
//           <div className={cn("px-8 py-10 text-center relative", outcomeBg)}>
//             {/* Subtle decorative ring */}
//             <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
//               <div className="w-48 h-48 rounded-full border-[3px] border-foreground dark:border-white" />
//             </div>

//             <div className="relative">
//               <OutcomeIcon className={cn("w-12 h-12 mx-auto mb-4", outcomeColor)} />
//               <h2 className={cn("text-4xl font-bold tracking-tight", outcomeColor)}>
//                 {outcomeText}
//               </h2>
//               <div className="mt-3">
//                 <span className="px-3 py-1 rounded-full bg-foreground/5 dark:bg-white/5 text-[11px] font-medium text-muted-foreground">
//                   {result.mode.replace("_", " ")}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Stats + Rewards */}
//           <div className="p-6 space-y-6">
//             {/* ── Player Comparison ── */}
//             <div className="grid grid-cols-2 gap-4">
//               <StatCard
//                 label="You"
//                 stats={result.you}
//                 isWinner={result.winnerId === result.you.userId}
//               />
//               <StatCard
//                 label="Opponent"
//                 stats={result.opponent}
//                 isWinner={result.winnerId === result.opponent.userId}
//               />
//             </div>

//             <div className="battle-divider" />

//             {/* ── Rewards Row ── */}
//             <div className="grid grid-cols-3 gap-3">
//               {/* XP */}
//               <div className="rounded-xl bg-foreground/[0.03] dark:bg-white/[0.03] border border-border/30 dark:border-white/5 p-4 text-center">
//                 <Sparkles className="w-4 h-4 mx-auto mb-2 text-[#5542FF]" />
//                 <div className="text-lg font-bold text-foreground tabular-nums">
//                   +<NumberTicker value={result.xpEarned} className="font-bold text-foreground" />
//                 </div>
//                 <div className="battle-label mt-1">XP Earned</div>
//               </div>

//               {/* Coins */}
//               <div className="rounded-xl bg-foreground/[0.03] dark:bg-white/[0.03] border border-border/30 dark:border-white/5 p-4 text-center">
//                 <Coins className="w-4 h-4 mx-auto mb-2 text-amber-500" />
//                 <div className="text-lg font-bold text-foreground tabular-nums">
//                   +<NumberTicker value={result.coinsEarned} className="font-bold text-foreground" />
//                 </div>
//                 <div className="battle-label mt-1">Coins</div>
//               </div>

//               {/* Rating Change */}
//               <div className="rounded-xl bg-foreground/[0.03] dark:bg-white/[0.03] border border-border/30 dark:border-white/5 p-4 text-center">
//                 {ratingPositive
//                   ? <ArrowUp className="w-4 h-4 mx-auto mb-2 text-emerald-500" />
//                   : <ArrowDown className="w-4 h-4 mx-auto mb-2 text-red-500" />
//                 }
//                 <div className="flex items-center justify-center gap-1.5">
//                   <span className="text-sm text-muted-foreground tabular-nums font-medium">{result.ratingBefore}</span>
//                   <span className="text-muted-foreground/40">→</span>
//                   <span className={cn("text-lg font-bold tabular-nums", ratingPositive ? "text-emerald-500" : "text-red-500")}>
//                     {result.ratingAfter}
//                   </span>
//                 </div>
//                 <div className="battle-label mt-1">
//                   <span className={cn(ratingPositive ? "text-emerald-500" : "text-red-500")}>
//                     {ratingPositive ? "+" : ""}{ratingDiff}
//                   </span>
//                   {" "}BR
//                 </div>
//               </div>
//             </div>

//             <div className="battle-divider" />

//             {/* ── Actions ── */}
//             <div className="flex justify-center gap-3 pt-1">
//               <button
//                 onClick={() => { reset(); navigate("/battle"); }}
//                 className={cn(
//                   "flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold transition-all",
//                   "bg-foreground text-background dark:bg-white dark:text-black",
//                   "hover:opacity-90 active:scale-[0.97]",
//                   "shadow-lg shadow-foreground/10 dark:shadow-white/10"
//                 )}
//               >
//                 <RotateCcw className="w-4 h-4" /> Play Again
//               </button>
//               <button
//                 onClick={() => navigate("/leaderboard")}
//                 className="flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 dark:hover:bg-white/5 transition-all"
//               >
//                 <Trophy className="w-4 h-4" /> Leaderboard
//               </button>
//               <button
//                 onClick={() => navigate("/")}
//                 className="flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 dark:hover:bg-white/5 transition-all"
//               >
//                 <Home className="w-4 h-4" /> Home
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ── Helper Components ── */

// function StatCard({ label, stats, isWinner }) {
//   const formatTime = (ms) => {
//     if (!ms || ms === 0) return "DNF";
//     const m = Math.floor(ms / 60000);
//     const s = Math.floor((ms % 60000) / 1000);
//     return `${m}:${String(s).padStart(2, "0")}`;
//   };

//   return (
//     <div className={cn(
//       "rounded-xl border p-5 transition-all",
//       isWinner
//         ? "border-amber-500/20 bg-amber-500/[0.03]"
//         : "border-border/30 dark:border-white/5 bg-foreground/[0.02] dark:bg-white/[0.02]"
//     )}>
//       {/* Header */}
//       <div className="flex items-center justify-between mb-4">
//         <span className="battle-label">{label}</span>
//         {isWinner && (
//           <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-[10px] font-semibold text-amber-500">
//             <Crown className="w-2.5 h-2.5" /> Winner
//           </div>
//         )}
//       </div>

//       {/* Avatar + Name */}
//       <div className="flex items-center gap-3 mb-4">
//         <div className={cn(
//           "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
//           "bg-foreground/5 dark:bg-white/5 text-foreground"
//         )}>
//           {stats.username?.charAt(0)?.toUpperCase() || "?"}
//         </div>
//         <div className="font-semibold text-foreground truncate">{stats.username}</div>
//       </div>

//       {/* Stats Grid */}
//       <div className="space-y-2.5">
//         {[
//           { label: "Solved", value: stats.problemsSolved },
//           { label: "Time", value: formatTime(stats.totalSolveTimeMs), mono: true },
//           { label: "Attempts", value: stats.totalSubmissions },
//           { label: "Rating", value: stats.ratingBefore, after: stats.ratingAfter },
//         ].map(row => (
//           <div key={row.label} className="flex justify-between items-center">
//             <span className="text-xs text-muted-foreground">{row.label}</span>
//             <span className={cn("text-sm font-semibold text-foreground", row.mono && "font-mono tabular-nums")}>
//               {row.value}
//               {row.after != null && row.after !== row.value && (
//                 <span className={cn("ml-1 text-xs", row.after > row.value ? "text-emerald-500" : "text-red-500")}>
//                   → {row.after}
//                 </span>
//               )}
//             </span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
