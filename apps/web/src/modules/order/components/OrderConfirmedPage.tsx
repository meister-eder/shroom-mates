import { formatProviderName } from "@lib/checkout/payment-providers";
import { formatAddressLines, isSameAddress } from "@lib/utils/address";
import { convertToLocale } from "@lib/utils/money";
import type { StoreOrder } from "@medusajs/types";
import { OrderTotals } from "@modules/checkout/components/OrderTotals";
import { MatesEyes } from "@modules/common/components/MatesEyes";
import { INSTAGRAM_URL } from "@shroom-mates/ui/site";

interface OrderConfirmedPageProps {
  order: StoreOrder;
}

const WaveEdge = ({ flip = false }: { flip?: boolean }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 1440 56"
    preserveAspectRatio="none"
    className="order-wave"
    style={
      flip
        ? { margin: "-1px 0 0", transform: "scaleY(-1)" }
        : { margin: "0 0 -1px" }
    }
  >
    <path d="M0 56V28C80 6 160 6 240 28S400 50 480 28 640 6 720 28 880 50 960 28 1120 6 1200 28 1360 50 1440 28V56Z" />
  </svg>
);

const NEXT_STEPS = [
  ["Bestätigung", "Per Mail, mit Rechnung und Widerrufsbelehrung."],
  ["Wir packen", "Von Hand, in der Glasfabrik Leutzsch."],
  ["Unterwegs", "DHL-Sendungsnummer kommt per Mail."],
  ["Auspacken", "Growkit bald aufschneiden und loslegen."],
] as const;

/** Server-rendered: the order is loaded by the page (404 if unknown). */
export const OrderConfirmedPage = ({ order }: OrderConfirmedPageProps) => {
  const currencyCode = order.currency_code ?? "eur";
  const paymentProviderId =
    order.payment_collections?.[0]?.payment_sessions?.[0]?.provider_id;
  const shippingMethod = order.shipping_methods?.[0];
  const firstName = order.shipping_address?.first_name?.trim();

  return (
    <section
      aria-label="Bestellbestätigung"
      className="order-page"
      data-purchase-total={order.total}
      data-purchase-currency={currencyCode.toUpperCase()}
    >
      <section className="order-hero">
        <div className="order-hero-art">
          <MatesEyes
            size={340}
            alt="Die beiden Maskottchen schauen dir hinterher"
            className="order-hero-eyes"
          />
        </div>
        <div className="order-hero-text">
          <p className="order-kicker">
            Bestellung #{order.display_id} ist eingegangen
          </p>
          <h1 className="order-title">
            {firstName ? `Danke, ${firstName}!` : "Danke!"}
          </h1>
          <p className="order-lead">
            Die Mates packen schon.
            {order.email && (
              <> Eine Bestätigung ist unterwegs an {order.email}.</>
            )}
          </p>
        </div>
      </section>

      <WaveEdge />
      <section className="order-band">
        <div className="order-band-inner">
          <h2 className="order-band-title">Wie es jetzt weitergeht</h2>
          <ol className="order-steps">
            {NEXT_STEPS.map(([title, text], i) => (
              <li
                key={title}
                className={`order-step${i === 0 ? " order-step--first" : ""}`}
              >
                <p className="order-step-num">
                  {String(i + 1).padStart(2, "0")}
                  {i === 0 ? " · jetzt" : ""}
                </p>
                <h3 className="order-step-title">{title}</h3>
                <p className="order-step-text">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <WaveEdge flip />

      <section className="order-detail">
        <div className="order-card">
          <h2 className="order-card-title">Deine Bestellung</h2>
          <div className="order-items">
            {order.items?.map((item) => (
              <div key={item.id} className="totals-row totals-row--receipt">
                <span>
                  {item.quantity ?? 1} × {item.title}
                  {item.variant_title &&
                    item.variant_title !== "Standard" &&
                    ` (${item.variant_title})`}
                </span>
                <span className="shop-mono">
                  {convertToLocale({
                    amount: (item.unit_price ?? 0) * (item.quantity ?? 1),
                    currencyCode,
                  })}
                </span>
              </div>
            ))}
          </div>
          <OrderTotals
            variant="receipt"
            currencyCode={currencyCode}
            itemTotal={order.item_total ?? order.subtotal}
            shippingTotal={order.shipping_total}
            shippingLabel={
              shippingMethod ? `Versand ${shippingMethod.name}` : "Versand"
            }
            taxTotal={order.tax_total}
            discountTotal={order.discount_total}
            total={order.total}
          />

          <div className="order-meta">
            <div>
              <p className="label">Lieferadresse</p>
              <address>
                {formatAddressLines(order.shipping_address).map((line, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: Adresszeilen sind statisch, die Reihenfolge ändert sich nicht
                  <span key={i}>{line}</span>
                ))}
              </address>
            </div>
            <div>
              <p className="label">Rechnungsadresse</p>
              {isSameAddress(order.shipping_address, order.billing_address) ? (
                <p>Wie Lieferadresse</p>
              ) : (
                <address>
                  {formatAddressLines(order.billing_address).map((line, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: Adresszeilen sind statisch, die Reihenfolge ändert sich nicht
                    <span key={i}>{line}</span>
                  ))}
                </address>
              )}
            </div>
            {paymentProviderId && (
              <div>
                <p className="label">Zahlung</p>
                <p>{formatProviderName(paymentProviderId)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="order-aside">
          <a href="/shop/" className="order-back">
            Zurück zum Shop
          </a>
          <a href={INSTAGRAM_URL} className="order-insta">
            Folg uns auf Instagram und schau uns beim Wachsen zu
          </a>
        </div>
      </section>
    </section>
  );
};
