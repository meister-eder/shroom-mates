# TODO — Shop & Website

Stand: 2026-10-11, aus dem Dogfood-Test auf dem netcup-Testserver
(Bericht + Screenshots: `dogfood-output/2026-10-11/`, nicht im Repo).
IDs verweisen auf den Bericht.

## Erledigt (auf `shop`, Testserver)

- [x] C1 Shop-Links ohne `/de` leiteten auf `http://localhost:4321` um
- [x] C2 `/de/checkout/complete` erzeugte 0,00-€-Bestellungen aus leeren Warenkörben (Frontend + Backend-Hook)
- [x] H1 Produktbilder fehlten (Seed-Bilder nicht deployt, Upload-Volume am falschen Pfad, Optimierer am Testzertifikat gescheitert, alte URLs in der DB)
- [x] H2 Warenkorb-Leiste lag unter dem Header, Schließen-Button nicht klickbar
- [x] H5 (Teil) Bestell-Button „Zahlungspflichtig bestellen“ + Hinweis mit Links zu AGB/Widerruf/Datenschutz — **juristisch prüfen lassen**
- [x] H7 Website-Überschriften in System-Monospace statt DM Mono
- [x] M1 Eigene 404-Seiten für Website (inkl. Caddy) und Shop
- [x] M2 Unbekanntes Produkt → echte 404
- [x] M3 Bestellseite lädt die Bestellung serverseitig, unbekannte IDs → 404
- [x] M4 Kategoriefilter im Shop (Kategorien wurden nicht abgefragt)
- [x] M5 Kontaktformular behält die Nachricht bei Fehlern
- [x] M6 Adressprüfung: Hausnummer, fünfstellige PLZ (DE), Telefonformat
- [x] M7 (Teil) `aria-invalid` an fehlerhaften Adressfeldern
- [x] M8 Mobiles Cookie-Banner war 400 px hoch
- [x] M9 „Versand 0,00 €“ bevor Versand gewählt ist
- [x] M10 (Teil) Mobiler Shop-Header: kompakter Warenkorb-Button, „← Website“ bricht nicht mehr um
- [x] M11 Produktseite: leere Attribute, einzelnes Vorschaubild, überlaufender Varianten-Chip
- [x] M15 React-Hydration-Fehler im Checkout (Checkout/Warenkorb nur im Client, Header-Warenkorb hydration-sicher)
- [x] L1 „Mehr über uns“ war fest auf die Live-Domain verdrahtet
- [x] L3 Leerzeichen in „shroom-mates !“
- [x] L4 Ländernamen auf Deutsch („Deutschland“ statt „Germany“/„DE“)
- [x] Impressum: leerer `mailto:`-Link
- [x] Produktions-Compose baute das Backend mit falschem Build-Kontext
- [x] E-Mails: Bestellbestätigung, „Neue Bestellung“ an den Shop, Versandmail mit DHL-Tracking (Resend)
- [x] Seed legt frische Pilze als Entwurf an (online nur auf Anfrage)

## Recht & Inhalt (braucht euch, nicht Code)

- [ ] Resend: Domain `shroom-mates.de` verifizieren (DNS bei Namecheap) und `RESEND_API_KEY` als Secret in `netcup-test` anlegen
- [ ] Frische Pilze auf dem Testserver im Admin auf „Entwurf“ setzen (Lion's Mane, Pioppino, Black Pearl, White Pearl)
- [ ] Website: frische Pilze „auf Anfrage“ → Kontaktformular verlinken

- [ ] H4 AGB, Datenschutz, Widerruf im Shop sind Platzhalter (`[Name / Firma]`, `[Datum einfügen]`)
- [ ] H3 Datenschutzerklärung für die Website fehlt; Google Maps auf `/kontakt/` erst nach Klick laden; web3forms erwähnen
- [ ] H6 MwSt.: frische Pilze werden mit 19 % berechnet, AGB sagen 7 % — richtigen Satz klären, dann Steuerregel in Medusa
- [ ] H5 Button-Text und Hinweis juristisch absegnen lassen
- [ ] L12 AGB verlinken die EU-Streitschlichtungsplattform (seit Juli 2025 eingestellt)
- [ ] M12 Website sagt „Growkits bald im Onlineshop“; Produktnamen Website vs. Shop angleichen; „Im Shop kaufen“-Links
- [ ] M14 Tinkturen: falsches Foto bei Reishi+Cordyceps, Titel überlagert Flaschenetikett
- [ ] L2 `/ueber-uns/` ist nirgends verlinkt — verlinken oder löschen?
- [ ] L7 „Manuelle Zahlung (Test)“ vor Go-live aus der Region entfernen (in Produktion ohnehin gesperrt: `ALLOW_MANUAL_PAYMENT=false`)

## Redesign (Entscheidungen nötig)

- [ ] Einheitliche Überschriften-Typografie (heute 4 Stile; DM Mono hat kein Bold → 500 statt synthetischem 700)
- [ ] M16 Gemeinsamer Header/Footer für Website und Shop; gleiche Links (Shop, Rechtliches)
- [ ] Einheitlicher Karten-/Button-Stil im Shop (schwarze Outlines + Offset-Schatten wie auf der Website statt Tailwind-Grau)
- [ ] Startseite: sichtbare Headline + CTA, Weg in den Shop, kürzere Sektionen, besserer Mobile-Crop
- [ ] Produktkarten: Menge/Gewicht, Quick-Add, 2 Spalten auf Mobil, Platzhalter-Bild statt beigem Blob
- [ ] M13 Orange `#FF4908` erfüllt AA-Kontrast nicht (3,4:1) — dunkleres Orange für Text/Buttons
- [ ] Emojis als Icons (🛒🌱📦…) durch Line-Icons passend zu den Maskottchen ersetzen
- [ ] M10 Mobiler Shop-Header: Wortmarke fehlt, ggf. Menü
- [ ] L6 SumUp-Widget-Styling an die Marke anpassen; „Zahlungsmethode auswählen“ doppelt
- [ ] L11 FAQ doppelt auf `/faq/` und `/kontakt/` mit zwei Akkordeon-Designs

## Technik (später)

- [x] L5 Größere Touch-Ziele im Warenkorb; −/+ und 1–10-Auswahl vereinheitlicht
- [x] L8 Scroll-Reveal respektiert `prefers-reduced-motion`
- [x] L9 „In den Warenkorb“ hydriert sofort (`client:load`)
- [x] L10 Produkt-URLs mit Handles statt IDs (alte ID-Links → 301)
- [x] L12 Testserver nicht indexieren (X-Robots-Tag: noindex)
- [x] E2E-Tests an aktuelle UI angepasst (27/27 grün)
- [x] Biome-Konfiguration der Website repariert (CI-Lint nutzt die gepinnte Version)
- [ ] SumUp-Webhooks auf dem Testserver (selbstsigniertes Zertifikat) — mit echter Domain + Let's Encrypt erledigt
- [x] `logo_with_shrooms.png` von 8192 px / 5,8 MB auf 1024 px / 370 KB verkleinert
