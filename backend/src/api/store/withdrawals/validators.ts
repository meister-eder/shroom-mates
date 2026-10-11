import { z } from "@medusajs/framework/zod";

// § 356a Abs. 2 BGB: only name, contract identification and an email for the
// confirmation may be required. Everything else is optional.
export const CreateWithdrawalSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  order_reference: z.string().trim().min(1).max(50),
  items: z.string().trim().max(1000).optional(),
  message: z.string().trim().max(2000).optional(),
});

export type CreateWithdrawalBody = z.infer<typeof CreateWithdrawalSchema>;
