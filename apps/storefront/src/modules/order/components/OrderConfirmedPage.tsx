import { formatProviderName } from "@lib/checkout/payment-providers";
import { formatAddressLines, isSameAddress } from "@lib/utils/address";
import type { StoreOrder } from "@medusajs/types";
import { CartTotals } from "@modules/common/components/CartTotals";
import { LineItemRow } from "@modules/common/components/LineItemRow";
import type { ReactNode } from "react";

interface OrderConfirmedPageProps {
  countryCode: string;
  order: StoreOrder;
}

const NEXT_STEPS = [
  ["Bearbeitung", "Wir bereiten deine Artikel für den Versand vor."],
  [
    "Versandbenachrichtigung",
    "Du erhältst eine E-Mail mit Tracking-Informationen, sobald deine Bestellung versendet wird.",
  ],
  ["Lieferung", "Dein Paket wird an deine Lieferadresse zugestellt."],
] as const;

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="order-summary-card mb-6">
    <div className="order-summary-header">
      <h2 className="checkout-step-title">{title}</h2>
    </div>
    <div className="order-summary-body">{children}</div>
  </section>
);

/** Server-rendered: the order is loaded by the page (404 if unknown). */
export const OrderConfirmedPage = ({ countryCode, order }: OrderConfirmedPageProps) => {
  const currencyCode = order.currency_code ?? "eur";
  const paymentProviderId =
    order.payment_collections?.[0]?.payment_sessions?.[0]?.provider_id;
  const shippingMethod = order.shipping_methods?.[0];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-16" aria-label="Bestellbestätigung">
      <div className="text-center mb-12">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 text-white"
          style={{ background: "var(--color-forest)" }}
          aria-hidden="true"
        >
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="page-heading mb-3">Bestellung bestätigt! 🍄</h1>

        <p className="text-2xl font-mono font-semibold mb-2">#{order.display_id}</p>
        {order.email && (
          <p className="text-sm text-muted">
            Eine Bestätigungs-E-Mail wurde an{" "}
            <span className="font-medium">{order.email}</span> gesendet.
          </p>
        )}
      </div>

      <>
          <Card title="Bestellte Artikel">
            {order.items?.map((item) => (
              <LineItemRow
                key={item.id}
                title={item.title}
                subtitle={item.variant_title}
                thumbnail={item.thumbnail}
                quantity={item.quantity ?? 1}
                unitPrice={item.unit_price ?? 0}
                currencyCode={currencyCode}
              />
            ))}
          </Card>

          <Card title="Bestellzusammenfassung">
            <CartTotals
              currencyCode={currencyCode}
              itemTotal={order.item_total ?? order.subtotal}
              shippingTotal={order.shipping_total}
              shippingLabel={shippingMethod ? `Versand (${shippingMethod.name})` : "Versand"}
              taxTotal={order.tax_total}
              discountTotal={order.discount_total}
              total={order.total}
            />
          </Card>

          <Card title="Lieferung & Zahlung">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="input-label mb-1">Lieferadresse</p>
                <address className="text-muted not-italic leading-relaxed">
                  {formatAddressLines(order.shipping_address).map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </div>
              <div>
                <p className="input-label mb-1">Rechnungsadresse</p>
                {isSameAddress(order.shipping_address, order.billing_address) ? (
                  <p className="text-muted">Wie Lieferadresse</p>
                ) : (
                  <address className="text-muted not-italic leading-relaxed">
                    {formatAddressLines(order.billing_address).map((line, i) => (
                      <span key={i} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                )}
              </div>
              {paymentProviderId && (
                <div>
                  <p className="input-label mb-1">Zahlung</p>
                  <p className="text-muted">{formatProviderName(paymentProviderId)}</p>
                </div>
              )}
            </div>
          </Card>

          <Card title="Wie geht es weiter?">
            <ol className="space-y-3 text-sm">
              {NEXT_STEPS.map(([title, text], i) => (
                <li key={title} className="flex gap-3">
                  <span className="checkout-step-number">{i + 1}</span>
                  <span className="text-muted">
                    <strong style={{ color: "var(--text-color)" }}>{title}</strong> — {text}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
      </>

      <div className="text-center mt-10">
        <a href={`/${countryCode}/store`} className="btn-accent inline-block">
          Weiter einkaufen
        </a>
      </div>
    </div>
  );
};
