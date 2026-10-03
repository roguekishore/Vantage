import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Package, ShoppingBag, Swords, Flame, Zap, Palette,
  ArrowLeft, Coins,
} from "lucide-react";
import {
  PageShell,
  PageHeader,
  Panel,
  Badge,
  Button,
  Stat,
  EmptyState,
  ErrorState,
  OfflineState,
  PageLoader,
} from "@/components/ds";
import { getStoredUser } from "@/services/userApi";
import { fetchInventory } from "@/services/storeApi";
import useGamificationStore from "@/stores/useGamificationStore";

/* ── Type icon + label config (the API's iconUrl is an emoji; not rendered) ── */
const TYPE_META = {
  BATTLE_POWERUP: { icon: Swords,  label: "Usable in battles (coming soon)" },
  STREAK_POWERUP: { icon: Flame,   label: "Auto-activated when needed" },
  BOOST:          { icon: Zap,     label: "Activate to boost rewards" },
  COSMETIC:       { icon: Palette, label: "Visual customization" },
};

/* fetch() rejects with a TypeError when the API is unreachable. */
const isOffline = (err) => err instanceof TypeError;

const InventoryPage = () => {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Read-only: App.jsx loads the stats on sign-in; the balance shows once they exist.
  const stats = useGamificationStore(s => s.stats);

  useEffect(() => {
    if (!user?.uid) {
      navigate("/login");
      return;
    }
    loadInventory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadInventory() {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchInventory(user.uid);
      setInventory(data);
    } catch (err) {
      console.warn("Failed to load inventory:", err);
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <PageLoader label="LOADING_INVENTORY_" />;
  }

  const header = (
    <PageHeader
      breadcrumb={
        <Button variant="ghost" size="sm" className="justify-self-start" onClick={() => navigate(-1)}>
          <ArrowLeft aria-hidden="true" />
          Back
        </Button>
      }
      title="Inventory"
      description="Items you own: powerups, boosts and more."
      actions={
        <>
          {stats && (
            <Stat
              label="Balance"
              className="mr-4"
              value={
                <span className="inline-flex items-center gap-2">
                  <Coins size={20} strokeWidth={1.5} aria-hidden="true" className="text-accent-ink" />
                  {(stats.coins ?? 0).toLocaleString()}
                  <span className="sr-only">coins</span>
                </span>
              }
            />
          )}
          <Button variant="secondary" asChild>
            <Link to="/store">
              <ShoppingBag aria-hidden="true" />
              Store
            </Link>
          </Button>
        </>
      }
    />
  );

  return (
    <PageShell>
      {header}

      {loadError ? (
        /* API failure */
        isOffline(loadError) ? (
          <OfflineState onRetry={loadInventory} />
        ) : (
          <ErrorState
            title="Couldn't load your inventory"
            description={loadError.message}
            onRetry={loadInventory}
          />
        )
      ) : inventory.length === 0 ? (
        /* Empty state */
        <EmptyState
          icon={Package}
          title="Your inventory is empty"
          description="Items you buy in the store show up here."
          action={
            <Button variant="primary" asChild>
              <Link to="/store">
                <ShoppingBag aria-hidden="true" />
                Browse store
              </Link>
            </Button>
          }
        />
      ) : (
        <>
        <Panel as="section" aria-label="Inventory summary" padded={false} className="mb-6 grid grid-cols-2 divide-x divide-border">
          <Stat label="Distinct items" className="p-4" value={<span className="tabular-nums">{inventory.length}</span>} />
          <Stat label="Total units" className="p-4" value={<span className="tabular-nums">{inventory.reduce((n, i) => n + (i.quantity || 0), 0)}</span>} />
        </Panel>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inventory.map(item => {
            const meta = TYPE_META[item.type] || TYPE_META.COSMETIC;
            const Icon = TYPE_META[item.type]?.icon || Package;
            return (
              <li key={item.id} className="flex">
                <Panel as="article" padded={false} className="flex w-full flex-col" aria-label={item.name}>
                  {/* Card body */}
                  <div className="flex flex-1 flex-col gap-4 p-4">
                    {/* Top row: icon + quantity */}
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-10 shrink-0 place-items-center border border-border bg-elevated text-fg">
                        <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                      </span>
                      <Badge tone="outline">
                        <span className="sr-only">Quantity </span>×{item.quantity}
                      </Badge>
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
                  </div>

                  {/* Usage row - bottom docked */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
                    <span className="font-mono text-small text-fg">{meta.label}</span>
                    {item.lastUsedAt && (
                      <span className="font-mono text-micro uppercase tabular-nums text-fg-dim">
                        Last used {new Date(item.lastUsedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Panel>
              </li>
            );
          })}
        </ul>
        </>
      )}
    </PageShell>
  );
};

export default InventoryPage;
