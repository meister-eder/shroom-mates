import { MatesEyes } from "@modules/common/components/MatesEyes";
import { formatProviderName } from "@lib/checkout/payment-providers";
import { formatAddressLines, isSameAddress } from "@lib/utils/address";
import type { StoreOrder } from "@medusajs/types";
import { OrderTotals } from "@modules/checkout/components/OrderTotals";
import { convertToLocale } from "@lib/utils/money";
import { INSTAGRAM_URL } from "@shroom-mates/ui/site";

interface OrderConfirmedPageProps {
  countryCode: string;
  order: StoreOrder;
}

const WaveEdge = ({ flip = false }: { flip?: boolean }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 1440 56"
    preserveAspectRatio="none"
    className="block h-14 w-full fill-ink"
    style={flip ? { margin: "-1px 0 0", transform: "scaleY(-1)" } : { margin: "0 0 -1px" }}
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

const H2 = "m-0 mb-4! font-display text-[26px]! leading-[1.1]! font-black";

/** Server-rendered: the order is loaded by the page (404 if unknown). */
export const OrderConfirmedPage = ({ countryCode, order }: OrderConfirmedPageProps) => {
  const currencyCode = order.currency_code ?? "eur";
  const paymentProviderId =
    order.payment_collections?.[0]?.payment_sessions?.[0]?.provider_id;
  const shippingMethod = order.shipping_methods?.[0];
  const firstName = order.shipping_address?.first_name?.trim();

  return (
    <div aria-label="Bestellbestätigung" className="overflow-hidden">
      <section className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-10 px-4 pb-[72px] pt-12 sm:px-8">
        <div className="relative h-[380px] min-w-0 flex-[0_1_420px]">
          <MatesEyes
            size={340}
            alt="Die beiden Maskottchen schauen dir hinterher"
            className="mx-auto mt-2.5"
          />
        </div>
        <div className="min-w-0 flex-[1_1_480px]">
          <p className="m-0 mb-3.5 font-mono text-sm uppercase tracking-[.12em] text-accent-dark">
            Bestellung #{order.display_id} ist eingegangen
          </p>
          <h1 className="m-0 text-[clamp(52px,7vw,104px)]! leading-[.9]! text-accent">
            {firstName ? `Danke, ${firstName}!` : "Danke!"}
          </h1>
          <p className="mb-0 mt-5 max-w-[40ch] text-xl leading-normal">
            Die Mates packen schon.
            {order.email && <> Eine Bestätigung ist unterwegs an {order.email}.</>}
          </p>
        </div>
      </section>

      <WaveEdge />
      <section className="bg-ink px-4 py-[72px] text-cream sm:px-8">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="m-0 mb-8! text-[clamp(36px,4.4vw,60px)]! leading-[.95]! text-accent-light">
            Wie es jetzt weitergeht
          </h2>
          <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[18px] p-0">
            {NEXT_STEPS.map(([title, text], i) => (
              <li
                key={title}
                className={`p-[22px] text-ink ${i === 0 ? "bg-olive-soft" : "bg-cream"}`}
              >
                <p
                  className={`m-0 mb-1.5 font-mono text-[13px] ${i === 0 ? "" : "text-accent-dark"}`}
                >
                  {String(i + 1).padStart(2, "0")}
                  {i === 0 ? " · jetzt" : ""}
                </p>
                <h3 className="m-0 mb-1.5 font-display text-2xl! font-extrabold! leading-[1.2]!">
                  {title}
                </h3>
                <p className="m-0 text-[15px]">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <WaveEdge flip />

      <section className="mx-auto flex max-w-[1280px] flex-wrap items-start gap-8 px-4 pb-24 pt-[72px] sm:px-8">
        <div className="min-w-0 flex-[1_1_460px] rounded-none border-2 border-accent bg-paper p-6">
          <h2 className={H2}>Deine Bestellung</h2>
          <div className="flex flex-col">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="flex justify-between gap-4 border-b border-[#b9bbe6] py-2"
              >
                <span>
                  {item.quantity ?? 1} × {item.title}
                  {item.variant_title && item.variant_title !== "Standard" && ` (${item.variant_title})`}
                </span>
                <span className="font-mono">
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
            shippingLabel={shippingMethod ? `Versand ${shippingMethod.name}` : "Versand"}
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
            href={`/${countryCode}/store`}
            className="flex h-14 items-center justify-center rounded-pill border-2 border-ink text-lg font-bold text-ink! no-underline hover:bg-white"
          >
            Zurück zum Shop
          </a>
          <a
            href={INSTAGRAM_URL}
            className="text-center text-ink! underline hover:text-accent-dark!"
          >
            Folg uns auf Instagram fürs Daily Business
          </a>
        </div>
      </section>
    </div>
  );
};
