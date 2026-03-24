import { Clock3, Swords, VolumeX } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useFriendsStore from "@/stores/useFriendsStore";
import useUserStore from "@/stores/useUserStore";
import useBattleStore from "@/stores/useBattleStore";
import { MONUMENT_TYPO as FRIENDS_TYPO } from "@/components/MonumentTypography";

export default function FriendChallengeModal() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const S = {
    acid: "#EDFF66",
    bg: "#09090b",
    panel: "#0c0c0f",
    panelSoft: "#0d0d10",
    border: "rgba(255,255,255,0.08)",
    borderStrong: "rgba(255,255,255,0.16)",
    text: "#FFFFFF",
    textSoft: "rgba(255,255,255,0.68)",
    textDim: "rgba(255,255,255,0.45)",
    green: "#10b981",
    red: "#ef4444",
  };
  const headingTextStyle = {
    fontFamily: FRIENDS_TYPO.fontFamily,
    letterSpacing: FRIENDS_TYPO.letterSpacing.monument,
  };
  const baseTextStyle = {
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    letterSpacing: "normal",
  };

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

    const accepted = res?.challenge;
    if (accepted?.mode === "GROUP_FFA" && accepted?.roomCode) {
      navigate(`/group/${accepted.roomCode}`);
      return;
    }

    const battleId = accepted?.battleId;
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
        className="fixed bottom-5 right-5 z-[120]"
        style={baseTextStyle}
        title="Open pending challenge"
      >
        <span
          style={{
            height: 42,
            padding: "0 14px",
            borderRadius: 10,
            border: `1px solid ${S.borderStrong}`,
            background: S.panel,
            color: S.text,
            boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            ...baseTextStyle,
          }}
        >
          <Swords size={13} color={S.acid} /> Pending challenge
        </span>
      </button>
    );
  }

  if (activeOutgoingChallenge && !activeIncomingChallenge) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}>
        <div
          className="w-full max-w-md"
          style={{
            borderRadius: 14,
            border: `1px solid ${S.borderStrong}`,
            background: `linear-gradient(180deg, ${S.panel} 0%, ${S.bg} 100%)`,
            padding: 18,
            boxShadow: "0 26px 70px rgba(0,0,0,0.55)",
            position: "relative",
            overflow: "hidden",
            ...baseTextStyle,
          }}
        >
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "20px 20px", opacity: 0.26, pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${S.acid}, transparent)` }} />

          <div className="flex items-start gap-3" style={{ position: "relative" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${S.border}`, background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock3 size={16} color={S.acid} />
            </div>
            <div className="min-w-0">
              <p style={{ color: S.text, fontSize: 14, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", ...headingTextStyle }}>Challenge sent</p>
              <p style={{ color: S.textSoft, fontSize: 12, marginTop: 4 }}>
                Waiting for <span style={{ color: S.acid, fontWeight: 700 }}>{activeOutgoingChallenge.challengeeUsername}</span> to respond.
              </p>
            </div>
          </div>

          <div style={{ position: "relative", marginTop: 14, borderRadius: 10, border: `1px solid ${S.border}`, background: S.panelSoft, padding: 12, fontSize: 12, lineHeight: 1.6 }}>
            <p><span style={{ color: S.textDim }}>Mode:</span> <span style={{ color: S.text }}>{activeOutgoingChallenge.mode}</span></p>
            <p><span style={{ color: S.textDim }}>Difficulty:</span> <span style={{ color: S.text }}>{activeOutgoingChallenge.difficulty}</span></p>
            <p><span style={{ color: S.textDim }}>Problems:</span> <span style={{ color: S.text }}>{activeOutgoingChallenge.problemCount}</span></p>
            {activeOutgoingChallenge.durationMinutes > 0 && (
              <p><span style={{ color: S.textDim }}>Time:</span> <span style={{ color: S.text }}>{activeOutgoingChallenge.durationMinutes} min</span></p>
            )}
            {activeOutgoingChallenge.roomCode && (
              <p><span style={{ color: S.textDim }}>Room:</span> <span style={{ color: S.acid }}>{activeOutgoingChallenge.roomCode}</span></p>
            )}
          </div>

          <div className="flex gap-2" style={{ position: "relative", marginTop: 14 }}>
            <button
              disabled={actionLoading}
              onClick={handleCancelOutgoing}
              style={{
                height: 36,
                padding: "0 12px",
                borderRadius: 8,
                border: `1px solid ${S.border}`,
                background: "transparent",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: S.textSoft,
                opacity: actionLoading ? 0.5 : 1,
              }}
            >
              Cancel request
            </button>
            <button
              disabled={actionLoading}
              onClick={dismissOutgoingChallengeModal}
              style={{
                height: 36,
                padding: "0 12px",
                borderRadius: 8,
                border: "none",
                background: S.acid,
                color: "#09090b",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                opacity: actionLoading ? 0.5 : 1,
              }}
            >
              Keep in background
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}>
      <div
        className="w-full max-w-md"
        style={{
          borderRadius: 14,
          border: `1px solid ${S.borderStrong}`,
          background: `linear-gradient(180deg, ${S.panel} 0%, ${S.bg} 100%)`,
          padding: 18,
          boxShadow: "0 26px 70px rgba(0,0,0,0.55)",
          position: "relative",
          overflow: "hidden",
          ...baseTextStyle,
        }}
      >
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "20px 20px", opacity: 0.26, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${S.acid}, transparent)` }} />

        <div className="flex items-start gap-3" style={{ position: "relative" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${S.border}`, background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Swords size={16} color={S.acid} />
          </div>
          <div className="min-w-0">
            <p style={{ color: S.text, fontSize: 14, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", ...headingTextStyle }}>Friend match request</p>
            <p style={{ color: S.textSoft, fontSize: 12, marginTop: 4 }}>
                <span style={{ color: S.acid, fontWeight: 700 }}>{activeIncomingChallenge.challengerUsername}</span>
                {activeIncomingChallenge.mode === "GROUP_FFA" ? " invited you to join a room." : " challenged you."}
            </p>
          </div>
        </div>

        <div style={{ position: "relative", marginTop: 14, borderRadius: 10, border: `1px solid ${S.border}`, background: S.panelSoft, padding: 12, fontSize: 12, lineHeight: 1.6 }}>
          <p><span style={{ color: S.textDim }}>Mode:</span> <span style={{ color: S.text }}>{activeIncomingChallenge.mode}</span></p>
          <p><span style={{ color: S.textDim }}>Difficulty:</span> <span style={{ color: S.text }}>{activeIncomingChallenge.difficulty}</span></p>
          <p><span style={{ color: S.textDim }}>Problems:</span> <span style={{ color: S.text }}>{activeIncomingChallenge.problemCount}</span></p>
          {activeIncomingChallenge.durationMinutes > 0 && (
            <p><span style={{ color: S.textDim }}>Time:</span> <span style={{ color: S.text }}>{activeIncomingChallenge.durationMinutes} min</span></p>
          )}
          {activeIncomingChallenge.roomCode && (
            <p><span style={{ color: S.textDim }}>Room:</span> <span style={{ color: S.acid }}>{activeIncomingChallenge.roomCode}</span></p>
          )}
        </div>

        <div className="flex gap-2" style={{ position: "relative", marginTop: 14 }}>
          <button
            disabled={actionLoading}
            onClick={handleAccept}
            style={{
              height: 36,
              padding: "0 12px",
              borderRadius: 8,
              border: "none",
              background: S.green,
              color: "#09090b",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              opacity: actionLoading ? 0.5 : 1,
            }}
          >
            Accept
          </button>
          <button
            disabled={actionLoading}
            onClick={handleReject}
            style={{
              height: 36,
              padding: "0 12px",
              borderRadius: 8,
              border: `1px solid ${S.border}`,
              background: "transparent",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: S.textSoft,
              opacity: actionLoading ? 0.5 : 1,
            }}
          >
            Reject
          </button>
        </div>

        <div style={{ position: "relative", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${S.border}` }}>
          <p style={{ fontSize: 10, color: S.textDim, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Don’t disturb me for:</p>
          <div className="flex flex-wrap gap-2">
            {[15, 30, 60].map((m) => (
              <button
                key={m}
                disabled={actionLoading}
                onClick={() => handleMute(m)}
                style={{
                  height: 30,
                  padding: "0 10px",
                  borderRadius: 7,
                  border: `1px solid ${S.border}`,
                  background: "transparent",
                  color: S.textSoft,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: actionLoading ? 0.5 : 1,
                }}
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
