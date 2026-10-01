import { Clock3, Swords, VolumeX } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useFriendsStore from "@/stores/useFriendsStore";
import useUserStore from "@/stores/useUserStore";
import useBattleStore from "@/stores/useBattleStore";
import { Avatar, Button, Dialog, DialogClose, DialogContent, DialogFooter } from "@/components/ds";

/*
 * The one ChallengeDialog. Three variants share
 * one ds Dialog shell:
 *   compose   pick mode, difficulty, problem count and time, then send
 *             (opened from FriendsPage with its local challengeTarget)
 *   incoming  accept / reject / do-not-disturb (global, store driven)
 *   outgoing  waiting for the friend; cancel or keep in background
 * The default export is the global incoming/outgoing host App.jsx mounts.
 */

const QUICK_DURATION_OPTIONS = [20, 30, 45, 60, 90, 120, 150, 180];

const MODE_LABEL = { CASUAL_1V1: "Casual 1v1", RANKED_1V1: "Ranked 1v1", GROUP_FFA: "Group room" };
const DIFF_LABEL = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" };
const DIFF_TONE = { EASY: "text-ok", MEDIUM: "text-warn", HARD: "text-err" };
const DIFF_BAR = { EASY: "border-l-ok", MEDIUM: "border-l-warn", HARD: "border-l-err" };

const labelCls = "font-mono text-label uppercase text-fg-muted";
const focusCls = "ds-focus:outline ds-focus:outline-2 ds-focus:outline-offset-2 ds-focus:outline-focus";

/* ── shared pieces ── */

function Opponent({ name, meta }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} size="lg" />
      <div className="grid min-w-0 gap-0.5 font-mono">
        <div className="truncate text-body font-bold text-fg">{name}</div>
        {meta ? <div className="text-small text-fg-muted">{meta}</div> : null}
      </div>
    </div>
  );
}

