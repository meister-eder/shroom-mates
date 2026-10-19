import { completeCartWorkflow } from "@medusajs/medusa/core-flows";
import { manualPaymentAllowed } from "../../lib/payment";
import { validateCartForCompletion } from "./validate-cart-for-completion";

completeCartWorkflow.hooks.validate(async ({ cart }) => {
  validateCartForCompletion(cart, { manualAllowed: manualPaymentAllowed() });
});
