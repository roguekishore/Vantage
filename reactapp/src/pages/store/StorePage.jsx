import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShoppingBag, Package, Swords, Flame, Zap, Palette,
  Coins, Minus, Plus, ArrowLeft, ShieldCheck,
} from "lucide-react";
import {
  PageShell,
  PageHeader,
  Panel,
  Badge,
  Button,
  IconButton,
  Stat,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  EmptyState,
  ErrorState,
  OfflineState,
  PageLoader,
  toast,
} from "@/components/ds";
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

/* ── Per-type lucide icon (the API's iconUrl is an emoji; not rendered) ── */
const TYPE_ICON = {
  BATTLE_POWERUP: Swords,
  STREAK_POWERUP: Flame,
  BOOST: Zap,
  COSMETIC: Palette,
};
const getTypeIcon = (type) => TYPE_ICON[type] || Package;

/* fetch() rejects with a TypeError when the API is unreachable. */
const isOffline = (err) => err instanceof TypeError;

/* ═══════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════ */
const StorePage = () => {
  const navigate = useNavigate();
  const user     = getStoredUser();

  const [items, setItems]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState(null);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [buyingId, setBuyingId]         = useState(null);
  const [buyQuantities, setBuyQuantities] = useState({});

  const stats     = useGamificationStore(s => s.stats);
  const loadStats = useGamificationStore(s => s.loadStats);
  const coins     = stats?.coins ?? 0;

  useEffect(() => { loadStore(); }, []); // eslint-disable-line

  async function loadStore(silent = false) {
    if (!silent) { setLoading(true); setLoadError(null); }
    try {
      const data = await fetchStoreItems(user?.uid);
      setItems(data);
    } catch (err) {
      console.warn("Failed to load store:", err);
      if (!silent) setLoadError(err);
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
      toast({
        tone: "ok",
        title: `Purchased ${result.quantityBought} × ${result.itemName}`,
        description: `${Number(result.coinsSpent).toLocaleString()} coins spent.`,
        duration: 3500,
      });
      setBuyQuantities(prev => ({ ...prev, [item.id]: 1 }));
    } catch (err) {
      toast({
        tone: "err",
        title: "Purchase failed",
        description: err.message && err.message !== "Purchase failed" ? err.message : undefined,
        duration: 3500,
      });
    } finally {
      setBuyingId(null);
    }
  }

  /* ── Loading ── */
  if (loading) {
    return <PageLoader label="LOADING_STORE_" />;
  }

  /* ── Counts per category ── */
  const countFor = (key) => key === "ALL" ? items.length : items.filter(i => i.type === key).length;

  const header = (
    <PageHeader
      breadcrumb={
        <Button variant="ghost" size="sm" className="justify-self-start" onClick={() => navigate(-1)}>
          <ArrowLeft aria-hidden="true" />
          Back
        </Button>
      }
      title="Store"
      description="Spend coins on powerups and items."
      actions={
        <>
          <Stat
            label="Balance"
            className="mr-4"
            value={
              <span className="inline-flex items-center gap-2">
                <Coins size={20} strokeWidth={1.5} aria-hidden="true" className="text-accent-ink" />
                {coins.toLocaleString()}
                <span className="sr-only">coins</span>
              </span>
            }
          />
          <Button variant="secondary" asChild>
            <Link to="/inventory">
              <Package aria-hidden="true" />
              Inventory
            </Link>
          </Button>
        </>
      }
    />
  );

  /* ── API failure ── */
  if (loadError) {
    return (
      <PageShell>
        {header}
        {isOffline(loadError) ? (
          <OfflineState onRetry={() => loadStore()} />
        ) : (
          <ErrorState
            title="Couldn't load the store"
            description={loadError.message}
            onRetry={() => loadStore()}
          />
        )}
      </PageShell>
    );
  }

  return (
    <PageShell>
      {header}

      {/* ── Summary strip ── */}
      <Panel as="section" aria-label="Store summary" padded={false} className="mb-6 grid grid-cols-3 divide-x divide-border">
        <Stat label="Items" className="p-4" value={<span className="tabular-nums">{items.length}</span>} />
        <Stat label="Owned" className="p-4" value={<span className="tabular-nums">{items.filter(i => i.owned > 0).length}</span>} />
        <Stat label="Affordable" className="p-4" value={<span className="tabular-nums">{items.filter(i => coins >= i.cost && !(i.maxOwnable > 0 && i.owned + 1 > i.maxOwnable)).length}</span>} />
      </Panel>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} variant="segmented" className="grid gap-6">
        {/* ── Category tabs ── */}
        <TabsList aria-label="Item category" className="justify-self-start">
          {CATEGORIES.map(({ key, label, icon: Icon }) => (
            <TabsTrigger key={key} value={key}>
              <Icon aria-hidden="true" />
              {label}
              <span className="tabular-nums opacity-70">({countFor(key)})</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory}>
          {filteredItems.length === 0 ? (
            /* ── Empty state ── */
            <EmptyState
              icon={ShoppingBag}
              title={activeCategory === "ALL" ? "The store is empty" : "No items in this category"}
              description={activeCategory === "ALL" ? "Check back later for powerups and items." : "Pick another category to see more items."}
            />
          ) : (
            /* ── Items grid ── */
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map(item => {
                const Icon       = getTypeIcon(item.type);
                const qty        = getQty(item.id);
                const totalCost  = item.cost * qty;
                const canAfford  = coins >= totalCost;
                const atMax      = item.maxOwnable > 0 && item.owned + qty > item.maxOwnable;
                const isBuying   = buyingId === item.id;
                const owned      = item.owned > 0;
                const canBuy     = canAfford && !atMax && !!user;

                return (
                  <li key={item.id} className="flex">
                    <Panel as="article" padded={false} className="flex w-full flex-col" aria-label={item.name}>
                      {/* Card body */}
                      <div className="flex flex-1 flex-col gap-4 p-4">
                        {/* Top row: icon + owned badge */}
                        <div className="flex items-start justify-between gap-3">
                          <span className="grid size-10 shrink-0 place-items-center border border-border bg-elevated text-fg">
                            <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                          </span>
                          {owned && (
                            <Badge tone="outline">
                              <ShieldCheck size={14} strokeWidth={1.5} aria-hidden="true" />
                              {item.owned} owned
                            </Badge>
                          )}
                        </div>

                        {/* Name + type */}
                        <div className="grid gap-1">
                          <h3 className="font-mono text-h3 text-fg">{item.name}</h3>
                          <span className="font-mono text-micro uppercase text-fg-muted">
                            {item.type.replace(/_/g, " ")}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="flex-1 font-mono text-small text-fg-muted">{item.description}</p>

                        {/* Max info */}
                        {item.maxOwnable > 0 && (
                          <p className="font-mono text-micro uppercase tabular-nums text-fg-dim">
                            Limit {item.maxOwnable} · You own {item.owned}
                          </p>
                        )}
                      </div>

                      {/* Purchase row - bottom docked */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
                        {/* Cost */}
                        <span className="inline-flex items-center gap-2 font-mono text-body font-bold tabular-nums text-fg">
                          <Coins size={16} strokeWidth={1.5} aria-hidden="true" className="text-accent-ink" />
                          {totalCost.toLocaleString()}
                          <span className="sr-only">coins</span>
                        </span>

                        {/* Qty + Buy */}
                        <div className="flex items-center gap-2">
                          {/* Quantity stepper */}
                          <div role="group" aria-label={`Quantity for ${item.name}`} className="flex items-center border border-border">
                            <IconButton
                              icon={Minus}
                              size="sm"
                              aria-label="Decrease quantity"
                              onClick={() => setQty(item.id, qty - 1)}
                              disabled={qty <= 1}
                            />
                            <span aria-live="polite" className="w-8 text-center font-mono text-small tabular-nums text-fg">
                              {qty}
                            </span>
                            <IconButton
                              icon={Plus}
                              size="sm"
                              aria-label="Increase quantity"
                              onClick={() => setQty(item.id, qty + 1)}
                              disabled={item.maxOwnable > 0 && item.owned + qty + 1 > item.maxOwnable}
                            />
                          </div>

                          {/* Buy button */}
                          <Button
                            variant={canBuy ? "primary" : "secondary"}
                            size="sm"
                            onClick={() => handleBuy(item)}
                            loading={isBuying}
                            disabled={!canAfford || atMax || !user}
                          >
                            {atMax ? (
                              "Max"
                            ) : !user ? (
                              "Sign in"
                            ) : !canAfford ? (
                              <span className="tabular-nums">{(totalCost - coins).toLocaleString()} short</span>
                            ) : (
                              "Buy"
                            )}
                          </Button>
                        </div>
                      </div>
                    </Panel>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
};

export default StorePage;
