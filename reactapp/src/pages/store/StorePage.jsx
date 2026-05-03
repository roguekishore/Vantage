import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShoppingBag, Package, Swords, Flame, Zap, Palette,
  Coins, Minus, Plus, Loader2, ArrowLeft, ShieldCheck,
  Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStoredUser } from "@/services/userApi";
import { fetchStoreItems, buyItem } from "@/services/storeApi";
import useGamificationStore from "@/stores/useGamificationStore";

/* ── Category config ── */
const CATEGORIES = [
  { key: "ALL",           label: "All",      icon: ShoppingBag },
  { key: "BATTLE_POWERUP",label: "Battle",   icon: Swords      },
  { key: "STREAK_POWERUP",label: "Streak",   icon: Flame       },
  { key: "BOOST",         label: "Boosts",   icon: Zap         },
  { key: "COSMETIC",      label: "Cosmetic", icon: Palette     },
];

/* ── Per-type accent ── */
const TYPE_ACCENT = {
  BATTLE_POWERUP: { color: "#f87171", bg: "rgba(248,113,113,0.08)",  border: "rgba(248,113,113,0.18)", glow: "rgba(248,113,113,0.2)"  },
  STREAK_POWERUP: { color: "#fb923c", bg: "rgba(251,146,60,0.08)",   border: "rgba(251,146,60,0.18)",  glow: "rgba(251,146,60,0.2)"   },
  BOOST:          { color: "#60a5fa", bg: "rgba(96,165,250,0.08)",   border: "rgba(96,165,250,0.18)",  glow: "rgba(96,165,250,0.2)"   },
  COSMETIC:       { color: "#c4b5fd", bg: "rgba(196,181,253,0.08)",  border: "rgba(196,181,253,0.18)", glow: "rgba(196,181,253,0.2)"  },
};
const getAccent = (type) => TYPE_ACCENT[type] || TYPE_ACCENT.COSMETIC;

