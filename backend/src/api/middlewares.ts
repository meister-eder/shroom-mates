import {
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
  validateAndTransformBody,
} from "@medusajs/framework/http";
import { MANUAL_PROVIDER_ID, manualPaymentAllowed } from "../lib/payment";
import { withdrawalRateLimit } from "./store/withdrawals/rate-limit";
import { CreateWithdrawalSchema } from "./store/withdrawals/validators";

/**
 * Hide "Manuelle Zahlung (Test)" from the storefront where it is disabled, so
 * a region that still has it enabled doesn't offer a method that can't
 * complete (the complete-cart hook rejects it).
 */
function hideManualPayment(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  if (manualPaymentAllowed()) return next();
  const json = res.json.bind(res);
  res.json = (body: { payment_providers?: { id: string }[]; count?: number }) => {
    if (Array.isArray(body?.payment_providers)) {
      const providers = body.payment_providers.filter((p) => p.id !== MANUAL_PROVIDER_ID);
      const removed = body.payment_providers.length - providers.length;
      body = {
        ...body,
        payment_providers: providers,
        ...(typeof body.count === "number" && { count: body.count - removed }),
      };
    }
    return json(body);
  };
  next();
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/withdrawals",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateWithdrawalSchema), withdrawalRateLimit],
    },
    {
      matcher: "/store/payment-providers",
      method: "GET",
      middlewares: [hideManualPayment],
    },
  ],
});
