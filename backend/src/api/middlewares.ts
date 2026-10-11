import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http";
import { CreateWithdrawalSchema } from "./store/withdrawals/validators";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/withdrawals",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateWithdrawalSchema)],
    },
  ],
});
