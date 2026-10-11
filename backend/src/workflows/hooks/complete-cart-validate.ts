import { completeCartWorkflow } from "@medusajs/medusa/core-flows";
import { MedusaError } from "@medusajs/framework/utils";

// Medusa completes zero-total carts without a payment session, so an empty
// cart would become a 0,00 € order. Never allow that.
completeCartWorkflow.hooks.validate(async ({ cart }) => {
  if (!cart.items?.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Cannot complete a cart without items.",
    );
  }
});
