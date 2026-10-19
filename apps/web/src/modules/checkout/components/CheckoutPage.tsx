import { $cart, $isCartLoading } from "@lib/stores/cart";
import { MatesEyes } from "@modules/common/components/MatesEyes";
import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import type { RegionCountry } from "./AddressFields";
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
      <div className="shop-page shop-page--loading">Pilzkorb wird geladen…</div>
    );
  }

  if (!cart || !cart.items?.length) {
    return (
      <div className="shop-notice">
        <MatesEyes size={180} alt="" className="shop-eyes" />
        <h1 className="shop-h1 shop-h1--sm">Dein Pilzkorb ist leer</h1>
        <p className="shop-notice-lead">Hier wächst noch nichts.</p>
        <p className="shop-notice-copy">
          Die Mates langweilen sich. Füge Produkte hinzu, bevor du zur Kasse
          gehst.
        </p>
        <a href={`/${countryCode}/store`} className="btn btn--primary">
          Zum Sortiment
        </a>
      </div>
    );
  }

  // 04 "Prüfen" is shown inside the payment step once a payment session exists
  // (same condition under which the review panel is active there).
  const isReviewing =
    step === "payment" &&
    Boolean(cart.payment_collection?.payment_sessions?.length);
  const currentIdx = isReviewing ? RAIL.length - 1 : VALID_STEPS.indexOf(step);

  return (
    <div className="shop-page">
      <h1 className="shop-h1 shop-h1--gap">Kasse</h1>
      <nav aria-label="Checkout-Schritte">
        <ol className="checkout-rail">
          {RAIL.map((label, i) => {
            const isDone = i < currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <li
                key={label}
                aria-current={isCurrent ? "step" : undefined}
                className={`checkout-rail__item${
                  isCurrent
                    ? " checkout-rail__item--current"
                    : isDone
                      ? " checkout-rail__item--done"
                      : ""
                }`}
              >
                <span className="checkout-rail__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {label}
                {isDone && <span className="sr-only"> (erledigt)</span>}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="shop-split checkout-split">
        <div className="checkout-main">
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
