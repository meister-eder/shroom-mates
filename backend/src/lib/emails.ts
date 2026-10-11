/**
 * Plain HTML/text email templates (German). Rendered in subscribers and
 * passed to the notification provider as `content`.
 */

export type EmailContent = { subject: string; html: string; text: string };

type Money = number | string | null | undefined;

export type OrderAddress = {
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country_code?: string | null;
  phone?: string | null;
} | null | undefined;

export type OrderForEmail = {
  id: string;
  display_id?: number | null;
  email?: string | null;
  currency_code: string;
  item_total?: Money;
  shipping_total?: Money;
  tax_total?: Money;
  discount_total?: Money;
  total?: Money;
  items?: Array<{
    title?: string | null;
    product_title?: string | null;
    variant_title?: string | null;
    quantity?: Money;
    unit_price?: Money;
  } | null> | null;
  shipping_address?: OrderAddress;
  shipping_methods?: Array<{ name?: string | null } | null> | null;
};

const ACCENT = "#d63a00";
const SHOP_URL = process.env.SHOP_PUBLIC_URL || "https://shop.shroom-mates.de";
const CONTACT = process.env.EMAIL_REPLY_TO || "hey@shroom-mates.de";

const esc = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const num = (v: Money) => Number(v ?? 0) || 0;

const money = (amount: Money, currency: string) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: currency.toUpperCase() }).format(
    num(amount),
  );

