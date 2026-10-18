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
    <dl className="cart-totals">
      <div className="cart-totals__line">
        <dt>Zwischensumme (inkl. MwSt.)</dt>
        <dd>{fmt(itemTotal)}</dd>
      </div>
      <div className="cart-totals__line">
        <dt>{shippingLabel}</dt>
        <dd className={shippingPending ? "cart-totals__pending" : undefined}>
          {shippingPending ? "wird im nächsten Schritt berechnet" : fmt(shippingTotal)}
        </dd>
      </div>
      {(discountTotal ?? 0) > 0 && (
        <div className="cart-totals__line cart-totals__line--discount">
          <dt>Rabatt</dt>
          <dd>−{fmt(discountTotal)}</dd>
        </div>
      )}
      <div className="cart-totals__line cart-totals__line--small">
        <dt>davon MwSt.</dt>
        <dd>{fmt(taxTotal)}</dd>
      </div>
      <div className="cart-totals__line cart-totals__line--total">
        <dt>{shippingPending ? "Gesamt (zzgl. Versand)" : "Gesamt"}</dt>
        <dd>{fmt(total)}</dd>
      </div>
    </dl>
  );
};
