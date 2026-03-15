import { Clock3, Swords, VolumeX } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useFriendsStore from "@/stores/useFriendsStore";
import useUserStore from "@/stores/useUserStore";
import useBattleStore from "@/stores/useBattleStore";

export default function FriendChallengeModal() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  const {
    activeIncomingChallenge,
    activeOutgoingChallenge,
    outgoingChallengeMinimized,
    challengeAcceptedBattleId,
    actionLoading,
    dismissIncomingChallengeModal,
    dismissOutgoingChallengeModal,
    reopenOutgoingChallengeModal,
    clearChallengeAcceptedBattleId,
    acceptChallenge,
    rejectChallenge,
    cancelChallenge,
    muteChallenges,
  } = useFriendsStore();

  const fetchLobby = useBattleStore((s) => s.fetchLobby);

  useEffect(() => {
    const battleId = challengeAcceptedBattleId;
    if (!battleId || !user?.uid) return;

    (async () => {
      await fetchLobby(battleId, user.uid);
      navigate("/battle");
      clearChallengeAcceptedBattleId();
    })();
  }, [challengeAcceptedBattleId, user?.uid, fetchLobby, navigate, clearChallengeAcceptedBattleId]);

  if (!activeIncomingChallenge && !activeOutgoingChallenge) return null;

  const handleAccept = async () => {
    const res = await acceptChallenge(activeIncomingChallenge.id);
    if (!res?.ok) return;

    const battleId = res?.challenge?.battleId;
    if (battleId && user?.uid) {
      await fetchLobby(battleId, user.uid);
      navigate("/battle");
    }
  };

  const handleReject = async () => {
    await rejectChallenge(activeIncomingChallenge.id);
    dismissIncomingChallengeModal();
  };

  const handleMute = async (minutes) => {
    await muteChallenges(minutes);
  };

  const handleCancelOutgoing = async () => {
    if (!activeOutgoingChallenge?.id) return;
    await cancelChallenge(activeOutgoingChallenge.id);
    dismissOutgoingChallengeModal();
  };

  if (activeOutgoingChallenge && outgoingChallengeMinimized && !activeIncomingChallenge) {
    return (
      <button
        onClick={reopenOutgoingChallengeModal}
        className="fixed bottom-5 right-5 z-[120] h-12 px-4 rounded-full bg-[#5542FF] text-white shadow-lg shadow-[#5542FF]/40 inline-flex items-center gap-2 text-sm font-medium hover:opacity-95"
        title="Open pending challenge"
      >
        <Swords size={14} /> Pending challenge
      </button>
    );
  }

  if (activeOutgoingChallenge && !activeIncomingChallenge) {
    return (
      <div className="fixed inset-0 z-[120] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5542FF]/15 flex items-center justify-center">
              <Clock3 size={18} className="text-[#B28EF2]" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold">Challenge sent</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Waiting for <span className="font-medium text-foreground">{activeOutgoingChallenge.challengeeUsername}</span> to respond.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-3 text-sm space-y-1">
            <p><span className="text-muted-foreground">Mode:</span> {activeOutgoingChallenge.mode}</p>
            <p><span className="text-muted-foreground">Difficulty:</span> {activeOutgoingChallenge.difficulty}</p>
            <p><span className="text-muted-foreground">Problems:</span> {activeOutgoingChallenge.problemCount}</p>
          </div>

          <div className="flex gap-2">
            <button
              disabled={actionLoading}
              onClick={handleCancelOutgoing}
              className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              Cancel request
            </button>
            <button
              disabled={actionLoading}
              onClick={dismissOutgoingChallengeModal}
              className="h-10 px-4 rounded-lg bg-[#5542FF] text-white text-sm font-medium disabled:opacity-50"
            >
              Keep in background
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 space-y-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5542FF]/15 flex items-center justify-center">
            <Swords size={18} className="text-[#B28EF2]" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold">Friend match request</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground">{activeIncomingChallenge.challengerUsername}</span> challenged you.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-3 text-sm space-y-1">
          <p><span className="text-muted-foreground">Mode:</span> {activeIncomingChallenge.mode}</p>
          <p><span className="text-muted-foreground">Difficulty:</span> {activeIncomingChallenge.difficulty}</p>
          <p><span className="text-muted-foreground">Problems:</span> {activeIncomingChallenge.problemCount}</p>
        </div>

        <div className="flex gap-2">
          <button
            disabled={actionLoading}
            onClick={handleAccept}
            className="h-10 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
          >
            Accept
          </button>
          <button
            disabled={actionLoading}
            onClick={handleReject}
            className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Reject
          </button>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Don’t disturb me for:</p>
          <div className="flex flex-wrap gap-2">
            {[15, 30, 60].map((m) => (
              <button
                key={m}
                disabled={actionLoading}
                onClick={() => handleMute(m)}
                className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 disabled:opacity-50"
              >
                <VolumeX size={12} /> {m} min
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
