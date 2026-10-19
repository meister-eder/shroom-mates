/** Versandfakten des Shops. Die AGB (legal/agb.md) müssen bei Änderungen von Hand angepasst werden. */
export const SHIPPING = {
  standard: { price: "4,95 €", time: "3–5 Werktage" },
  express: { price: "9,95 €", time: "1–2 Werktage" },
  region: "innerhalb Deutschlands",
} as const;
