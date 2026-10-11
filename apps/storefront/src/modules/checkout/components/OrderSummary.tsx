import type { StoreCart } from "@medusajs/types";
import { CartTotals } from "@modules/common/components/CartTotals";
import { LineItemRow } from "@modules/common/components/LineItemRow";

interface OrderSummaryProps {
  cart: StoreCart;
}

export const OrderSummary = ({ cart }: OrderSummaryProps) => {
  const currencyCode = cart.currency_code || "EUR";

  return (
    <div className="sticky top-8 order-summary-card">
      <div className="order-summary-header">
        <h2 className="checkout-step-title">Dein Warenkorb</h2>
      </div>

      <div className="order-summary-body">
        <div className="mb-4">
          <CartTotals
            currencyCode={currencyCode}
            itemTotal={cart.item_total}
            shippingTotal={cart.shipping_total}
            taxTotal={cart.tax_total}
            discountTotal={cart.discount_total}
            total={cart.total}
          />
        </div>

        <div className="pt-4" style={{ borderTop: "2px solid var(--border-subtle)" }}>
          {cart.items?.map((item) => (
            <LineItemRow
              key={item.id}
              title={item.variant?.product?.title || item.product_title || "Produkt"}
              subtitle={item.variant?.title}
              thumbnail={
                item.variant?.product?.thumbnail || item.variant?.product?.images?.[0]?.url
              }
              quantity={item.quantity || 1}
              unitPrice={item.unit_price || 0}
              currencyCode={currencyCode}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
