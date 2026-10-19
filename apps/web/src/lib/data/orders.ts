import { sdk } from "@lib/sdk";

const ORDER_FIELDS =
  "*items,*shipping_address,*billing_address,*shipping_methods,*payment_collections.payment_sessions";

/** Order for the confirmation page, or null if the ID doesn't exist. */
export const retrieveOrder = async (orderId: string) => {
  try {
    const { order } = await sdk.store.order.retrieve(orderId, {
      fields: ORDER_FIELDS,
    });
    return order;
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null;
    console.error(error);
    throw new Error("Failed to fetch order");
  }
};
