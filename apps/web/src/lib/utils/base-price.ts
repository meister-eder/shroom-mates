import { convertToLocale } from "./money";

const QUANTITY = /(\d+(?:[.,]\d+)?)\s*(ml|l|g|kg)\b/i;

/**
 * Grundpreis (§ 4 PAngV): price per 1 l or 1 kg for goods sold by volume or
 * weight, e.g. "598,00 € / 1 l" for a 50 ml tincture at 29,90 €. The
 * quantity is read from the variant or product title ("50ml", "250 g").
 * Returns null when no quantity is found or it's below the 10 ml/10 g
 * exemption (§ 4 Abs. 3 Nr. 1 PAngV).
 */
export function basePriceLabel(
  amount: number | null | undefined,
  currencyCode: string | null | undefined,
  ...titles: Array<string | null | undefined>
): string | null {
  if (!amount || !currencyCode) return null;
  for (const title of titles) {
    const match = title?.match(QUANTITY);
    if (!match) continue;
    const value = Number(match[1].replace(",", "."));
    const unit = match[2].toLowerCase();
    const inBase = unit === "ml" || unit === "g" ? value / 1000 : value;
    if (!inBase || ((unit === "ml" || unit === "g") && value < 10)) return null;
    const per = convertToLocale({ amount: amount / inBase, currencyCode });
    return `${per} / 1 ${unit === "ml" || unit === "l" ? "l" : "kg"}`;
  }
  return null;
}
