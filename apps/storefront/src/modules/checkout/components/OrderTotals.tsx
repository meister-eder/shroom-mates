import { convertToLocale } from "@lib/utils/money";

interface OrderTotalsProps {
  currencyCode: string;
  itemTotal?: number | null;
  shippingTotal?: number | null;
  shippingLabel?: string;
  /** No shipping method chosen yet: show "nächster Schritt" instead of 0,00 €. */
  shippingPending?: boolean;
  taxTotal?: number | null;
  discountTotal?: number | null;
  total?: number | null;
  /** summary = Kasse/Pilzkorb (Tintenlinien), receipt = Danke-Seite (Zeilen mit Haarlinie) */
  variant?: "summary" | "receipt";
}

/** Summen im Look des Mockups (Zwischensumme, Versand, Gesamt + MwSt.-Hinweis). */
export const OrderTotals = ({
  currencyCode,
  itemTotal,
  shippingTotal,
  shippingLabel = "Versand",
  shippingPending = false,
  taxTotal,
  discountTotal,
  total,
  variant = "summary",
}: OrderTotalsProps) => {
  const fmt = (amount?: number | null) =>
    convertToLocale({ amount: amount ?? 0, currencyCode });
  const hasDiscount = (discountTotal ?? 0) > 0;
  const receipt = variant === "receipt";

  const row = receipt ? "totals-row totals-row--receipt" : "totals-row";

  const lines = (
    <>
      <div className={row}>
        <span>Zwischensumme</span>
        <span className="shop-mono">{fmt(itemTotal)}</span>
      </div>
      <div className={row}>
        <span>{shippingLabel}</span>
        <span className="shop-mono">
          {shippingPending ? "nächster Schritt" : fmt(shippingTotal)}
        </span>
      </div>
      {hasDiscount && (
        <div className={`${row} totals-row--bold`}>
          <span>Rabatt</span>
          <span className="shop-mono">−{fmt(discountTotal)}</span>
        </div>
      )}
    </>
  );

  const totalRow = (
    <div className={`totals-total${receipt ? "" : " totals-total--rule"}`}>
      <span className="totals-total-label">Gesamt</span>
      <span className="totals-total-amount">{fmt(total)}</span>
    </div>
  );

  const note = (
    <p className="shop-meta">
      inkl. MwSt.
      {(taxTotal ?? 0) > 0 && ` (davon ${fmt(taxTotal)})`}
      {shippingPending && " · zzgl. Versand"}
    </p>
  );

  if (receipt) {
    return (
      <div className="totals--receipt">
        {lines}
        {totalRow}
        <div className="totals-note">{note}</div>
      </div>
    );
  }

  return (
    <>
      <div className="totals-lines">{lines}</div>
      {totalRow}
      {note}
    </>
  );
};
