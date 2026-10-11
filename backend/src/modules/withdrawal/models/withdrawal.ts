import { model } from "@medusajs/framework/utils";

/**
 * A withdrawal declaration submitted through the shop's "Vertrag widerrufen"
 * function (§ 356a BGB). `received_at` is the legally relevant receipt time.
 */
const Withdrawal = model.define("withdrawal", {
  id: model.id({ prefix: "wdr" }).primaryKey(),
  name: model.text(),
  email: model.text(),
  /** Order number as entered by the customer (e.g. "#12") */
  order_reference: model.text(),
  /** Matched order, if the reference could be resolved */
  order_id: model.text().nullable(),
  /** Withdrawn items; empty means the whole order */
  items: model.text().nullable(),
  message: model.text().nullable(),
  received_at: model.dateTime(),
});

export default Withdrawal;
