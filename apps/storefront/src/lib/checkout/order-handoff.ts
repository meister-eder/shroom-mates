import type { StoreOrder } from "@medusajs/types";

// The order returned by cart completion is passed to the confirmation page
// via sessionStorage, since guests can't re-fetch it from the store API.
const ORDER_KEY = "medusa_order";

export function goToOrderConfirmation(countryCode: string, order: StoreOrder) {
  try {
    sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch {
    // Storage unavailable — the confirmation page falls back to the ID only.
  }
  window.location.href = `/${countryCode}/order/${order.id}`;
}

export function takeConfirmedOrder(orderId: string): StoreOrder | null {
  try {
    const raw = sessionStorage.getItem(ORDER_KEY);
    if (!raw) return null;
    const order: StoreOrder = JSON.parse(raw);
    if (order.id !== orderId) return null;
    sessionStorage.removeItem(ORDER_KEY);
    return order;
  } catch {
    return null;
  }
}
