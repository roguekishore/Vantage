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
import { Button } from "../components/ui/button";

function PlacementIcon({ placement }) {
  if (placement === 1) return (
    <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
      <Trophy className="w-5 h-5 text-amber-400" />
    </div>
  );
  if (placement === 2) return (
    <div className="w-10 h-10 rounded-full bg-slate-400/20 border border-slate-400/40 flex items-center justify-center">
      <Medal className="w-5 h-5 text-slate-400" />
    </div>
  );
  if (placement === 3) return (
    <div className="w-10 h-10 rounded-full bg-amber-700/20 border border-amber-700/40 flex items-center justify-center">
      <Medal className="w-5 h-5 text-amber-700" />
    </div>
  );
  return (
    <div className="w-10 h-10 rounded-full bg-muted/30 border border-border/40 flex items-center justify-center">
      <span className="text-sm font-bold text-muted-foreground">{placement}</span>
    </div>
  );
}

function OutcomeBanner({ myPlacement }) {
  const labels = {
    1: { text: "1st Place 🏆", sub: "You dominated the arena!", color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300" },
    2: { text: "2nd Place 🥈", sub: "Great performance!", color: "from-slate-400/20 to-slate-500/20 border-slate-400/30 text-slate-300" },
    3: { text: "3rd Place 🥉", sub: "Solid finish!", color: "from-amber-700/20 to-amber-800/20 border-amber-700/30 text-amber-600" },
  };
  const info = labels[myPlacement] || { text: `#${myPlacement} Place`, sub: "Better luck next time!", color: "from-muted/20 to-muted/10 border-border/40 text-muted-foreground" };

  return (
    <div className={cn(
      "rounded-xl border bg-gradient-to-r p-5 text-center mb-6",
      info.color
    )}>
      <h2 className="text-3xl font-bold">{info.text}</h2>
      <p className="text-sm mt-1 opacity-70">{info.sub}</p>
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-lg space-y-4 battle-fade-up">

        {/* Header */}
        <div className="text-center mb-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Group Battle — FFA</span>
          </div>
        </div>

        {/* Outcome banner */}
        <OutcomeBanner myPlacement={result.myPlacement} />

        {/* My rewards */}
        <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center justify-around battle-fade-up-delay-1">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-xs text-muted-foreground">XP Earned</p>
              <p className="text-xl font-bold">+{result.myXp}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-border/60" />
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-xs text-muted-foreground">Coins</p>
              <p className="text-xl font-bold">+{result.myCoins}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-border/60" />
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Rank</p>
              <p className="text-xl font-bold">#{result.myPlacement}</p>
            </div>
          </div>
        </div>

        {/* Full scoreboard */}
        <div className="rounded-xl border border-border/60 bg-card p-4 battle-fade-up-delay-2">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-widest">
            Final Scoreboard
          </h3>
          <div className="space-y-2">
            {result.placements.map((entry) => (
              <div
                key={entry.userId}
                className={cn(
                  "flex items-center gap-3 rounded-lg p-3 transition-colors",
                  entry.userId === userId
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-background/40 border border-transparent"
                )}
              >
                <PlacementIcon placement={entry.placement} />

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {entry.username}
                    {entry.userId === userId && (
                      <span className="ml-1 text-xs text-primary font-normal">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.problemsSolved} solved · {entry.totalSubmissions} submissions
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-primary">{entry.groupScore} pts</p>
                  <p className="text-xs text-muted-foreground">
                    +{entry.coinsEarned}🪙 +{entry.xpEarned}xp
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 battle-fade-up-delay-3">
          <Button onClick={handlePlayAgain} className="flex-1 gap-2">
            <Users className="w-4 h-4" />
            Play Again
          </Button>
          <Button variant="outline" onClick={() => { reset(); navigate("/battle"); }}
            className="flex-1 gap-2">
            <ArrowRight className="w-4 h-4" />
            1v1 Battle
          </Button>
        </div>
      </div>
    </div>
  );
}
