import type { StoreCart } from "@medusajs/types";
import { OrderTotals } from "./OrderTotals";
import { SummaryLine } from "./SummaryLine";

interface OrderSummaryProps {
  cart: StoreCart;
}

export const OrderSummary = ({ cart }: OrderSummaryProps) => {
  const currencyCode = cart.currency_code || "EUR";

  return (
    <aside aria-labelledby="order-summary-title" className="shop-side">
      {/* biome-ignore lint/correctness/useUniqueElementIds: feste ID für label/aria-Verknüpfung, Komponente wird pro Seite nur einmal gerendert */}
      <h2 id="order-summary-title" className="summary-title">
        Dein Pilzkorb
      </h2>

      {cart.items?.map((item) => (
        <SummaryLine
          key={item.id}
          title={
            item.variant?.product?.title || item.product_title || "Produkt"
          }
          subtitle={item.variant?.title}
          handle={item.variant?.product?.handle}
          thumbnail={
            item.thumbnail ||
            item.variant?.product?.thumbnail ||
            item.variant?.product?.images?.[0]?.url
          }
          quantity={item.quantity || 1}
          unitPrice={item.unit_price || 0}
          currencyCode={currencyCode}
        />
      ))}

      <OrderTotals
        currencyCode={currencyCode}
        itemTotal={cart.item_total}
        shippingTotal={cart.shipping_total}
        shippingPending={!cart.shipping_methods?.length}
        taxTotal={cart.tax_total}
        discountTotal={cart.discount_total}
        total={cart.total}
      />
      <p className="shop-meta">
        Lieferung nur innerhalb Deutschlands. Bezahlung per Karte und weiteren
        Zahlarten über SumUp.
      </p>
    </aside>
  );
};
