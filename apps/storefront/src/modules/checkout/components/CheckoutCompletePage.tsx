import { goToOrderConfirmation } from "@lib/checkout/order-handoff";
import { getCheckoutCartId, placeOrder } from "@lib/stores/cart";
import { MatesEyes } from "@modules/common/components/MatesEyes";
import { useEffect, useState, type ReactNode } from "react";

interface CheckoutCompletePageProps {
  countryCode: string;
}

type State =
  | { kind: "completing" }
  | { kind: "pending" }
  | { kind: "no_cart" }
  | { kind: "error"; message: string };

/**
 * Landing page after SumUp redirects back (3DS / alternative payment
 * methods). Completes the cart the payment was started for; Medusa returns the
 * existing order if the payment webhook already completed it.
 */
export const CheckoutCompletePage = ({ countryCode }: CheckoutCompletePageProps) => {
  const [state, setState] = useState<State>({ kind: "completing" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const cartId = getCheckoutCartId();
    if (!cartId) {
      setState({ kind: "no_cart" });
      return;
    }

    let cancelled = false;
    setState({ kind: "completing" });

    // The payment provider may confirm a few seconds after redirecting.
    placeOrder(cartId, { pendingPaymentRetries: 4 })
      .then((result) => {
        if (cancelled) return;
        if (result.type === "order") {
          goToOrderConfirmation(countryCode, result.order);
        } else if (result.type === "pending") {
          setState({ kind: "pending" });
        } else {
          setState({
            kind: "error",
            message: result.message || "Zahlung fehlgeschlagen. Bitte versuche es erneut.",
          });
        }
      })
      .catch((err) => {
        console.error("Failed to complete order after payment redirect:", err);
        if (!cancelled) {
          setState({
            kind: "error",
            message: "Bestellung konnte nicht abgeschlossen werden. Bitte versuche es erneut.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attempt, countryCode]);

  if (state.kind === "completing") {
    return (
      <Shell title="Zahlung wird verarbeitet…">
        <p className="text-lg">Bitte warte einen Moment, deine Bestellung wird abgeschlossen.</p>
      </Shell>
    );
  }

  if (state.kind === "pending") {
    return (
      <Shell title="Zahlung wird noch bestätigt">
        <p className="mb-8 text-lg">
          Das dauert länger als üblich. Du erhältst eine Bestätigungs-E-Mail, sobald deine
          Bestellung eingegangen ist.
        </p>
        <button type="button" className="btn btn--primary" onClick={() => setAttempt((a) => a + 1)}>
          Erneut prüfen
        </button>
      </Shell>
    );
  }

  if (state.kind === "no_cart") {
    return (
      <Shell title="Keine offene Bestellung gefunden">
        <p className="mb-8 text-lg">
          Falls deine Zahlung erfolgreich war, erhältst du eine Bestätigung per E-Mail.
        </p>
        <a href={`/${countryCode}/store`} className="btn btn--primary">
          Weiter einkaufen
        </a>
      </Shell>
    );
  }

  return (
    <Shell title="Zahlung konnte nicht verarbeitet werden">
      <p className="mb-8 text-lg">{state.message}</p>
      <a href={`/${countryCode}/checkout?step=payment`} className="btn btn--primary">
        Zurück zur Kasse
      </a>
    </Shell>
  );
};

const Shell = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center sm:px-8">
    <MatesEyes size={160} alt="" className="mb-6 max-w-full" />
    <h1 className="mb-4! text-[clamp(36px,5vw,56px)]! leading-[.95]! text-accent">{title}</h1>
    {children}
  </div>
);
