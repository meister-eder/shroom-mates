import { formatProviderName } from "@lib/checkout/payment-providers";
import { formatAddressLines, isSameAddress } from "@lib/utils/address";
import type { StoreOrder } from "@medusajs/types";
import { CartTotals } from "@modules/common/components/CartTotals";
import { LineItemRow } from "@modules/common/components/LineItemRow";
import { INSTAGRAM_URL, websiteUrl } from "@shroom-mates/ui/site";

interface OrderConfirmedPageProps {
  countryCode: string;
  order: StoreOrder;
}

const NEXT_STEPS = [
  ["Bestätigung", "Eine Bestätigung geht per E-Mail an dich."],
  ["Wir packen", "Wir bereiten deine Artikel für den Versand vor."],
  [
    "Unterwegs",
    "Du erhältst eine E-Mail mit Tracking-Informationen, sobald deine Bestellung versendet wird.",
  ],
  ["Auspacken", "Dein Paket wird an deine Lieferadresse zugestellt."],
] as const;

const H2 = "m-0 mb-4 font-display text-[26px]! leading-none! font-black";

/** Server-rendered: the order is loaded by the page (404 if unknown). */
export const OrderConfirmedPage = ({ countryCode, order }: OrderConfirmedPageProps) => {
  const currencyCode = order.currency_code ?? "eur";
  const paymentProviderId =
    order.payment_collections?.[0]?.payment_sessions?.[0]?.provider_id;
  const shippingMethod = order.shipping_methods?.[0];
  const firstName = order.shipping_address?.first_name?.trim();

  return (
    <div aria-label="Bestellbestätigung" className="overflow-hidden">
      <section className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-10 px-4 pb-16 pt-12 sm:px-8">
        <div className="relative h-[300px] min-w-0 flex-[0_1_420px] sm:h-[380px]">
          <div
            className="dots absolute inset-[30px] rounded-full"
            aria-hidden="true"
          />
          <img
            src="/mascot.webp"
            alt="Die Maskottchen der shroom-mates"
            width="340"
            height="340"
            className="relative mx-auto mt-2.5 block w-[260px] sm:w-[340px] [filter:drop-shadow(6px_6px_0_var(--color-ink))]"
          />
        </div>
        <div className="min-w-0 flex-[1_1_480px]">
          <p className="eyebrow mb-3.5 text-sm!">
            Bestellung #{order.display_id} ist eingegangen
          </p>
          <h1 className="m-0 text-[clamp(52px,7vw,104px)]! leading-[.9]! text-accent">
            {firstName ? `Danke, ${firstName}!` : "Danke!"}
          </h1>
          {order.email && (
            <p className="mt-5 max-w-[40ch] text-xl leading-normal">
              Eine Bestätigungs-E-Mail wurde an{" "}
              <span className="font-bold">{order.email}</span> gesendet.
            </p>
          )}
        </div>
      </section>

      <section className="bg-ink px-4 py-16 text-cream sm:px-8">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="m-0 mb-8 text-[clamp(36px,4.4vw,60px)]! leading-[.95]! text-accent-light">
            Wie es weitergeht
          </h2>
          <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 p-0">
            {NEXT_STEPS.map(([title, text], i) => (
              <li
                key={title}
                className="comic-panel [box-shadow:4px_4px_0_var(--color-accent)]"
              >
                <div
                  className={`comic-panel__head ${i === 0 ? "comic-panel__head--lavender" : ""}`}
                >
                  <span className="comic-panel__num">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="comic-panel__body">
                  <h3 className="mb-1.5 text-2xl! font-black! [font-family:var(--font-display)]">
                    {title}
                  </h3>
                  <p className="m-0 text-[15px]">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1280px] flex-wrap items-start gap-8 px-4 pb-24 pt-16 sm:px-8">
        <div className="min-w-0 flex-[1_1_460px] rounded-[26px] border-[3px] border-ink bg-paper p-6 shadow-card">
          <h2 className={H2}>Deine Bestellung</h2>
          <div className="mb-4 border-b-2 border-ink pb-2">
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
          </div>
          <CartTotals
            currencyCode={currencyCode}
            itemTotal={order.item_total ?? order.subtotal}
            shippingTotal={order.shipping_total}
            shippingLabel={shippingMethod ? `Versand (${shippingMethod.name})` : "Versand"}
            taxTotal={order.tax_total}
            discountTotal={order.discount_total}
            total={order.total}
          />

          <div className="mt-6 grid grid-cols-1 gap-6 border-t-2 border-ink pt-5 sm:grid-cols-2">
            <div>
              <p className="label mb-1">Lieferadresse</p>
              <address className="not-italic leading-relaxed">
                {formatAddressLines(order.shipping_address).map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </div>
            <div>
              <p className="label mb-1">Rechnungsadresse</p>
              {isSameAddress(order.shipping_address, order.billing_address) ? (
                <p>Wie Lieferadresse</p>
              ) : (
                <address className="not-italic leading-relaxed">
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
                <p className="label mb-1">Zahlung</p>
                <p>{formatProviderName(paymentProviderId)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-4">
          <a
            href={websiteUrl("/growkits/")}
            className="block rounded-[26px] border-[3px] border-ink bg-lavender p-6 text-ink no-underline shadow-[6px_6px_0_var(--color-ink)]"
          >
            <p className="m-0 mb-1.5 font-display text-[26px] font-black">Schon mal lesen?</p>
            <p className="m-0">Zur Growkit-Anleitung →</p>
          </a>
          <a href={`/${countryCode}/store`} className="btn btn--secondary btn--block min-h-14 text-lg">
            Weiter einkaufen
          </a>
          <a
            href={INSTAGRAM_URL}
            className="text-center text-ink underline hover:text-accent-dark"
          >
            Folg uns auf Instagram fürs Daily Business
          </a>
        </div>
      </section>
    </div>
  );
};
