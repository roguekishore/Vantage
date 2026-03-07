import { authFetch, API_BASE } from "./api";

/**
 * Fetch all active store items.
 * JWT identifies the current user for owned-count enrichment.
 */
export async function fetchStoreItems(userId) {
  const res = await authFetch(`${API_BASE}/store`);
  if (!res.ok) throw new Error("Failed to fetch store items");
  return res.json();
}

/**
 * Buy an item from the store.
 * Returns: BuyItemResponse { itemName, quantityBought, totalOwned, coinsSpent, coinsRemaining }
 */
export async function buyItem(userId, itemId, quantity = 1) {
  const res = await authFetch(`${API_BASE}/store/buy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId, quantity }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Purchase failed");
  }
  return res.json();
}

/**
 * Fetch a user's inventory.
 * Returns: InventoryItemDTO[]
 */
export async function fetchInventory(userId) {
  const res = await authFetch(`${API_BASE}/inventory`);
  if (!res.ok) throw new Error("Failed to fetch inventory");
  return res.json();
}
