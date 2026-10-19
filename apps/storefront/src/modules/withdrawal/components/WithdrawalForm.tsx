import { sdk } from "@lib/sdk";
import { useState } from "react";

type Received = { id: string; received_at: string };

const formatReceivedAt = (iso: string) =>
  new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    dateStyle: "long",
    timeStyle: "long",
  }).format(new Date(iso));

/**
 * Online withdrawal (§ 356a BGB). Required fields are limited to name,
 * order number and email; the submit button must read "Widerruf bestätigen".
 */
export const WithdrawalForm = () => {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [received, setReceived] = useState<Received | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      order_reference: String(form.get("order_reference") ?? "").trim(),
      items: String(form.get("items") ?? "").trim() || undefined,
      message: String(form.get("message") ?? "").trim() || undefined,
    };

    setIsSending(true);
    setError("");
    try {
      const { withdrawal } = await sdk.client.fetch<{ withdrawal: Received }>(
        "/store/withdrawals",
        { method: "POST", body },
      );
      setReceived(withdrawal);
    } catch (err) {
      console.error("Withdrawal failed:", err);
      setError(
        "Dein Widerruf konnte nicht übermittelt werden. Bitte prüfe deine Angaben (Bestellnummer, keine Links) oder schreib uns an hey@shroom-mates.de – auch per E-Mail ist der Widerruf wirksam.",
      );
    } finally {
      setIsSending(false);
    }
  };

  if (received) {
    return (
      // biome-ignore lint/a11y/useSemanticElements: ARIA-Rolle bewusst gesetzt, natives Element würde Darstellung und Verhalten ändern
      <div className="shop-card p-6 space-y-3" role="status">
        <h2 className="checkout-step-title">Dein Widerruf ist eingegangen</h2>
        <p>
          Eingegangen am{" "}
          <strong>{formatReceivedAt(received.received_at)}</strong>. Eine
          Eingangsbestätigung mit dem Inhalt deiner Erklärung haben wir dir per
          E-Mail geschickt.
        </p>
        <p className="text-muted text-sm">
          Bitte sende die Ware an: shroom-mates GbR, Markranstädter Straße 8,
          04229 Leipzig. Wir melden uns zur Rückabwicklung. Referenz:{" "}
          {received.id}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="shop-card p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="input-label" htmlFor="withdraw-name">
            Name *
          </label>
          {/* biome-ignore lint/correctness/useUniqueElementIds: feste ID für label/aria-Verknüpfung, Komponente wird pro Seite nur einmal gerendert */}
          <input
            id="withdraw-name"
            name="name"
            required
            maxLength={200}
            autoComplete="name"
            className="input-field"
          />
        </div>
        <div>
          <label className="input-label" htmlFor="withdraw-email">
            E-Mail für die Bestätigung *
          </label>
          {/* biome-ignore lint/correctness/useUniqueElementIds: feste ID für label/aria-Verknüpfung, Komponente wird pro Seite nur einmal gerendert */}
          <input
            id="withdraw-email"
            name="email"
            type="email"
            required
            maxLength={320}
            autoComplete="email"
            className="input-field"
          />
        </div>
      </div>
      <div>
        <label className="input-label" htmlFor="withdraw-order">
          Bestellnummer *
        </label>
        {/* biome-ignore lint/correctness/useUniqueElementIds: feste ID für label/aria-Verknüpfung, Komponente wird pro Seite nur einmal gerendert */}
        <input
          id="withdraw-order"
          name="order_reference"
          required
          maxLength={12}
          pattern="#?\s*\d{1,10}"
          title="Bestellnummer, z. B. #12"
          inputMode="numeric"
          placeholder="z. B. #12"
          className="input-field"
        />
        <p className="text-xs text-muted mt-1">
          Steht in deiner Bestellbestätigung.
        </p>
      </div>
      <div>
        <label className="input-label" htmlFor="withdraw-items">
          Welche Artikel?{" "}
          <span className="label-optional">
            (optional – leer lassen für die ganze Bestellung)
          </span>
        </label>
        {/* biome-ignore lint/correctness/useUniqueElementIds: feste ID für label/aria-Verknüpfung, Komponente wird pro Seite nur einmal gerendert */}
        <input
          id="withdraw-items"
          name="items"
          maxLength={1000}
          className="input-field"
        />
      </div>
      <div>
        <label className="input-label" htmlFor="withdraw-message">
          Nachricht <span className="label-optional">(optional)</span>
        </label>
        {/* biome-ignore lint/correctness/useUniqueElementIds: feste ID für label/aria-Verknüpfung, Komponente wird pro Seite nur einmal gerendert */}
        <textarea
          id="withdraw-message"
          name="message"
          maxLength={2000}
          rows={3}
          className="input-field"
        />
      </div>

      {error && <p className="input-error">{error}</p>}

      <button type="submit" disabled={isSending} className="btn-accent w-full">
        {isSending ? "Wird gesendet…" : "Widerruf bestätigen"}
      </button>
    </form>
  );
};
