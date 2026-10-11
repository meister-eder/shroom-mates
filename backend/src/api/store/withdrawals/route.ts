import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { shopWithdrawalEmail, withdrawalReceivedEmail } from "../../../lib/emails";
import { WITHDRAWAL_MODULE } from "../../../modules/withdrawal";
import type WithdrawalModuleService from "../../../modules/withdrawal/service";
import type { CreateWithdrawalBody } from "./validators";

/**
 * "Vertrag widerrufen" (§ 356a BGB): store the declaration with its receipt
 * time and immediately send the confirmation on a durable medium (email).
 * Declarations are accepted even if the order number can't be matched.
 */
export async function POST(
  req: MedusaRequest<CreateWithdrawalBody>,
  res: MedusaResponse,
) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const withdrawals: WithdrawalModuleService = req.scope.resolve(WITHDRAWAL_MODULE);
  const notifications = req.scope.resolve(Modules.NOTIFICATION);

  const body = req.validatedBody;
  const receivedAt = new Date();

  // "#12", "12" → display_id 12; only link the order if the email matches.
  let orderId: string | null = null;
  const displayId = Number(body.order_reference.replace(/[^\d]/g, ""));
  if (Number.isInteger(displayId) && displayId > 0) {
    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: ["id", "email"],
      filters: { display_id: displayId },
    });
    if (order && order.email?.toLowerCase() === body.email.toLowerCase()) {
      orderId = order.id;
    }
  }

  const withdrawal = await withdrawals.createWithdrawals({
    name: body.name,
    email: body.email,
    order_reference: body.order_reference,
    order_id: orderId,
    items: body.items || null,
    message: body.message || null,
    received_at: receivedAt,
  });

  const forEmail = { ...withdrawal, received_at: receivedAt };
  const adminUrl = orderId
    ? `${(process.env.MEDUSA_BACKEND_URL || "").replace(/\/+$/, "")}/app/orders/${orderId}`
    : undefined;

  try {
    await notifications.createNotifications([
      {
        to: body.email,
        channel: "email",
        template: "withdrawal-received",
        content: withdrawalReceivedEmail(forEmail),
        data: { withdrawal_id: withdrawal.id },
      },
      {
        to: process.env.SHOP_NOTIFICATION_EMAIL || "hey@shroom-mates.de",
        channel: "email",
        template: "shop-withdrawal",
        content: shopWithdrawalEmail(forEmail, adminUrl),
        data: { withdrawal_id: withdrawal.id },
      },
    ]);
  } catch (error) {
    // The declaration is stored either way; the shop can resend manually.
    logger.error(`Withdrawal ${withdrawal.id}: confirmation email failed: ${error}`);
  }

  res.status(201).json({
    withdrawal: { id: withdrawal.id, received_at: receivedAt.toISOString() },
  });
}
