const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:8080") + "/api";

/**
 * Fetch all active store items.
 * Optionally includes owned count when userId is provided.
 * Returns: StoreItemDTO[]
 */
export async function fetchStoreItems(userId) {
  const url = userId
    ? `${API_BASE}/store?userId=${userId}`
    : `${API_BASE}/store`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch store items");
  return res.json();
}

/**
 * Buy an item from the store.
 * Returns: BuyItemResponse { itemName, quantityBought, totalOwned, coinsSpent, coinsRemaining }
 */
export async function buyItem(userId, itemId, quantity = 1) {
  const res = await fetch(`${API_BASE}/store/buy?userId=${userId}`, {
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
  const res = await fetch(`${API_BASE}/inventory?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch inventory");
  return res.json();
}
