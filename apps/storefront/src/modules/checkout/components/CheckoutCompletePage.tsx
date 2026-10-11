import { goToOrderConfirmation } from "@lib/checkout/order-handoff";
import { getCheckoutCartId, placeOrder } from "@lib/stores/cart";
import { useEffect, useState } from "react";

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
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="page-heading mb-4">Zahlung wird verarbeitet…</h1>
        <p className="text-muted">Bitte warte einen Moment, deine Bestellung wird abgeschlossen.</p>
      </div>
    );
  }

  if (state.kind === "pending") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="page-heading mb-4">Zahlung wird noch bestätigt</h1>
        <p className="text-muted mb-8">
          Das dauert länger als üblich. Du erhältst eine Bestätigungs-E-Mail, sobald deine
          Bestellung eingegangen ist.
        </p>
        <button type="button" className="btn-accent" onClick={() => setAttempt((a) => a + 1)}>
          Erneut prüfen
        </button>
      </div>
    );
  }

  if (state.kind === "no_cart") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="page-heading mb-4">Keine offene Bestellung gefunden</h1>
        <p className="text-muted mb-8">
          Falls deine Zahlung erfolgreich war, erhältst du eine Bestätigung per E-Mail.
        </p>
        <a href={`/${countryCode}/store`} className="btn-accent inline-block">
          Weiter einkaufen
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="page-heading mb-4">Zahlung konnte nicht verarbeitet werden</h1>
      <p className="text-muted mb-8">{state.message}</p>
      <a href={`/${countryCode}/checkout?step=payment`} className="btn-accent inline-block">
        Zurück zur Kasse
      </a>
    </div>
  );
};
