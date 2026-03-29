import { $cart } from "@lib/stores/cart";
import { useStore } from "@nanostores/react";
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

  if (!cart || !cart.items?.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 style={{ fontFamily: '"DM Mono", monospace', fontWeight: 700, fontSize: "2rem", marginBottom: "1rem" }}>
          Dein Warenkorb ist leer
        </h1>
        <p style={{ color: "var(--text-muted)" }} className="mb-6">
          Füge Produkte hinzu, bevor du zur Kasse gehst.
        </p>
        <a
          href={`/${countryCode}/store`}
          className="btn-accent inline-block"
        >
          Weiter einkaufen
        </a>
      </div>
    );
  }

  const stepLabels: Record<CheckoutStep, string> = {
    address: "Adresse",
    delivery: "Lieferung",
    payment: "Zahlung",
  };

  return (
    <div className="section-inner py-8">
      {/* Step progress indicator */}
      <nav aria-label="Checkout-Schritte" className="mb-8">
        <ol className="flex items-center gap-2 text-sm">
          {(["address", "delivery", "payment"] as CheckoutStep[]).map((s, i) => {
            const steps: CheckoutStep[] = ["address", "delivery", "payment"];
            const currentIdx = steps.indexOf(step);
            const stepIdx = i;
            const isDone = stepIdx < currentIdx;
            const isActive = stepIdx === currentIdx;
            return (
              <li key={s} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden="true" style={{ color: "var(--text-muted)" }}>›</span>}
                <span
                  style={{
                    fontFamily: '"DM Mono", monospace',
                    fontWeight: isActive ? 700 : 400,
                    color: isDone
                      ? "var(--color-forest)"
                      : isActive
                        ? "var(--text-color)"
                        : "var(--text-muted)",
                  }}
                >
                  {isDone ? "✓ " : ""}{stepLabels[s]}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-4">
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

        <div className="lg:col-span-1">
          <OrderSummary cart={cart} />
        </div>
      </div>
    </div>
  );
};
