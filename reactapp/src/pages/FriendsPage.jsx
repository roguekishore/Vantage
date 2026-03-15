import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Clock, Search, Swords, UserPlus, UserRoundX, Users, X, Activity, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useFriendsStore from "@/stores/useFriendsStore";
import useUserStore from "@/stores/useUserStore";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

function RelationBadge({ status }) {
  const map = {
    FRIEND: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    REQUEST_SENT: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    REQUEST_RECEIVED: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    NONE: "bg-foreground/5 text-muted-foreground border-border",
  };
  return (
    <span className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md border ${map[status] || map.NONE}`}>
      {status === "REQUEST_SENT" ? "Requested" : status === "REQUEST_RECEIVED" ? "Pending action" : status}
    </span>
  );
}

export default function FriendsPage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  const {
    friends,
    incomingRequests,
    outgoingRequests,
    friendsPresence,
    searchResults,
    searchPage,
    searchTotalPages,
    loadingOverview,
    loadingSearch,
    actionLoading,
    error,
    loadOverview,
    loadFriendsPresence,
    searchUsers,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    sendChallenge,
  } = useFriendsStore();

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("friends");
  const [challengeTarget, setChallengeTarget] = useState(null);
  const [challengeMode, setChallengeMode] = useState("CASUAL_1V1");
  const [challengeDifficulty, setChallengeDifficulty] = useState("MEDIUM");
  const [challengeProblemCount, setChallengeProblemCount] = useState(2);

  useEffect(() => {
    loadOverview();
    loadFriendsPresence();
  }, [loadOverview, loadFriendsPresence]);

  useEffect(() => {
    if (!query.trim()) return;
    const handle = setTimeout(() => {
      searchUsers(query, 0, PAGE_SIZE);
    }, 300);
    return () => clearTimeout(handle);
  }, [query, searchUsers]);

  const hasSearchQuery = query.trim().length > 0;

  const canPrev = searchPage > 0;
  const canNext = useMemo(() => searchPage + 1 < searchTotalPages, [searchPage, searchTotalPages]);

  const closeChallengeModal = () => setChallengeTarget(null);

  const submitChallenge = async () => {
    if (!challengeTarget?.uid) return;
    const res = await sendChallenge({
      targetUserId: challengeTarget.uid,
      mode: challengeMode,
      difficulty: challengeDifficulty,
      problemCount: challengeProblemCount,
    });
    if (res?.ok) closeChallengeModal();
  };

  const onlineFriendsCount = useMemo(() => {
    return friends.filter(f => friendsPresence?.[f.uid]?.online).length;
  }, [friends, friendsPresence]);

  if (!user?.uid) {
    return (
      <div className="battle-page min-h-screen bg-background flex items-center justify-center p-4">
        <div className="battle-card p-12 text-center space-y-6 max-w-sm w-full battle-fade-up">
          <div className="w-16 h-16 rounded-2xl bg-foreground/5 dark:bg-white/5 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Sign in to Socialize</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Connect with other players and challenge them.
            </p>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="w-full h-11 font-semibold rounded-xl bg-foreground text-background dark:bg-white dark:text-black hover:opacity-90 transition-all"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="battle-page min-h-screen bg-background pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="battle-fade-up">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 group"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                <Users className="w-8 h-8 text-[#5542FF]" /> Social Hub
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Manage your friends, pending requests, and send challenges.</p>
            </div>

            {/* Stats Strip */}
            <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card divide-x divide-border/60 overflow-hidden shrink-0 shadow-sm">
              <div className="px-5 py-3 flex flex-col items-center">
                <div className="text-lg font-black tabular-nums leading-none text-foreground">{friends.length}</div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1.5 flex items-center gap-1">
                  <UserCheck size={10} /> Friends
                </div>
              </div>
              <div className="px-5 py-3 flex flex-col items-center">
                <div className="text-lg font-black tabular-nums leading-none text-emerald-600 dark:text-emerald-400">{onlineFriendsCount}</div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1.5 flex items-center gap-1">
                  <Activity size={10} /> Online
                </div>
              </div>
              <div className="px-5 py-3 flex flex-col items-center">
                <div className="text-lg font-black tabular-nums leading-none text-blue-600 dark:text-blue-400">{incomingRequests.length}</div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1.5 flex items-center gap-1">
                  <Clock size={10} /> Pending
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="battle-fade-up battle-fade-up-delay-1 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2 font-medium">
            <X size={16} /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Search */}
          <section className="lg:col-span-1 space-y-4 battle-fade-up battle-fade-up-delay-1">
            <div className="battle-card p-5 space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#5542FF]/10 flex items-center justify-center">
                  <Search className="w-4 h-4 text-[#5542FF]" />
                </div>
                <h2 className="text-sm font-bold text-foreground tracking-tight">Find Players</h2>
              </div>
              
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by username..."
                  className="w-full h-11 rounded-xl border border-border bg-background px-4 text-sm font-medium outline-none transition-colors focus:border-[#5542FF] focus:ring-1 focus:ring-[#5542FF] placeholder:text-muted-foreground/60"
                />
              </div>

              <div className="space-y-2">
                {!hasSearchQuery ? (
                  <div className="py-6 text-center border-2 border-dashed border-border/50 rounded-xl">
                    <p className="text-sm text-muted-foreground">Start typing to search users.</p>
                  </div>
                ) : loadingSearch ? (
                  <div className="py-6 text-center">
                    <p className="text-sm text-muted-foreground animate-pulse">Searching the arena...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-6 text-center border-2 border-dashed border-border/50 rounded-xl">
                    <p className="text-sm text-muted-foreground">No users found.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {searchResults.map((u) => (
                      <div key={u.uid} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/50 p-3 hover:border-border transition-colors">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold truncate text-foreground">{u.username}</p>
                          <RelationBadge status={u.relationStatus} />
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-1">
                          {u.relationStatus === "NONE" && (
                            <button
                              disabled={actionLoading}
                              onClick={() => sendRequest(u.uid)}
                              className="h-8 px-3 rounded-lg text-xs font-bold bg-foreground text-background dark:bg-white dark:text-black hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 transition-all shadow-sm"
                            >
                              <UserPlus size={14} /> Add Friend
                            </button>
                          )}
                          {u.relationStatus === "REQUEST_RECEIVED" && u.pendingRequestId && (
                            <button
                              disabled={actionLoading}
                              onClick={() => acceptRequest(u.pendingRequestId)}
                              className="h-8 px-3 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1.5 transition-all shadow-sm"
                            >
                              <Check size={14} /> Accept
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {hasSearchQuery && searchResults.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <button
                    disabled={!canPrev || loadingSearch}
                    onClick={() => searchUsers(query, searchPage - 1, PAGE_SIZE)}
                    className="h-8 px-3 rounded-lg border border-border text-xs font-medium disabled:opacity-40 hover:bg-foreground/5 transition-colors"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Page {Math.max(searchPage + 1, 1)} / {Math.max(searchTotalPages, 1)}
                  </span>
                  <button
                    disabled={!canNext || loadingSearch}
                    onClick={() => searchUsers(query, searchPage + 1, PAGE_SIZE)}
                    className="h-8 px-3 rounded-lg border border-border text-xs font-medium disabled:opacity-40 hover:bg-foreground/5 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Right Column: Friends & Requests */}
          <section className="lg:col-span-2 battle-fade-up battle-fade-up-delay-2">
            <div className="battle-card p-5 h-full min-h-[500px] flex flex-col">
              
              {/* Tabs */}
              <div className="flex p-1 rounded-xl bg-foreground/5 dark:bg-white/5 w-fit mb-6">
                {[
                  { key: "friends", label: `Friends (${friends.length})` },
                  { key: "incoming", label: `Pending (${incomingRequests.length})` },
                  { key: "sent", label: `Sent (${outgoingRequests.length})` }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "px-5 py-2 rounded-lg text-sm font-semibold transition-all",
                      activeTab === tab.key
                        ? "bg-foreground text-background dark:bg-white dark:text-black shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1">
                {activeTab === "incoming" && (
                  <div>
                    {loadingOverview ? (
                      <div className="flex items-center justify-center h-32"><p className="text-sm font-medium text-muted-foreground animate-pulse">Loading requests...</p></div>
                    ) : incomingRequests.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center"><Check className="w-5 h-5 text-muted-foreground" /></div>
                        <p className="text-sm font-medium text-muted-foreground">You're all caught up!<br/>No pending friend requests.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {incomingRequests.map((req) => (
                          <div key={req.id} className="rounded-xl border border-border/60 bg-background/50 p-4 flex flex-col gap-4 hover:border-border transition-colors">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-foreground">{req.requester.username}</p>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">NEW REQUEST</span>
                            </div>
                            <div className="flex gap-2 w-full mt-auto">
                              <button
                                disabled={actionLoading}
                                onClick={() => acceptRequest(req.id)}
                                className="flex-1 h-9 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Check size={14} /> Accept
                              </button>
                              <button
                                disabled={actionLoading}
                                onClick={() => rejectRequest(req.id)}
                                className="flex-1 h-9 rounded-lg text-xs font-bold border border-border bg-background text-muted-foreground hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                              >
                                <X size={14} /> Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "sent" && (
                  <div>
                    {loadingOverview ? (
                      <div className="flex items-center justify-center h-32"><p className="text-sm font-medium text-muted-foreground animate-pulse">Loading requests...</p></div>
                    ) : outgoingRequests.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center"><UserPlus className="w-5 h-5 text-muted-foreground" /></div>
                        <p className="text-sm font-medium text-muted-foreground">No outgoing requests.<br/>Go find some challengers!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {outgoingRequests.map((req) => (
                          <div key={req.id} className="rounded-xl border border-border/60 bg-background/50 p-4 flex flex-col gap-4 hover:border-border transition-colors">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-foreground">{req.addressee.username}</p>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">PENDING</span>
                            </div>
                            <button
                              disabled={actionLoading}
                              onClick={() => cancelRequest(req.id)}
                              className="w-full h-9 mt-auto rounded-lg text-xs font-bold border border-border bg-background text-muted-foreground hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                            >
                              <UserRoundX size={14} /> Cancel Request
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "friends" && (
                  <div>
                    {loadingOverview ? (
                      <div className="flex items-center justify-center h-32"><p className="text-sm font-medium text-muted-foreground animate-pulse">Loading friends...</p></div>
                    ) : friends.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center"><Users className="w-5 h-5 text-muted-foreground" /></div>
                        <p className="text-sm font-medium text-muted-foreground">Your friends list is empty.<br/>Use the search bar to find people.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {friends.map((f) => {
                          const isOnline = !!friendsPresence?.[f.uid]?.online;
                          return (
                          <div key={f.uid} className="rounded-xl border border-border/60 bg-background/50 p-4 flex flex-col gap-4 hover:border-border transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0">
                                <span className="text-sm font-bold text-foreground truncate block">{f.username}</span>
                                <span className="text-xs font-semibold mt-1 flex items-center gap-1.5">
                                  <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-500")} />
                                  <span className={isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>{isOnline ? "Online" : "Offline"}</span>
                                </span>
                              </div>
                            </div>
                            <button
                              disabled={actionLoading || !isOnline}
                              onClick={() => setChallengeTarget(f)}
                              title={isOnline ? "Challenge friend" : "Friend is offline"}
                              className={cn(
                                "w-full h-9 mt-auto rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                                isOnline 
                                  ? "bg-[#5542FF] hover:bg-[#4a3ae0] text-white shadow-md shadow-[#5542FF]/20" 
                                  : "border border-border bg-background text-muted-foreground opacity-50 cursor-not-allowed"
                              )}
                            >
                              <Swords size={14} /> Challenge
                            </button>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Challenge Modal */}
        {challengeTarget && (
          <div className="fixed inset-0 z-[120] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md battle-card p-6 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none opacity-50 bg-gradient-to-br from-[#5542FF]/5 to-transparent" />
              
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Challenge {challengeTarget.username}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Configure your duel settings</p>
                </div>
                <button
                  onClick={closeChallengeModal}
                  className="w-8 h-8 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="relative space-y-5">
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["CASUAL_1V1", "RANKED_1V1"].map((m) => (
                      <button
                        key={m}
                        onClick={() => setChallengeMode(m)}
                        className={cn(
                          "h-10 rounded-xl text-xs font-bold border transition-all",
                          challengeMode === m
                            ? "bg-foreground text-background dark:bg-white dark:text-black border-transparent shadow-md"
                            : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                        )}
                      >
                        {m === "CASUAL_1V1" ? "Casual" : "Ranked"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Difficulty</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["EASY", "MEDIUM", "HARD"].map((d) => (
                      <button
                        key={d}
                        onClick={() => setChallengeDifficulty(d)}
                        className={cn(
                          "h-10 rounded-xl text-xs font-bold border transition-all",
                          challengeDifficulty === d
                            ? "bg-foreground text-background dark:bg-white dark:text-black border-transparent shadow-md"
                            : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Problems</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((c) => (
                      <button
                        key={c}
                        onClick={() => setChallengeProblemCount(c)}
                        className={cn(
                          "h-10 rounded-xl text-xs font-bold border transition-all",
                          challengeProblemCount === c
                            ? "bg-foreground text-background dark:bg-white dark:text-black border-transparent shadow-md"
                            : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative pt-4 flex gap-3">
                <button
                  disabled={actionLoading}
                  onClick={submitChallenge}
                  className="flex-1 h-11 rounded-xl bg-[#5542FF] hover:bg-[#4a3ae0] text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#5542FF]/20"
                >
                  <Swords size={16} /> Send Challenge
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