const regionNames = new Intl.DisplayNames(["de"], { type: "region" });
const country = (code?: string | null) => {
  if (!code) return "";
  try {
    return regionNames.of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
};

function addressLines(a: OrderAddress): string[] {
  if (!a) return [];
  return [
    [a.first_name, a.last_name].filter(Boolean).join(" "),
    a.company,
    a.address_1,
    a.address_2,
    [a.postal_code, a.city].filter(Boolean).join(" "),
    country(a.country_code),
  ].filter((l): l is string => !!l);
}

function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${esc(title)}</title></head>
<body style="margin:0;padding:24px 12px;background:#fdfcea;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1d1d1d;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:2px solid #000;border-radius:12px;">
    <tr><td style="padding:24px 28px 8px;font-family:'DM Mono',ui-monospace,Menlo,monospace;font-size:20px;font-weight:700;color:${ACCENT};">shroom-mates</td></tr>
    <tr><td style="padding:8px 28px 28px;font-size:15px;line-height:1.55;">${body}</td></tr>
  </table>
  <p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#6b6b6b;text-align:center;">
    shroom-mates GbR · Markranstädter Straße 8 · 04229 Leipzig ·
    <a href="mailto:${esc(CONTACT)}" style="color:#6b6b6b;">${esc(CONTACT)}</a>
  </p>
</body></html>`;
}

function itemsTable(order: OrderForEmail): string {
  const rows = (order.items ?? [])
    .filter((i): i is NonNullable<typeof i> => !!i)
    .map((i) => {
      const name = i.product_title || i.title || "Artikel";
      const variant = i.variant_title && i.variant_title !== "Standard" ? ` (${i.variant_title})` : "";
      const qty = num(i.quantity);
      return `<tr>
        <td style="padding:6px 0;">${qty}× ${esc(name)}${esc(variant)}</td>
        <td style="padding:6px 0;text-align:right;white-space:nowrap;">${money(num(i.unit_price) * qty, order.currency_code)}</td>
      </tr>`;
    })
    .join("");

  const line = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:4px 0;${strong ? "font-weight:700;border-top:1px solid #ddd;padding-top:10px;" : "color:#6b6b6b;"}">${label}</td>
     <td style="padding:4px 0;text-align:right;${strong ? "font-weight:700;border-top:1px solid #ddd;padding-top:10px;" : "color:#6b6b6b;"}">${value}</td></tr>`;

  const shippingName = order.shipping_methods?.[0]?.name;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;margin:16px 0;">
    ${rows}
    <tr><td colspan="2" style="height:8px;"></td></tr>
    ${line("Zwischensumme", money(order.item_total, order.currency_code))}
    ${line(`Versand${shippingName ? ` (${esc(shippingName)})` : ""}`, money(order.shipping_total, order.currency_code))}
    ${num(order.discount_total) > 0 ? line("Rabatt", `−${money(order.discount_total, order.currency_code)}`) : ""}
    ${line("Gesamt", money(order.total, order.currency_code), true)}
    ${line("davon MwSt.", money(order.tax_total, order.currency_code))}
  </table>`;
}

function itemsText(order: OrderForEmail): string {
  const items = (order.items ?? [])
    .filter((i): i is NonNullable<typeof i> => !!i)
    .map((i) => `${num(i.quantity)}× ${i.product_title || i.title}${i.variant_title && i.variant_title !== "Standard" ? ` (${i.variant_title})` : ""} – ${money(num(i.unit_price) * num(i.quantity), order.currency_code)}`)
    .join("\n");
  return `${items}\n\nVersand: ${money(order.shipping_total, order.currency_code)}\nGesamt: ${money(order.total, order.currency_code)} (inkl. ${money(order.tax_total, order.currency_code)} MwSt.)`;
}

const orderNo = (o: OrderForEmail) => (o.display_id ? `#${o.display_id}` : o.id);

/** Confirmation to the customer. */
export function orderPlacedEmail(order: OrderForEmail): EmailContent {
  const name = order.shipping_address?.first_name;
  const greeting = name ? `Hallo ${esc(name)},` : "Hallo,";
  const address = addressLines(order.shipping_address);
  const subject = `Deine Bestellung ${orderNo(order)} bei shroom-mates`;

  const html = layout(
    subject,
    `<p>${greeting}</p>
     <p>danke für deine Bestellung! Wir haben sie erhalten und bereiten sie jetzt für den Versand vor. Sobald das Paket unterwegs ist, bekommst du eine weitere Mail mit der Sendungsnummer.</p>
     <p style="font-family:'DM Mono',ui-monospace,Menlo,monospace;font-weight:700;margin:20px 0 0;">Bestellung ${esc(orderNo(order))}</p>
     ${itemsTable(order)}
     ${address.length ? `<p style="margin:0 0 4px;font-weight:700;">Lieferadresse</p><p style="margin:0;color:#6b6b6b;">${address.map(esc).join("<br>")}</p>` : ""}
     <p style="margin-top:24px;">Fragen? Antworte einfach auf diese Mail.</p>
     <p>Viele Grüße<br>Emmelie &amp; Tim von shroom-mates</p>`,
  );

  const text = `${name ? `Hallo ${name},` : "Hallo,"}

danke für deine Bestellung! Wir haben sie erhalten und bereiten sie jetzt für den Versand vor. Sobald das Paket unterwegs ist, bekommst du eine weitere Mail mit der Sendungsnummer.

Bestellung ${orderNo(order)}
${itemsText(order)}

${address.length ? `Lieferadresse:\n${address.join("\n")}\n\n` : ""}Fragen? Antworte einfach auf diese Mail.

Viele Grüße
Emmelie & Tim von shroom-mates`;

  return { subject, html, text };
}

/** Internal notification to the shop owners. */
export function shopNewOrderEmail(order: OrderForEmail, adminUrl: string): EmailContent {
  const address = addressLines(order.shipping_address);
  const subject = `🍄 Neue Bestellung ${orderNo(order)} – ${money(order.total, order.currency_code)}`;
  const link = `${adminUrl.replace(/\/+$/, "")}/app/orders/${order.id}`;

  const html = layout(
    subject,
    `<p><strong>Neue Bestellung ${esc(orderNo(order))}</strong> von ${esc(order.email)}</p>
     ${itemsTable(order)}
     <p style="margin:0 0 4px;font-weight:700;">Versand an</p>
     <p style="margin:0;color:#6b6b6b;">${address.map(esc).join("<br>")}${order.shipping_address?.phone ? `<br>Tel. ${esc(order.shipping_address.phone)}` : ""}</p>
     <p style="margin-top:24px;"><a href="${esc(link)}" style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;border:2px solid #000;">Im Admin öffnen</a></p>`,
  );

  const text = `Neue Bestellung ${orderNo(order)} von ${order.email}

${itemsText(order)}

Versand an:
${address.join("\n")}

Admin: ${link}`;

  return { subject, html, text };
}

/** Shipping confirmation with tracking to the customer. */
export function shipmentEmail(
  order: OrderForEmail,
  tracking: Array<{ number: string; url: string }>,
): EmailContent {
  const name = order.shipping_address?.first_name;
  const subject = `Deine Bestellung ${orderNo(order)} ist unterwegs 📦`;
  const trackingHtml = tracking.length
    ? `<p>Hier kannst du die Sendung verfolgen:</p>
       <ul style="padding-left:18px;">${tracking
         .map((t) => `<li><a href="${esc(t.url)}" style="color:${ACCENT};">${esc(t.number)}</a></li>`)
         .join("")}</ul>`
    : "";

  const html = layout(
    subject,
    `<p>${name ? `Hallo ${esc(name)},` : "Hallo,"}</p>
     <p>gute Nachrichten: Deine Bestellung ${esc(orderNo(order))} ist auf dem Weg zu dir.</p>
     ${trackingHtml}
     <p>Viel Freude damit!<br>Emmelie &amp; Tim von shroom-mates</p>
     <p style="font-size:13px;color:#6b6b6b;">Mehr aus unserem Sortiment: <a href="${esc(SHOP_URL)}" style="color:#6b6b6b;">${esc(SHOP_URL.replace(/^https?:\/\//, ""))}</a></p>`,
  );

  const text = `${name ? `Hallo ${name},` : "Hallo,"}

gute Nachrichten: Deine Bestellung ${orderNo(order)} ist auf dem Weg zu dir.
${tracking.length ? `\nSendungsverfolgung:\n${tracking.map((t) => `${t.number}: ${t.url}`).join("\n")}\n` : ""}
Viel Freude damit!
Emmelie & Tim von shroom-mates`;

  return { subject, html, text };
}

/** DHL tracking page for a parcel number. */
export const dhlTrackingUrl = (number: string) =>
  `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${encodeURIComponent(number)}`;

export type WithdrawalForEmail = {
  id: string;
  name: string;
  email: string;
  order_reference: string;
  items?: string | null;
  message?: string | null;
  received_at: Date;
};

/** "11. Oktober 2026 um 17:30:12 MESZ" — receipt time incl. time zone. */
export const formatReceivedAt = (date: Date) =>
  new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    dateStyle: "long",
    timeStyle: "long",
  }).format(date);

