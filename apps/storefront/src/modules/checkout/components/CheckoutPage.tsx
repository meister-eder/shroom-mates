import { $cart, $isCartLoading } from "@lib/stores/cart";
import { useStore } from "@nanostores/react";
import { MatesEyes } from "@modules/common/components/MatesEyes";
import { useEffect, useState } from "react";
import { type RegionCountry } from "./AddressFields";
import { DeliveryStep } from "./DeliveryStep";
import { OrderSummary } from "./OrderSummary";
import { PaymentStep } from "./PaymentStep";
import { ShippingAddressStep } from "./ShippingAddressStep";

interface CheckoutPageProps {
  countryCode: string;
  countries: RegionCountry[];
}

type CheckoutStep = "address" | "delivery" | "payment";

const VALID_STEPS: CheckoutStep[] = ["address", "delivery", "payment"];

// 04 "Prüfen" lives inside the payment page (order review + button).
const RAIL = ["Adresse", "Lieferung", "Zahlung", "Prüfen"] as const;

function readStepFromUrl(): CheckoutStep {
  const params = new URLSearchParams(window.location.search);
  const s = params.get("step");
  return VALID_STEPS.includes(s as CheckoutStep)
    ? (s as CheckoutStep)
    : "address";
}

function validateStep(
  step: CheckoutStep,
  cart: NonNullable<ReturnType<typeof $cart.get>>,
): CheckoutStep {
  const hasAddress = Boolean(cart.shipping_address?.first_name);
  const hasShippingMethod = Boolean(cart.shipping_methods?.length);

  if (step === "delivery" && !hasAddress) return "address";
  if (step === "payment" && !hasAddress) return "address";
  if (step === "payment" && !hasShippingMethod) return "delivery";
  return step;
}

export const CheckoutPage = ({ countryCode, countries }: CheckoutPageProps) => {
  const cart = useStore($cart);
  const isCartLoading = useStore($isCartLoading);
  const [, setSearch] = useState(() =>
    typeof window !== "undefined" ? window.location.search : "",
  );

  useEffect(() => {
    const onPopState = () => setSearch(window.location.search);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const goToStep = (next: CheckoutStep) => {
    const url = new URL(window.location.href);
    url.searchParams.set("step", next);
    history.pushState(null, "", url.toString());
    setSearch(url.search);
  };

  const step = cart ? validateStep(readStepFromUrl(), cart) : "address";

  if (!cart && isCartLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted sm:px-8">
        Pilzkorb wird geladen…
      </div>
    );
  }

  if (!cart || !cart.items?.length) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center sm:px-8">
        <MatesEyes size={180} alt="" className="mb-5 max-w-full" />
        <h1 className="mb-4! text-[clamp(36px,5vw,56px)]! leading-[.95]! text-accent">
          Dein Pilzkorb ist leer
        </h1>
        <p className="mb-1.5 font-display text-[30px] font-black leading-tight [font-variation-settings:'SOFT'_100,'WONK'_1]">
          Hier wächst noch nichts.
        </p>
        <p className="mb-5">Die Mates langweilen sich. Füge Produkte hinzu, bevor du zur Kasse gehst.</p>
        <a href={`/${countryCode}/store`} className="btn btn--primary min-h-[50px] px-[22px]">
          Zum Sortiment
        </a>
      </div>
    );
  }

  // 04 "Prüfen" is shown inside the payment step once a payment session exists
  // (same condition under which the review panel is active there).
  const isReviewing =
    step === "payment" && Boolean(cart.payment_collection?.payment_sessions?.length);
  const currentIdx = isReviewing ? RAIL.length - 1 : VALID_STEPS.indexOf(step);

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-8 sm:px-8">
      <h1 className="mb-6! text-[clamp(44px,5vw,72px)]! leading-[.92]! text-accent">Kasse</h1>
      <nav aria-label="Checkout-Schritte">
        <ol className="m-0 grid list-none grid-cols-4 gap-1.5 p-0 sm:gap-2">
          {RAIL.map((label, i) => {
            const isDone = i < currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <li
                key={label}
                aria-current={isCurrent ? "step" : undefined}
                className={`flex min-w-0 flex-col items-start gap-0 rounded-pill border-2 border-ink px-2.5 py-2 text-[12px] font-bold leading-tight sm:flex-row sm:items-center sm:gap-2.5 sm:px-3.5 sm:py-2.5 sm:text-[15px] ${
                  isCurrent
                    ? "bg-ink text-cream"
                    : isDone
                      ? "bg-olive-soft text-ink"
                      : "bg-transparent text-ink"
                }`}
              >
                <span className="font-mono text-[13px] font-medium" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {label}
                {isDone && <span className="sr-only"> (erledigt)</span>}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="mt-7 flex flex-wrap items-start gap-8 lg:gap-10">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <ShippingAddressStep
            cart={cart}
            countries={countries}
            countryCode={countryCode}
            mode={step === "address" ? "edit" : "read"}
            onContinue={() => goToStep("delivery")}
            onEdit={() => goToStep("address")}
          />

          <DeliveryStep
            cart={cart}
            mode={
              step === "delivery"
                ? "edit"
                : step === "address"
                  ? "inactive"
                  : "read"
            }
            onContinue={() => goToStep("payment")}
            onEdit={() => goToStep("delivery")}
          />

          <PaymentStep
            cart={cart}
            countryCode={countryCode}
            mode={step === "payment" ? "edit" : "inactive"}
          />
        </div>

        <OrderSummary cart={cart} />
      </div>
    </div>
  );
};
