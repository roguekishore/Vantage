import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Package, ShoppingBag, Swords, Flame, Zap, Palette,
  Loader2, ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStoredUser } from "@/services/userApi";
import { fetchInventory } from "@/services/storeApi";

/* ── Type color + label config ── */
const TYPE_META = {
  BATTLE_POWERUP: { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", label: "Usable in battles (coming soon)" },
  STREAK_POWERUP: { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "Auto-activated when needed" },
  BOOST: { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "Activate to boost rewards" },
  COSMETIC: { color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", label: "Visual customization" },
};

const InventoryPage = () => {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      navigate("/login");
      return;
    }
    loadInventory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadInventory() {
    setLoading(true);
    try {
      const data = await fetchInventory(user.uid);
      setInventory(data);
    } catch (err) {
      console.warn("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
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
      <main className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                Inventory
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Items you own - powerups, boosts, and more
              </p>
            </div>
          </div>
          <Link
            to="/store"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <ShoppingBag size={14} />
            Store
          </Link>
        </div>

        {/* Empty state */}
        {inventory.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package size={48} className="mx-auto mb-3 opacity-30" />
            <p className="mb-4">Your inventory is empty</p>
            <Link
              to="/store"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <ShoppingBag size={14} />
              Browse Store
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.map(item => {
              const meta = TYPE_META[item.type] || TYPE_META.COSMETIC;
              return (
                <Card key={item.id} className={cn("relative overflow-hidden border-border/50")}>
                  {/* Quantity badge */}
                  <div className="absolute top-3 right-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full grid place-items-center text-xs font-bold",
                      meta.bg, meta.color
                    )}>
                      ×{item.quantity}
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <div className={cn("w-12 h-12 rounded-xl grid place-items-center text-2xl", meta.bg)}>
                      {item.iconUrl || "📦"}
                    </div>
                    <CardTitle className="text-sm font-medium mt-2">{item.name}</CardTitle>
                    <Badge variant="outline" className={cn("w-fit text-[10px]", meta.color)}>
                      {item.type.replace(/_/g, " ")}
                    </Badge>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                    <p className={cn("text-[10px] font-medium", meta.color)}>
                      {meta.label}
                    </p>
                    {item.lastUsedAt && (
                      <p className="text-[10px] text-muted-foreground">
                        Last used: {new Date(item.lastUsedAt).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default InventoryPage;
