import { convertToLocale } from "@lib/utils/money";
import type { StoreCart } from "@medusajs/types";

interface OrderSummaryProps {
  cart: StoreCart;
}

export const OrderSummary = ({ cart }: OrderSummaryProps) => {
  const currencyCode = cart.currency_code || "EUR";

  return (
    <div className="sticky top-8 order-summary-card">
      <div className="order-summary-header">
        <h2 style={{ fontFamily: '"DM Mono", monospace', fontWeight: 700, fontSize: "1.1rem" }}>
          Dein Warenkorb
        </h2>
      </div>

      <div className="order-summary-body">
        <div className="mb-4">
          <div className="order-summary-line">
            <span style={{ color: "var(--text-muted)" }}>
              Zwischensumme (exkl. Versand &amp; MwSt.)
            </span>
            <span>
              {convertToLocale({ amount: cart.item_subtotal || 0, currencyCode })}
            </span>
          </div>

          <div className="order-summary-line">
            <span style={{ color: "var(--text-muted)" }}>Versand</span>
            <span>
              {convertToLocale({
                amount: cart.shipping_total || 0,
                currencyCode,
              })}
            </span>
          </div>

          <div className="order-summary-line">
            <span style={{ color: "var(--text-muted)" }}>MwSt.</span>
            <span>
              {convertToLocale({ amount: cart.tax_total || 0, currencyCode })}
            </span>
          </div>

          <div className="order-summary-total">
            <span>Gesamt</span>
            <span>
              {convertToLocale({ amount: cart.total || 0, currencyCode })}
            </span>
          </div>
        </div>

        <div style={{ borderTop: "2px solid var(--border-subtle, #e0d8c8)", paddingTop: "1rem" }}>
          {cart.items?.map((item) => {
            const thumbnailUrl =
              item.variant?.product?.thumbnail ||
              item.variant?.product?.images?.[0]?.url;
            const productTitle = item.variant?.product?.title || "Produkt";
            const variantTitle = item.variant?.title || "";
            const unitPrice = item.unit_price || 0;
            const quantity = item.quantity || 1;
            const lineTotal = unitPrice * quantity;

            return (
              <div key={item.id} className="flex gap-3 py-2">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={productTitle}
                    className="w-16 h-16 object-cover flex-shrink-0"
                    style={{ border: "2px solid #000", borderRadius: 8 }}
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="w-16 h-16 flex-shrink-0"
                    style={{ border: "2px solid #000", borderRadius: 8, background: "var(--bg-warm)" }}
                  />
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{productTitle}</p>
                  {variantTitle && (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {variantTitle}
                    </p>
                  )}
                  <div className="flex justify-between mt-1 text-sm">
                    <span style={{ color: "var(--text-muted)" }}>
                      {quantity}× {convertToLocale({ amount: unitPrice, currencyCode })}
                    </span>
                    <span className="font-medium">
                      {convertToLocale({ amount: lineTotal, currencyCode })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
