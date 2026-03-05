import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShoppingBag, Package, Swords, Flame, Zap, Palette,
  Coins, Minus, Plus, Loader2, ArrowLeft, ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStoredUser } from "@/services/userApi";
import { fetchStoreItems, buyItem } from "@/services/storeApi";
import useGamificationStore from "@/stores/useGamificationStore";

/* ── Category config ── */
const CATEGORIES = [
  { key: "ALL", label: "All", icon: ShoppingBag },
  { key: "BATTLE_POWERUP", label: "Battle", icon: Swords },
  { key: "STREAK_POWERUP", label: "Streak", icon: Flame },
  { key: "BOOST", label: "Boosts", icon: Zap },
  { key: "COSMETIC", label: "Cosmetic", icon: Palette },
];

/* ── Type-based color config ── */
const TYPE_COLORS = {
  BATTLE_POWERUP: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-500" },
  STREAK_POWERUP: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-500" },
  BOOST: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-500" },
  COSMETIC: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-500" },
};

const StorePage = () => {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [buyingId, setBuyingId] = useState(null);
  const [buyQuantities, setBuyQuantities] = useState({});
  const [toast, setToast] = useState(null);

  const stats = useGamificationStore((s) => s.stats);
  const loadStats = useGamificationStore((s) => s.loadStats);

  const coins = stats?.coins ?? 0;

  useEffect(() => {
    loadStore();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // silent=true skips the full-page spinner (used for post-buy refresh)
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

  function getQty(itemId) {
    return buyQuantities[itemId] || 1;
  }

  function setQty(itemId, val) {
    setBuyQuantities(prev => ({ ...prev, [itemId]: Math.max(1, val) }));
  }

  async function handleBuy(item) {
    if (!user?.uid) {
      navigate("/login");
      return;
    }
    const qty = getQty(item.id);
    setBuyingId(item.id);
    try {
      const result = await buyItem(user.uid, item.id, qty);
      // Refresh store (to update owned counts) and global stats (to update coins).
      // silent=true prevents the full-page spinner from firing during the refresh.
      await Promise.all([loadStore(true), loadStats(user.uid)]);
      showToast(`Bought ${result.quantityBought}× ${result.itemName}! -${result.coinsSpent} coins`, "success");
      // Reset qty selector
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 md:pt-28 pb-12 px-4 sm:px-6">
      <main className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-foreground">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2 text-foreground">
                Store
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Spend coins on powerups and items
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/inventory"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <Package size={14} />
              Inventory
            </Link>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border/50">
              <Coins size={14} className="text-amber-500" />
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {coins.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/50 overflow-x-auto">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  isActive
                    ? "bg-background shadow-sm text-foreground border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={13} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
            <p>No items in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => {
              const colors = TYPE_COLORS[item.type] || TYPE_COLORS.COSMETIC;
              const qty = getQty(item.id);
              const totalCost = item.cost * qty;
              const canAfford = coins >= totalCost;
              const atMax = item.maxOwnable > 0 && item.owned + qty > item.maxOwnable;
              const isBuying = buyingId === item.id;

              return (
                <Card key={item.id} className={cn("relative overflow-hidden transition-all hover:shadow-md border-border/50")}>
                  {/* Owned badge */}
                  {item.owned > 0 && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <ShieldCheck size={10} />
                        Owned: {item.owned}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className={cn("w-12 h-12 rounded-xl grid place-items-center text-2xl", colors.bg)}>
                      {item.iconUrl || "📦"}
                    </div>
                    <CardTitle className="text-sm font-medium mt-2">{item.name}</CardTitle>
                    <Badge variant="outline" className={cn("w-fit text-[10px]", colors.text)}>
                      {item.type.replace(/_/g, " ")}
                    </Badge>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>

                    {/* Max info */}
                    {item.maxOwnable > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        Max: {item.maxOwnable} • You have: {item.owned}
                      </p>
                    )}

                    {/* Price + Quantity + Buy */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
                        <Coins size={14} className="text-amber-500" />
                        <span className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">
                          {item.cost}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Quantity selector */}
                        <div className="flex items-center gap-1 bg-muted/50 rounded-lg px-1 py-0.5">
                          <button
                            onClick={() => setQty(item.id, qty - 1)}
                            disabled={qty <= 1}
                            className="p-0.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold tabular-nums w-5 text-center">{qty}</span>
                          <button
                            onClick={() => setQty(item.id, qty + 1)}
                            disabled={item.maxOwnable > 0 && item.owned + qty + 1 > item.maxOwnable}
                            className="p-0.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Buy button */}
                        <button
                          onClick={() => handleBuy(item)}
                          disabled={!canAfford || atMax || isBuying || !user}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            canAfford && !atMax
                              ? "bg-foreground text-background hover:opacity-90"
                              : "bg-muted text-muted-foreground cursor-not-allowed"
                          )}
                        >
                          {isBuying ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : atMax ? (
                            "Max"
                          ) : !canAfford ? (
                            "Need " + (totalCost - coins)
                          ) : qty > 1 ? (
                            `Buy (${totalCost})`
                          ) : (
                            "Buy"
                          )}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all animate-in slide-in-from-bottom-4",
          toast.type === "success"
            ? "bg-card border-emerald-500/20 text-emerald-500"
            : "bg-card border-red-500/20 text-red-500"
        )}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default StorePage;