/* ═══════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════ */
const StorePage = () => {
  const navigate = useNavigate();
  const user     = getStoredUser();

  const [items, setItems]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [buyingId, setBuyingId]         = useState(null);
  const [buyQuantities, setBuyQuantities] = useState({});
  const [toast, setToast]               = useState(null);

  const stats     = useGamificationStore(s => s.stats);
  const loadStats = useGamificationStore(s => s.loadStats);
  const coins     = stats?.coins ?? 0;

  useEffect(() => { loadStore(); }, []); // eslint-disable-line

  async function loadStore(silent = false) {
    if (!silent) setLoading(true);
    try {
      const data = await fetchStoreItems(user?.uid);
      setItems(data);
    } catch (err) {
      console.warn("Failed to load store:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  const filteredItems = useMemo(
    () => activeCategory === "ALL" ? items : items.filter(i => i.type === activeCategory),
    [items, activeCategory]
  );

  const getQty = (id) => buyQuantities[id] || 1;
  const setQty = (id, val) => setBuyQuantities(prev => ({ ...prev, [id]: Math.max(1, val) }));

  async function handleBuy(item) {
    if (!user?.uid) { navigate("/login"); return; }
    const qty = getQty(item.id);
    setBuyingId(item.id);
    try {
      const result = await buyItem(user.uid, item.id, qty);
      await Promise.all([loadStore(true), loadStats(user.uid)]);
      showToast(`${result.quantityBought}× ${result.itemName} purchased - ${result.coinsSpent} coins`, "success");
      setBuyQuantities(prev => ({ ...prev, [item.id]: 1 }));
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBuyingId(null);
    }
  }

  function showToast(message, type) {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-zinc-600" size={24} />
          <p className="text-sm text-zinc-600">Loading store…</p>
        </div>
      </div>
    );
  }

  /* ── Counts per category ── */
  const countFor = (key) => key === "ALL" ? items.length : items.filter(i => i.type === key).length;

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-16 px-4 sm:px-6">
      <main className="max-w-5xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl flex items-center justify-center border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-white hover:border-zinc-700 transition-all"
            >
              <ArrowLeft size={15} />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Vantage</p>
              <h1 className="text-3xl font-black tracking-tight text-white">Store</h1>
              <p className="text-sm text-zinc-500 mt-0.5">Spend coins on powerups and items.</p>
            </div>
          </div>

          {/* Right: inventory link + coin balance */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/inventory"
              className="flex items-center gap-2 h-9 px-4 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-500 hover:text-white hover:border-zinc-700 transition-all"
            >
              <Package size={13} />
              Inventory
            </Link>

            {/* Coin balance */}
            <div className="flex items-center gap-2 h-9 px-4 rounded-xl border border-zinc-800 bg-zinc-900">
              <Coins size={13} className="text-amber-400" />
              <span className="text-sm font-black tabular-nums text-white">{coins.toLocaleString()}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">coins</span>
            </div>
          </div>
        </div>

        {/* ── Category tabs ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 flex gap-1 overflow-x-auto">
          {CATEGORIES.map(({ key, label, icon: Icon }) => {
            const isActive = activeCategory === key;
            const cnt      = countFor(key);
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={cn(
                  "flex-1 min-w-fit flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  isActive ? "bg-zinc-800 text-white" : "text-zinc-600 hover:text-zinc-300"
                )}
              >
                <Icon size={12} />
                {label}
                <span className={cn("tabular-nums", isActive ? "text-zinc-400" : "text-zinc-700")}>({cnt})</span>
              </button>
            );
          })}
        </div>

        {/* ── Empty state ── */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 gap-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-zinc-600" />
            </div>
            <p className="text-sm font-semibold text-zinc-400">No items in this category</p>
          </div>
        ) : (

          /* ── Items grid ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => {
              const a          = getAccent(item.type);
              const qty        = getQty(item.id);
              const totalCost  = item.cost * qty;
              const canAfford  = coins >= totalCost;
              const atMax      = item.maxOwnable > 0 && item.owned + qty > item.maxOwnable;
              const isBuying   = buyingId === item.id;
              const owned      = item.owned > 0;

              return (
                <div
                  key={item.id}
                  className="relative bg-zinc-900 rounded-2xl overflow-hidden flex flex-col"
                  style={{ border: `1px solid ${owned ? a.border : "rgba(255,255,255,0.06)"}` }}
                >
                  {/* Owned - top accent strip */}
                  {owned && (
                    <div className="absolute top-0 left-0 right-0 h-px" style={{ background: a.color }} />
                  )}

                  {/* Card body */}
                  <div className="p-5 flex-1 flex flex-col gap-4">

                    {/* Top row: icon + owned badge */}
                    <div className="flex items-start justify-between gap-3">
                      {/* Icon */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{ background: a.bg, border: `1px solid ${a.border}`, boxShadow: owned ? `0 4px 16px ${a.glow}` : "none" }}
                      >
                        {item.iconUrl || "📦"}
                      </div>

                      {/* Owned badge */}
                      {owned && (
                        <div
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black shrink-0"
                          style={{ background: `${a.color}15`, border: `1px solid ${a.border}`, color: a.color }}
                        >
                          <ShieldCheck size={10} />
                          {item.owned} owned
                        </div>
                      )}
                    </div>

                    {/* Name + type */}
                    <div>
                      <h3 className="text-sm font-black text-white leading-tight">{item.name}</h3>
                      <span
                        className="text-[9px] font-black uppercase tracking-widest mt-1 inline-block"
                        style={{ color: a.color }}
                      >
                        {item.type.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs leading-relaxed text-zinc-500 flex-1">{item.description}</p>

                    {/* Max info */}
                    {item.maxOwnable > 0 && (
                      <p className="text-[10px] text-zinc-700 tabular-nums">
                        Limit: {item.maxOwnable} · You own: {item.owned}
                      </p>
                    )}
                  </div>

                  {/* Purchase row - bottom docked */}
                  <div
                    className="px-5 py-3.5 flex items-center justify-between gap-3"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}
                  >
                    {/* Cost */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Coins size={13} className="text-amber-400" />
                      <span className="text-sm font-black tabular-nums text-amber-400">{totalCost.toLocaleString()}</span>
                    </div>

                    {/* Qty + Buy */}
                    <div className="flex items-center gap-2">
                      {/* Quantity stepper */}
                      <div
                        className="flex items-center gap-1 rounded-xl px-1.5 py-1"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        <button
                          onClick={() => setQty(item.id, qty - 1)}
                          disabled={qty <= 1}
                          className="w-5 h-5 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-25 transition-colors"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="text-xs font-black tabular-nums text-white w-5 text-center">{qty}</span>
                        <button
                          onClick={() => setQty(item.id, qty + 1)}
                          disabled={item.maxOwnable > 0 && item.owned + qty + 1 > item.maxOwnable}
                          className="w-5 h-5 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-25 transition-colors"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      {/* Buy button */}
                      <button
                        onClick={() => handleBuy(item)}
                        disabled={!canAfford || atMax || isBuying || !user}
                        className={cn(
                          "h-8 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all",
                          canAfford && !atMax && user
                            ? "bg-primary text-primary-foreground hover:opacity-90"
                            : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                        )}
                      >
                        {isBuying ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : atMax ? (
                          "Max"
                        ) : !user ? (
                          "Sign in"
                        ) : !canAfford ? (
                          <>
                            <Coins size={11} /> {(totalCost - coins).toLocaleString()} short
                          </>
                        ) : (
                          "Buy"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* ── Toast ── */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-bold transition-all",
            "shadow-2xl"
          )}
          style={toast.type === "success"
            ? { background: "rgba(10,10,13,0.97)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399", backdropFilter: "blur(16px)" }
            : { background: "rgba(10,10,13,0.97)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", backdropFilter: "blur(16px)" }
          }
        >
          {toast.type === "success"
            ? <Check size={15} />
            : <X size={15} />
          }
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default StorePage;