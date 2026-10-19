import { goToOrderConfirmation } from "@lib/checkout/order-handoff";
import { getCheckoutCartId, placeOrder } from "@lib/stores/cart";
import { MatesEyes } from "@modules/common/components/MatesEyes";
import { type ReactNode, useEffect, useState } from "react";

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
export const CheckoutCompletePage = () => {
  const [state, setState] = useState<State>({ kind: "completing" });
  const [attempt, setAttempt] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: läuft bewusst nur bei den genannten Abhängigkeiten
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
          goToOrderConfirmation(result.order);
        } else if (result.type === "pending") {
          setState({ kind: "pending" });
        } else {
          setState({
            kind: "error",
            message:
              result.message ||
              "Zahlung fehlgeschlagen. Bitte versuche es erneut.",
          });
        }
      })
      .catch((err) => {
        console.error("Failed to complete order after payment redirect:", err);
        if (!cancelled) {
          setState({
            kind: "error",
            message:
              "Bestellung konnte nicht abgeschlossen werden. Bitte versuche es erneut.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (state.kind === "completing") {
    return (
      <Shell title="Zahlung wird verarbeitet…">
        <p className="shop-notice-sub">
          Bitte warte einen Moment, deine Bestellung wird abgeschlossen.
        </p>
      </Shell>
    );
  }

  if (state.kind === "pending") {
    return (
      <Shell title="Zahlung wird noch bestätigt">
        <p className="shop-notice-text">
          Das dauert länger als üblich. Du erhältst eine Bestätigungs-E-Mail,
          sobald deine Bestellung eingegangen ist.
        </p>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setAttempt((a) => a + 1)}
        >
          Erneut prüfen
        </button>
      </Shell>
    );
  }

  if (state.kind === "no_cart") {
    return (
      <Shell title="Keine offene Bestellung gefunden">
        <p className="shop-notice-text">
          Falls deine Zahlung erfolgreich war, erhältst du eine Bestätigung per
          E-Mail.
        </p>
        <a href="/shop/" className="btn btn--primary">
          Weiter einkaufen
        </a>
      </Shell>
    );
  }

  return (
    <Shell title="Zahlung konnte nicht verarbeitet werden">
      <p className="shop-notice-text">{state.message}</p>
      <a href="/shop/checkout/?step=payment" className="btn btn--primary">
        Zurück zur Kasse
      </a>
    </Shell>
  );
};

const Shell = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="shop-notice">
    <MatesEyes size={160} alt="" className="shop-eyes shop-eyes--wide" />
    <h1 className="shop-h1 shop-h1--sm">{title}</h1>
    {children}
  </div>
);
