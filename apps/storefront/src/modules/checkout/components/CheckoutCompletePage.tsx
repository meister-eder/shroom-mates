import { $cart, completeCart } from "@lib/stores/cart";
import { useStore } from "@nanostores/react";
import { useEffect, useRef, useState } from "react";

interface CheckoutCompletePageProps {
    countryCode: string;
    checkoutId: string | null;
}

type State = "loading" | "completing" | "error";

export const CheckoutCompletePage = ({
    countryCode,
    checkoutId,
}: CheckoutCompletePageProps) => {
    const cart = useStore($cart);
    const [state, setState] = useState<State>("loading");
    const [errorMsg, setErrorMsg] = useState("");
    const attemptedRef = useRef(false);

    useEffect(() => {
        if (attemptedRef.current) return;
        attemptedRef.current = true;

        if (!checkoutId) {
            setState("error");
            setErrorMsg("Keine Checkout-ID in der URL gefunden.");
            return;
        }

        // If the cart is null, the order was likely already completed (webhook
        // completed and cleared the cart before the browser redirect landed).
        if (!cart) {
            // Redirect to the generic confirmed page — we don't have the order ID
            // since the cart was already cleared.
            window.location.href = `/${countryCode}/order/confirmed`;
            return;
        }

        const complete = async () => {
            setState("completing");
            try {
                const result = await completeCart();
                if (result.type === "order") {
                    try {
                        sessionStorage.setItem(
                            "medusa_order",
                            JSON.stringify(result.order),
                        );
                    } catch { }
                    window.location.href = `/${countryCode}/order/${result.order.id}`;
                } else if (result.type === "already_completed") {
                    window.location.href = `/${countryCode}/order/confirmed`;
                } else {
                    setState("error");
                    setErrorMsg(
                        result.error.message ||
                        "Zahlung fehlgeschlagen. Bitte versuche es erneut.",
                    );
                }
            } catch (err) {
                console.error("Failed to complete order after payment redirect:", err);
                setState("error");
                setErrorMsg("Bestellung konnte nicht abgeschlossen werden. Bitte versuche es erneut.");
            }
        };

        complete();
    }, [cart, checkoutId, countryCode]);

    if (state === "error") {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                <h1 className="text-3xl font-bold mb-4">
                    Zahlung konnte nicht verarbeitet werden
                </h1>
                <p className="text-gray-600 mb-8">{errorMsg}</p>
                <a
                    href={`/${countryCode}/checkout?step=payment`}
                    className="inline-block bg-black text-white py-3 px-8 rounded-md hover:bg-gray-800 transition-colors"
                >
                    Zurück zur Kasse
                </a>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <h1 className="text-3xl font-bold mb-4">Zahlung wird verarbeitet…</h1>
            <p className="text-gray-600">
                Bitte warte einen Moment, deine Bestellung wird abgeschlossen.
            </p>
        </div>
    );
};
