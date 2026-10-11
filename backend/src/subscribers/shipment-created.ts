import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { dhlTrackingUrl, type OrderForEmail, shipmentEmail } from "../lib/emails";
import { ORDER_EMAIL_FIELDS } from "./order-placed";

/**
 * Shipping confirmation when a shipment is created in the admin
 * ("Als versendet markieren" with tracking number). `data.id` is the
 * fulfillment ID.
 */
export default async function shipmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  if (data.no_notification) return;

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const notifications = container.resolve(Modules.NOTIFICATION);

  const {
    data: [fulfillment],
  } = await query.graph({
    entity: "fulfillment",
    fields: ["id", "labels.*", ...ORDER_EMAIL_FIELDS.map((f) => `order.${f}`)],
    filters: { id: data.id },
  });

  const order = fulfillment?.order as unknown as OrderForEmail | undefined;
  if (!order?.email) {
    logger.warn(`shipment.created: no order email for fulfillment ${data.id}`);
    return;
  }

  const tracking = (fulfillment.labels ?? [])
    .filter((l) => l?.tracking_number)
    .map((l) => ({
      number: l!.tracking_number,
      // Admin requires a URL; fall back to DHL if a placeholder was entered.
      url: l!.tracking_url?.startsWith("http") ? l!.tracking_url : dhlTrackingUrl(l!.tracking_number),
    }));

  await notifications.createNotifications({
    to: order.email,
    channel: "email",
    template: "shipment-created",
    content: shipmentEmail(order, tracking),
    data: { order_id: order.id, fulfillment_id: data.id },
  });
}

export const config: SubscriberConfig = {
  event: "shipment.created",
};
