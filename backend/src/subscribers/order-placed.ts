import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  type OrderForEmail,
  orderPlacedEmail,
  shopNewOrderEmail,
} from "../lib/emails";

export const ORDER_EMAIL_FIELDS = [
  "id",
  "display_id",
  "email",
  "currency_code",
  "item_total",
  "shipping_total",
  "tax_total",
  "discount_total",
  "total",
  "items.*",
  "shipping_address.*",
  "shipping_methods.*",
];

/** Order confirmation to the customer + "new order" mail to the shop. */
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const notifications = container.resolve(Modules.NOTIFICATION);

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: ORDER_EMAIL_FIELDS,
    filters: { id: data.id },
  });

  if (!order) {
    logger.warn(`order.placed: order ${data.id} not found, no emails sent`);
    return;
  }

  const emailOrder = order as unknown as OrderForEmail;
  const shopEmail = process.env.SHOP_NOTIFICATION_EMAIL || "hey@shroom-mates.de";
  const adminUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";

  const toSend = [
    ...(order.email
      ? [
          {
            to: order.email,
            channel: "email",
            template: "order-placed",
            content: orderPlacedEmail(emailOrder),
            data: { order_id: order.id },
          },
        ]
      : []),
    {
      to: shopEmail,
      channel: "email",
      template: "shop-new-order",
      content: shopNewOrderEmail(emailOrder, adminUrl),
      data: { order_id: order.id },
    },
  ];

  await notifications.createNotifications(toSend);
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
