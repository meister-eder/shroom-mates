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
        <h1 className="text-3xl font-bold mb-4">Dein Warenkorb ist leer</h1>
        <p className="text-gray-600 mb-6">Füge Produkte hinzu, bevor du zur Kasse gehst.</p>
        <a
          href={`/${countryCode}/store`}
          className="inline-block bg-black text-white py-3 px-8 rounded-md hover:bg-gray-800 transition-colors"
        >
          Weiter einkaufen
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-0">
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
