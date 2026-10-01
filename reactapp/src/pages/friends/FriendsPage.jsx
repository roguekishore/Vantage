import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Search, Swords, UserPlus, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useFriendsStore from "@/stores/useFriendsStore";
import useUserStore from "@/stores/useUserStore";
import useBattleStore from "@/stores/useBattleStore";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  ListRow,
  OfflineState,
  PageHeader,
  PageShell,
  Panel,
  Progress,
  Skeleton,
  Stat,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ds";
import { ChallengeComposeDialog } from "./FriendChallengeModal";

// cobe stays out of the main bundle: the globe loads with this page.
const Globe = lazy(() => import("@/components/ui/globe"));

/*
 * Friends: two columns from lg (friends list | requests and
 * search), collapsing to Tabs below lg. Friend rows are ListRows with a
 * square presence dot. The challenge dialog is the shared ChallengeDialog
 * from FriendChallengeModal.jsx.
 */

const PAGE_SIZE = 10;

// fetch() rejects with "Failed to fetch" / "NetworkError…" / "Load failed"
// when the server can't be reached; the store keeps only the message.
const isNetworkMessage = (msg) => /^(failed to fetch|load failed)$|networkerror/i.test(msg || "");

function useIsDesktop(query = "(min-width: 1024px)") {
  const get = () => typeof window !== "undefined" && !!window.matchMedia?.(query).matches;
  const [match, setMatch] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, [query]);
  return match;
}

function Presence({ online }) {
  return (
    <span className={`inline-flex items-center gap-2 ${online ? "text-ok" : "text-fg-muted"}`}>
      <span aria-hidden="true" className={`size-1.5 shrink-0 ${online ? "bg-ok" : "bg-fg-dim"}`} />
      {online ? "Online" : "Offline"}
    </span>
  );
}