function ChallengeDetails({ challenge }) {
  const rows = [
    ["Mode", MODE_LABEL[challenge.mode] || challenge.mode],
    ["Difficulty", DIFF_LABEL[challenge.difficulty] || challenge.difficulty, DIFF_TONE[challenge.difficulty]],
    ["Problems", challenge.problemCount],
  ];
  if (challenge.durationMinutes > 0) rows.push(["Time", `${challenge.durationMinutes} min`]);
  if (challenge.roomCode) rows.push(["Room", challenge.roomCode, "text-accent-ink"]);
  return (
    <dl className="mt-4 border border-border bg-bg font-mono text-small tabular-nums [&>div:last-child]:border-b-0">
      {rows.map(([k, v, tone]) => (
        <div key={k} className="flex items-baseline justify-between gap-4 border-b border-border px-3 py-2">
          <dt className="text-fg-muted">{k}</dt>
          <dd className={`text-right ${tone || "text-fg"}`}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Single-choice option group (radiogroup with roving tabindex and arrow keys). */
function OptionGroup({ label, value, options, onChange, className }) {
  const labelId = useId();
  const refs = useRef([]);
  const onKeyDown = (e, i) => {
    const next = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!next) return;
    e.preventDefault();
    const j = (i + next + options.length) % options.length;
    refs.current[j]?.focus();
    onChange(options[j].value);
  };
  return (
    <div className="grid gap-2">
      <div id={labelId} className={labelCls}>
        {label}
      </div>
      <div role="radiogroup" aria-labelledby={labelId} className={`grid gap-1 ${className || ""}`}>
        {options.map((o, i) => {
          const checked = o.value === value;
          return (
            <button
              key={o.value}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onClick={() => onChange(o.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={[
                "inline-flex h-9 items-center justify-center gap-2 border px-2 font-mono text-label uppercase tabular-nums transition-colors duration-[120ms] ease-out",
                focusCls,
                o.bar ? `border-l-2 ${o.bar}` : "",
                checked
                  ? "border-accent-edge bg-accent text-on-accent"
                  : `border-border bg-elevated ds-hover:border-border-strong ${o.tone || "text-fg-muted"} ds-hover:text-fg`,
              ].join(" ")}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** The shared shell: ds Dialog with an opponent header row and a footer. */
function ChallengeDialog({ open, onOpenChange, title, description, opponent, opponentMeta, blockDismiss = false, children, footer }) {
  const block = blockDismiss ? (e) => e.preventDefault() : undefined;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="sm"
        title={title}
        description={description}
        hideClose={blockDismiss}
        onEscapeKeyDown={block}
        onInteractOutside={block}
      >
        {opponent ? <Opponent name={opponent} meta={opponentMeta} /> : null}
        {children}
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}

/* ── compose (FriendsPage) ── */

export function ChallengeComposeDialog({ target, onClose, onSubmit, loading }) {
  const [mode, setMode] = useState("CASUAL_1V1");
  const [diff, setDiff] = useState("MEDIUM");
  const [count, setCount] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(60);

  return (
    <ChallengeDialog
      open
      onOpenChange={(o) => { if (!o) onClose(); }}
      title="Send a challenge"
      description="Pick the match settings. Your friend can accept or decline."
      opponent={target.username}
      opponentMeta="Online now"
      footer={
        <>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button
            variant="primary"
            loading={loading}
            disabled={loading}
            onClick={() => onSubmit({ mode, difficulty: diff, count, durationMinutes })}
          >
            <Swords aria-hidden="true" /> Send challenge
          </Button>
        </>
      }
    >
      <div className="mt-6 grid gap-4">
        <OptionGroup
          label="Mode"
          value={mode}
          onChange={setMode}
          className="grid-cols-2"
          options={[
            { value: "CASUAL_1V1", label: "Casual" },
            { value: "RANKED_1V1", label: "Ranked" },
          ]}
        />
        <OptionGroup
          label="Difficulty"
          value={diff}
          onChange={setDiff}
          className="grid-cols-3"
          options={["EASY", "MEDIUM", "HARD"].map((v) => ({ value: v, label: DIFF_LABEL[v], tone: DIFF_TONE[v], bar: DIFF_BAR[v] }))}
        />
        <OptionGroup
          label="Problems"
          value={count}
          onChange={setCount}
          className="grid-cols-3"
          options={[1, 2, 3].map((n) => ({ value: n, label: String(n) }))}
        />
        <OptionGroup
          label="Time limit"
          value={durationMinutes}
          onChange={setDurationMinutes}
          className="grid-cols-4"
          options={QUICK_DURATION_OPTIONS.map((m) => ({ value: m, label: `${m}m` }))}
        />
      </div>
    </ChallengeDialog>
  );
}

/* ── incoming / outgoing (global, App.jsx) ── */

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
      <Button
        variant="secondary"
        onClick={reopenOutgoingChallengeModal}
        className="fixed bottom-4 right-4 z-sticky bg-surface"
        title="Open pending challenge"
      >
        <Swords aria-hidden="true" className="text-accent-ink" /> Pending challenge
      </Button>
    );
  }

  if (activeOutgoingChallenge && !activeIncomingChallenge) {
    return (
      <ChallengeDialog
        open
        onOpenChange={(o) => { if (!o) dismissOutgoingChallengeModal(); }}
        title="Challenge sent"
        description={`Waiting for ${activeOutgoingChallenge.challengeeUsername} to respond.`}
        opponent={activeOutgoingChallenge.challengeeUsername}
        opponentMeta={
          <span className="inline-flex items-center gap-2">
            <Clock3 size={14} strokeWidth={1.5} aria-hidden="true" /> Waiting for a response
          </span>
        }
        footer={
          <>
            <Button variant="secondary" disabled={actionLoading} onClick={handleCancelOutgoing}>
              Cancel request
            </Button>
            <Button variant="primary" disabled={actionLoading} onClick={dismissOutgoingChallengeModal}>
              Keep in background
            </Button>
          </>
        }
      >
        <ChallengeDetails challenge={activeOutgoingChallenge} />
      </ChallengeDialog>
    );
  }

  const isRoom = activeIncomingChallenge.mode === "GROUP_FFA";
  return (
    <ChallengeDialog
      open
      blockDismiss
      title={isRoom ? "Room invite" : "Friend match request"}
      description={`${activeIncomingChallenge.challengerUsername}${isRoom ? " invited you to join a room." : " challenged you."}`}
      opponent={activeIncomingChallenge.challengerUsername}
      footer={
        <>
          <Button variant="secondary" disabled={actionLoading} onClick={handleReject}>
            Reject
          </Button>
          <Button variant="primary" disabled={actionLoading} onClick={handleAccept}>
            Accept
          </Button>
        </>
      }
    >
      <ChallengeDetails challenge={activeIncomingChallenge} />
      <div className="mt-4 grid gap-2 border-t border-border pt-4">
        <div className={labelCls}>Do not disturb for</div>
        <div className="flex flex-wrap gap-2">
          {[15, 30, 60].map((m) => (
            <Button key={m} size="sm" variant="secondary" disabled={actionLoading} onClick={() => handleMute(m)}>
              <VolumeX aria-hidden="true" /> {m} min
            </Button>
          ))}
        </div>
      </div>
    </ChallengeDialog>
  );
}
