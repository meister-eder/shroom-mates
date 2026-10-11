import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { writeFileSync } from "fs";
import { orderPlacedEmail, shipmentEmail, shopNewOrderEmail, dhlTrackingUrl, type OrderForEmail } from "../lib/emails";
import { ORDER_EMAIL_FIELDS } from "../subscribers/order-placed";

// Dev helper: renders the emails for the latest order into OUT_DIR for review.
export default async function preview({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data: [order] } = await query.graph({ entity: "order", fields: ORDER_EMAIL_FIELDS, pagination: { order: { created_at: "DESC" }, take: 1 } });
  const o = order as unknown as OrderForEmail;
  const out = process.env.OUT_DIR || ".";
  const mails = {
    "order-placed": orderPlacedEmail(o),
    "shop-new-order": shopNewOrderEmail(o, "https://api.example.test"),
    "shipment": shipmentEmail(o, [{ number: "00340434161094042557", url: dhlTrackingUrl("00340434161094042557") }]),
  };
  for (const [name, m] of Object.entries(mails)) {
    writeFileSync(`${out}/${name}.html`, m.html);
    writeFileSync(`${out}/${name}.txt`, `Subject: ${m.subject}\n\n${m.text}`);
  }
  console.log("totals", { item: o.item_total, ship: o.shipping_total, tax: o.tax_total, total: o.total });
}
