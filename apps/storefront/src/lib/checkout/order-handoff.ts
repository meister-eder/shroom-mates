import type { StoreOrder } from "@medusajs/types";

/** Navigate to the confirmation page; it loads the order server-side. */
export function goToOrderConfirmation(countryCode: string, order: StoreOrder) {
  window.location.href = `/${countryCode}/order/${order.id}`;
}