const withdrawalStatement = (w: WithdrawalForEmail) =>
  `Hiermit widerrufe ich den Vertrag über ${
    w.items?.trim() ? `folgende Artikel: ${w.items.trim()}` : "alle Artikel"
  } der Bestellung ${w.order_reference}.`;

/** Receipt confirmation on a durable medium (§ 356a Abs. 4 BGB). */
export function withdrawalReceivedEmail(w: WithdrawalForEmail): EmailContent {
  const receivedAt = formatReceivedAt(w.received_at);
  const subject = `Eingangsbestätigung Ihres Widerrufs – Bestellung ${w.order_reference}`;
  const statement = withdrawalStatement(w);

  const html = layout(
    subject,
    `<p>Hallo ${esc(w.name)},</p>
     <p>Ihre Widerrufserklärung ist am <strong>${esc(receivedAt)}</strong> bei uns eingegangen.</p>
     <p style="margin:16px 0 4px;font-weight:700;">Inhalt Ihrer Erklärung</p>
     <p style="margin:0;padding:12px;background:#fdfcea;border:1px solid #ddd;border-radius:6px;">
       „${esc(statement)}“<br>
       Name: ${esc(w.name)} · E-Mail: ${esc(w.email)}${w.message?.trim() ? `<br>Nachricht: ${esc(w.message.trim())}` : ""}
     </p>
     <p>Bitte senden Sie die Ware an: shroom-mates GbR, Markranstädter Straße 8, 04229 Leipzig. Wir melden uns zur Rückabwicklung.</p>
     <p style="font-size:13px;color:#6b6b6b;">Diese E-Mail bestätigt nur den Eingang Ihrer Erklärung. Referenz: ${esc(w.id)}</p>`,
  );

  const text = `Hallo ${w.name},

Ihre Widerrufserklärung ist am ${receivedAt} bei uns eingegangen.

Inhalt Ihrer Erklärung:
„${statement}“
Name: ${w.name} · E-Mail: ${w.email}${w.message?.trim() ? `\nNachricht: ${w.message.trim()}` : ""}

Bitte senden Sie die Ware an: shroom-mates GbR, Markranstädter Straße 8, 04229 Leipzig. Wir melden uns zur Rückabwicklung.

Diese E-Mail bestätigt nur den Eingang Ihrer Erklärung. Referenz: ${w.id}`;

  return { subject, html, text };
}

/** Notification to the shop owners about a new withdrawal. */
export function shopWithdrawalEmail(w: WithdrawalForEmail, adminOrderUrl?: string): EmailContent {
  const subject = `↩️ Widerruf zu Bestellung ${w.order_reference}`;
  const receivedAt = formatReceivedAt(w.received_at);
  const html = layout(
    subject,
    `<p><strong>Neuer Widerruf</strong> – eingegangen am ${esc(receivedAt)}</p>
     <p>Bestellung: ${esc(w.order_reference)}${adminOrderUrl ? ` · <a href="${esc(adminOrderUrl)}">Im Admin öffnen</a>` : " (nicht automatisch zugeordnet)"}<br>
     Name: ${esc(w.name)}<br>E-Mail: ${esc(w.email)}<br>
     Artikel: ${esc(w.items?.trim() || "gesamte Bestellung")}${w.message?.trim() ? `<br>Nachricht: ${esc(w.message.trim())}` : ""}</p>
     <p style="font-size:13px;color:#6b6b6b;">Die Eingangsbestätigung wurde automatisch an den Kunden gesendet. Rückzahlung spätestens 14 Tage nach Eingang (bzw. nach Erhalt der Ware).</p>`,
  );
  const text = `Neuer Widerruf – eingegangen am ${receivedAt}
Bestellung: ${w.order_reference}${adminOrderUrl ? ` (${adminOrderUrl})` : " (nicht automatisch zugeordnet)"}
Name: ${w.name}
E-Mail: ${w.email}
Artikel: ${w.items?.trim() || "gesamte Bestellung"}${w.message?.trim() ? `\nNachricht: ${w.message.trim()}` : ""}`;
  return { subject, html, text };
}
