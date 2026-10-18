import { z } from "@medusajs/framework/zod";

// The customer's confirmation email repeats these fields. A withdrawal never
// needs a link, so refuse them: the endpoint must not become a way to send
// links from the shop's domain to arbitrary addresses.
const LINK_RE = /https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,}\//i;
const noLinks = (value: string) => !LINK_RE.test(value);
const NO_LINKS = "Bitte keine Links angeben.";

const text = (min: number, max: number) =>
  z.string().trim().min(min).max(max).refine(noLinks, { message: NO_LINKS });

// § 356a Abs. 2 BGB: only name, contract identification and an email for the
// confirmation may be required. Everything else is optional.
export const CreateWithdrawalSchema = z.object({
  name: text(1, 200),
  email: z.string().trim().email().max(320),
  // Order numbers are numeric ("#12", "12"); free text would end up in the
  // confirmation's subject line.
  order_reference: z
    .string()
    .trim()
    .regex(/^#?\s*\d{1,10}$/, { message: "Bitte die Bestellnummer angeben, z. B. #12." }),
  items: text(0, 1000).optional(),
  message: text(0, 2000).optional(),
});

export type CreateWithdrawalBody = z.infer<typeof CreateWithdrawalSchema>;
