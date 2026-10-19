import type { StoreOrder } from "@medusajs/types";

/** Navigate to the confirmation page; it loads the order server-side. */
export function goToOrderConfirmation(order: StoreOrder) {
  window.location.href = `/shop/order/${order.id}/`;
}