function RowsSkeleton({ rows = 4 }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex min-h-12 items-center gap-3 border-b border-border px-4 py-2 last:border-b-0">
          <Skeleton className="size-9" />
          <div className="grid flex-1 gap-1">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FriendRow({ f, isOnline, onChallenge, actionLoading, activeBattleState }) {
  return (
    <ListRow
      leading={<Avatar name={f.username} size="md" />}
      title={f.username}
      meta={<Presence online={isOnline} />}
      trailing={
        isOnline && !activeBattleState ? (
          <Button size="sm" variant="secondary" onClick={() => onChallenge?.(f)} disabled={actionLoading} aria-label={`Challenge ${f.username}`}>
            <Swords aria-hidden="true" /> Challenge
          </Button>
        ) : (
          <Badge>Away</Badge>
        )
      }
    />
  );
}

function RequestRow({ name, meta, onAccept, onReject, onCancel, actionLoading }) {
  return (
    <ListRow
      leading={<Avatar name={name} size="md" />}
      title={name}
      meta={meta}
      trailing={
        <>
          {onAccept && (
            <IconButton icon={Check} size="sm" variant="secondary" aria-label={`Accept request from ${name}`} disabled={actionLoading} onClick={onAccept} />
          )}
          {onReject && (
            <IconButton icon={X} size="sm" variant="ghost" aria-label={`Reject request from ${name}`} disabled={actionLoading} onClick={onReject} />
          )}
          {onCancel && (
            <Button size="sm" variant="ghost" disabled={actionLoading} onClick={onCancel} aria-label={`Cancel request to ${name}`}>
              Cancel
            </Button>
          )}
        </>
      }
    />
  );
}

function SearchRow({ u, sendRequest, acceptRequest, actionLoading }) {
  return (
    <ListRow
      leading={<Avatar name={u.username} size="sm" />}
      title={u.username}
      trailing={
        <>
          {u.relationStatus === "NONE" && (
            <Button size="sm" variant="primary" disabled={actionLoading} onClick={() => sendRequest(u.uid)} aria-label={`Add ${u.username}`}>
              <UserPlus aria-hidden="true" /> Add
            </Button>
          )}
          {u.relationStatus === "FRIEND" && <Badge tone="ok">Friends</Badge>}
          {u.relationStatus === "REQUEST_SENT" && <Badge>Sent</Badge>}
          {u.relationStatus === "REQUEST_RECEIVED" && u.pendingRequestId && (
            <IconButton
              icon={Check}
              size="sm"
              variant="secondary"
              aria-label={`Accept request from ${u.username}`}
              disabled={actionLoading}
              onClick={() => acceptRequest(u.pendingRequestId)}
            />
          )}
        </>
      }
    />
  );
}

const lastRowFlush = "[&>*:last-child]:border-b-0";

export default function FriendsPage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const activeBattleState = useBattleStore((s) => s.activeBattleState);
  const isDesktop = useIsDesktop();

  const {
    friends, incomingRequests, outgoingRequests,
    friendsPresence, searchResults, searchPage, searchTotalPages,
    loadingOverview, loadingSearch, actionLoading, error,
    loadOverview, loadFriendsPresence, searchUsers,
    sendRequest, acceptRequest, rejectRequest, cancelRequest, sendChallenge,
  } = useFriendsStore();

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("incoming");
  const [mobileTab, setMobileTab] = useState("friends");
  const [challengeTarget, setChallengeTarget] = useState(null);

  useEffect(() => { loadOverview(); loadFriendsPresence(); }, [loadOverview, loadFriendsPresence]);
  useEffect(() => {
    if (!query.trim()) return;
    const h = setTimeout(() => searchUsers(query, 0, PAGE_SIZE), 300);
    return () => clearTimeout(h);
  }, [query, searchUsers]);

  const onlineFriends = useMemo(
    () => friends.filter((f) => !!friendsPresence?.[f.uid]?.online),
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

  const retryLoad = () => { loadOverview(); loadFriendsPresence(); };

  // ── NOT LOGGED IN ──
  if (!user?.uid) {
    return (
      <PageShell narrow>
        <PageHeader eyebrow="Social" title="Friends" />
        <EmptyState
          icon={Users}
          title="Sign in to see your friends"
          description="Connect with players on Vantage and challenge them to live matches."
          action={
            <Button variant="primary" onClick={() => navigate("/login")}>
              Log in
            </Button>
          }
        />
      </PageShell>
    );
  }

  // A failed overview load leaves every list empty; any other action error
  // is shown inline above the lists.
  const loadFailed = Boolean(error) && !loadingOverview && friends.length === 0 && incomingRequests.length === 0 && outgoingRequests.length === 0;

  const errorBanner = error && !loadFailed ? (
    <div role="alert" className="flex items-center gap-2 border border-err bg-err-soft px-4 py-2 font-mono text-small text-err">
      <X size={14} strokeWidth={1.5} aria-hidden="true" /> {error}
    </div>
  ) : null;

  /* ── Friends list ── */
  const friendsPanel = (
    <Panel
      as="section"
      label={`Friends (${friends.length})`}
      padded={false}
      actions={onlineFriends.length > 0 ? <Badge tone="ok">{onlineFriends.length} online</Badge> : null}
    >
      {loadingOverview ? (
        <RowsSkeleton />
      ) : loadFailed ? (
        isNetworkMessage(error) ? (
          <OfflineState className="border-0" onRetry={retryLoad} />
        ) : (
          <ErrorState className="border-0" title="Friends could not be loaded" description={error} onRetry={retryLoad} />
        )
      ) : friends.length === 0 ? (
        <EmptyState
          className="border-0"
          icon={Users}
          title="No friends yet"
          description="Search for players by username to start building your network."
        />
      ) : (
        <div className={lastRowFlush}>
          {friends.map((f) => (
            <FriendRow
              key={f.uid}
              f={f}
              isOnline={!!friendsPresence?.[f.uid]?.online}
              onChallenge={setChallengeTarget}
              actionLoading={actionLoading}
              activeBattleState={activeBattleState}
            />
          ))}
        </div>
      )}
    </Panel>
  );

  /* ── Requests ── */
  const requestsPanel = (
    <Panel as="section" label="Requests" padded={false}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList aria-label="Friend requests" className="px-4">
          <TabsTrigger value="incoming">
            Pending <span className="tabular-nums">{incomingRequests.length}</span>
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent <span className="tabular-nums">{outgoingRequests.length}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="incoming">
          {incomingRequests.length === 0 ? (
            <EmptyState className="border-0 py-8" icon={Check} title="All clear" description="No pending friend requests." />
          ) : (
            <div className={lastRowFlush}>
              {incomingRequests.map((req) => (
                <RequestRow
                  key={req.id}
                  name={req.requester.username}
                  meta="Wants to connect"
                  onAccept={() => acceptRequest(req.id)}
                  onReject={() => rejectRequest(req.id)}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="sent">
          {outgoingRequests.length === 0 ? (
            <EmptyState className="border-0 py-8" icon={UserPlus} title="No sent requests" description="Use search to find and add players." />
          ) : (
            <div className={lastRowFlush}>
              {outgoingRequests.map((req) => (
                <RequestRow
                  key={req.id}
                  name={req.addressee.username}
                  meta="Awaiting response"
                  onCancel={() => cancelRequest(req.id)}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Panel>
  );

  /* ── Search ── */
  const searchPanel = (
    <Panel as="section" label="Find players" padded={false}>
      <div className="p-4">
        <div className="relative">
          <Search size={14} strokeWidth={1.5} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-dim" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username"
            aria-label="Search players by username"
            className="pl-9"
          />
        </div>
      </div>
      {query.trim() ? (
        loadingSearch ? (
          <div className="grid gap-2 border-t border-border px-4 py-4" role="status">
            <span className="font-mono text-label uppercase text-fg-muted">Searching_</span>
            <Progress label="Searching" />
          </div>
        ) : searchResults.length === 0 ? (
          <div className="border-t border-border px-4 py-6 text-center font-mono text-small text-fg-muted">No players found.</div>
        ) : (
          <>
            <div className={`max-h-[360px] overflow-y-auto border-t border-border ${lastRowFlush}`}>
              {searchResults.map((u) => (
                <SearchRow key={u.uid} u={u} sendRequest={sendRequest} acceptRequest={acceptRequest} actionLoading={actionLoading} />
              ))}
            </div>
            {searchTotalPages > 1 && (
              <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2">
                <IconButton
                  icon={ChevronLeft}
                  size="sm"
                  aria-label="Previous page"
                  disabled={searchPage === 0 || loadingSearch}
                  onClick={() => searchUsers(query, searchPage - 1, PAGE_SIZE)}
                />
                <span className="font-mono text-small tabular-nums text-fg-muted">
                  {searchPage + 1} / {Math.max(searchTotalPages, 1)}
                </span>
                <IconButton
                  icon={ChevronRight}
                  size="sm"
                  aria-label="Next page"
                  disabled={searchPage + 1 >= searchTotalPages || loadingSearch}
                  onClick={() => searchUsers(query, searchPage + 1, PAGE_SIZE)}
                />
              </div>
            )}
          </>
        )
      ) : (
        <div className="border-t border-border px-4 py-4 font-mono text-small text-fg-muted">Type a username to find players.</div>
      )}
    </Panel>
  );

  return (
    <PageShell className="relative z-[var(--z-raised)]">
      {/* Page-corner globe: same placement and size as before, behind content */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 right-0 z-[var(--z-base)] aspect-square w-[clamp(460px,56vw,780px)] translate-x-1/4 translate-y-1/4 opacity-[var(--globe-opacity)]"
      >
        <div className="relative size-full">
          <Suspense fallback={null}>
            <Globe />
          </Suspense>
        </div>
      </div>

      <div className="relative z-[1]">
      <PageHeader
        eyebrow="Social"
        title={<>Your <em>circle</em></>}
        description="Build your coding circle. See who is online and send live challenges."
        actions={
          <>
            {onlineFriends.length > 0 && <Badge tone="ok">{onlineFriends.length} online</Badge>}
            <Button variant="secondary" onClick={() => navigate("/battle")}>
              <Swords aria-hidden="true" /> Battle arena
            </Button>
          </>
        }
      />

      <div className="grid gap-6">
        {/* Network overview */}
        <Panel as="section" label="Network" padded={false}>
          <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
            <Stat className="bg-surface p-4" label="Friends" value={friends.length} />
            <Stat className="bg-surface p-4" label="Online" value={onlineFriends.length} />
            <Stat className="bg-surface p-4" label="Pending" value={incomingRequests.length} />
            <Stat className="bg-surface p-4" label="Online rate" value={`${onlineRate}%`} />
          </div>
        </Panel>

        {errorBanner}

        {isDesktop ? (
          <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-6">
            {friendsPanel}
            <div className="grid gap-6">
              {requestsPanel}
              {searchPanel}
            </div>
          </div>
        ) : (
          <Tabs value={mobileTab} onValueChange={setMobileTab} className="grid gap-4">
            <TabsList aria-label="Friends sections">
              <TabsTrigger value="friends">Friends</TabsTrigger>
              <TabsTrigger value="requests">
                Requests <span className="tabular-nums">{incomingRequests.length}</span>
              </TabsTrigger>
              <TabsTrigger value="find">Find players</TabsTrigger>
            </TabsList>
            <TabsContent value="friends">{friendsPanel}</TabsContent>
            <TabsContent value="requests">{requestsPanel}</TabsContent>
            <TabsContent value="find">{searchPanel}</TabsContent>
          </Tabs>
        )}
      </div>
      </div>

      {challengeTarget && (
        <ChallengeComposeDialog
          target={challengeTarget}
          onClose={() => setChallengeTarget(null)}
          onSubmit={handleChallenge}
          loading={actionLoading}
        />
      )}
    </PageShell>
  );
}
