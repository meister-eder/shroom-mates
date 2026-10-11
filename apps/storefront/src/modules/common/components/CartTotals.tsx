import { convertToLocale } from "@lib/utils/money";

interface CartTotalsProps {
  currencyCode: string;
  itemTotal?: number | null;
  shippingTotal?: number | null;
  shippingLabel?: string;
  /** No shipping method chosen yet: don't show 0,00 € as shipping. */
  shippingPending?: boolean;
  taxTotal?: number | null;
  discountTotal?: number | null;
  total?: number | null;
}

/** Totals block shared by the checkout summary and order confirmation. */
export const CartTotals = ({
  currencyCode,
  itemTotal,
  shippingTotal,
  shippingLabel = "Versand",
  shippingPending = false,
  taxTotal,
  discountTotal,
  total,
}: CartTotalsProps) => {
  const fmt = (amount?: number | null) =>
    convertToLocale({ amount: amount ?? 0, currencyCode });

  return (
    <div>
      <div className="order-summary-line">
        <span className="text-muted">Zwischensumme (inkl. MwSt.)</span>
        <span>{fmt(itemTotal)}</span>
      </div>
      <div className="order-summary-line">
        <span className="text-muted">{shippingLabel}</span>
        <span className={shippingPending ? "text-muted" : undefined}>
          {shippingPending ? "wird im nächsten Schritt berechnet" : fmt(shippingTotal)}
        </span>
      </div>
      {(discountTotal ?? 0) > 0 && (
        <div className="order-summary-line" style={{ color: "var(--color-forest)" }}>
          <span>Rabatt</span>
          <span>−{fmt(discountTotal)}</span>
        </div>
      )}
      <div className="order-summary-line text-xs text-muted">
        <span>davon MwSt.</span>
        <span>{fmt(taxTotal)}</span>
      </div>
      <div className="order-summary-total">
        <span>{shippingPending ? "Gesamt (zzgl. Versand)" : "Gesamt"}</span>
        <span>{fmt(total)}</span>
      </div>
    </div>
  );
};
