import { completeCartWorkflow } from "@medusajs/medusa/core-flows";
import { MathBN, MedusaError } from "@medusajs/framework/utils";
import { MANUAL_PROVIDER_ID, manualPaymentAllowed } from "../../lib/payment";

// Session statuses Medusa's validateCartPaymentsStep treats as processable.
const PROCESSABLE = new Set(["pending", "requires_more", "authorized", "captured"]);

type Amount = Parameters<typeof MathBN.eq>[0] | null | undefined;

/** Equal amounts (numbers, BigNumbers or raw values); missing never matches. */
const sameAmount = (a: Amount, b: Amount) => a != null && b != null && MathBN.eq(a, b);

completeCartWorkflow.hooks.validate(async ({ cart }) => {
  // Medusa completes zero-total carts without a payment session, so an empty
  // cart would become a 0,00 € order. Never allow that.
  if (!cart.items?.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Cannot complete a cart without items.",
    );
  }

  const collection = cart.payment_collection;
  const sessions = (collection?.payment_sessions ?? []).filter(
    (s) => s && PROCESSABLE.has(s.status as string),
  );
  if (!sessions.length) return;

  if (!manualPaymentAllowed() && sessions.some((s) => s.provider_id === MANUAL_PROVIDER_ID)) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Manual payment is disabled in production.",
    );
  }

  // Medusa authorizes the first session for its own amount and does not
  // compare it with the cart. Make sure the session being paid covers
  // exactly this cart, so a payment for an earlier, cheaper cart can never
  // complete a more expensive one.
  const cartTotal = (cart.raw_total ?? cart.total) as Amount;
  const currency = cart.currency_code?.toLowerCase();
  const mismatch =
    sessions.length > 1 ||
    !sameAmount((collection?.raw_amount ?? collection?.amount) as Amount, cartTotal) ||
    collection?.currency_code?.toLowerCase() !== currency ||
    sessions.some(
      (s) =>
        !sameAmount((s.raw_amount ?? s.amount) as Amount, cartTotal) ||
        s.currency_code?.toLowerCase() !== currency,
    );
  if (mismatch) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "The payment does not match the cart total. Please start the payment again.",
    );
  }
});
