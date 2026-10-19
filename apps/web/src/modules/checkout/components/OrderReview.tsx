import { formatAddressLines } from "@lib/utils/address";
import type { StoreCart } from "@medusajs/types";
import { OrderTotals } from "./OrderTotals";
import { SummaryLine } from "./SummaryLine";

interface OrderReviewProps {
  cart: StoreCart;
  countryCode: string;
}

/**
 * Overview directly above the order button (§ 312j Abs. 2 BGB): products,
 * shipping, total incl. VAT and the delivery address, each changeable.
 */
export const OrderReview = ({ cart, countryCode }: OrderReviewProps) => {
  const currencyCode = cart.currency_code || "EUR";
  const shipping = cart.shipping_methods?.[0];

  return (
    <section className="review" aria-label="Bestellübersicht">
      <h3 className="review-title">Deine Bestellung</h3>
      {cart.items?.map((item) => (
        <SummaryLine
          key={item.id}
          title={
            item.variant?.product?.title || item.product_title || "Produkt"
          }
          subtitle={item.variant?.title}
          handle={item.variant?.product?.handle}
          thumbnail={item.thumbnail || item.variant?.product?.thumbnail}
          quantity={item.quantity || 1}
          unitPrice={item.unit_price || 0}
          currencyCode={currencyCode}
        />
      ))}
      <OrderTotals
        currencyCode={currencyCode}
        itemTotal={cart.item_total}
        shippingTotal={cart.shipping_total}
        shippingLabel={
          shipping?.name ? `Versand (${shipping.name})` : "Versand"
        }
        taxTotal={cart.tax_total}
        discountTotal={cart.discount_total}
        total={cart.total}
      />
      <div className="review-foot">
        <span>
          Lieferung an: {formatAddressLines(cart.shipping_address).join(", ")}
        </span>
        <a href={`/${countryCode}/checkout?step=address`}>Ändern</a>
      </div>
    </section>
  );
};
