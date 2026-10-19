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

  const row = receipt
    ? "flex justify-between gap-4 border-b border-[#b9bbe6] py-2"
    : "flex justify-between gap-4";

  const lines = (
    <>
      <div className={row}>
        <span>Zwischensumme</span>
        <span className="font-mono">{fmt(itemTotal)}</span>
      </div>
      <div className={row}>
        <span>{shippingLabel}</span>
        <span className="font-mono">
          {shippingPending ? "nächster Schritt" : fmt(shippingTotal)}
        </span>
      </div>
      {hasDiscount && (
        <div className={`${row} font-bold`}>
          <span>Rabatt</span>
          <span className="font-mono">−{fmt(discountTotal)}</span>
        </div>
      )}
    </>
  );

  const totalRow = (
    <div
      className={`flex items-baseline justify-between gap-4 ${
        receipt ? "pt-3" : "border-t-2 border-ink pt-3"
      }`}
    >
      <span className="font-display text-2xl font-black">Gesamt</span>
      <span className="font-mono text-[26px] font-medium">{fmt(total)}</span>
    </div>
  );

  const note = (
    <p className="m-0 font-mono text-xs text-muted">
      inkl. MwSt.
      {(taxTotal ?? 0) > 0 && ` (davon ${fmt(taxTotal)})`}
      {shippingPending && " · zzgl. Versand"}
    </p>
  );

  if (receipt) {
    return (
      <div className="flex flex-col text-base">
        {lines}
        {totalRow}
        <div className="mt-2">{note}</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1.5 border-t-2 border-ink pt-3 text-base">
        {lines}
      </div>
      {totalRow}
      {note}
    </>
  );
};
