# Polish – Bericht

Lauf 2026-10-20, Branch `polish` (von `shop` @ faa00fa). Quelle: Dogfood-Test auf staging.shroom-mates.de.
Ergebnis: alle Tasks erledigt (P2.4 vom Owner gestrichen), `scripts/verify.sh all` grün (lint, build, smoke, visual, backend).

## Änderungen

- **Header/Footer (P1.1–P1.5):** ein Header und ein Footer für alle Seiten, Logo führt immer zu `/`. Navigation skaliert fließend und bleibt ab 1024 px in einer Zeile (Smoke-Test 1024–1920 px). Laufband überall inkl. Shop-Fakten, pausiert bei Hover, Fokus und Tippen, dezentes Pause-Symbol. Footer mit allen Rechtslinks, Kontakt, FAQ. Titel einheitlich `… | shroom-mates`.
- **Übergänge (P1.6):** Header und Laufband bleiben beim Seitenwechsel stehen, das Laufband läuft nahtlos weiter, nur der Inhalt blendet kurz ein.
- **Überschriften (P1.7):** Shop-Titel nutzt die Größe der übrigen Seiten. Vom Orchestrator geparkt (Re-Baseline vom Auto-Mode abgelehnt), danach in der Hauptsession übernommen; nur `shop-katalog` neu aufgenommen.
- **Shop (P2.1–P2.6):** Busy-Zustand beim Schnell-Hinzufügen, Link „Pilzkorb ansehen“ im Panel, Pilzkorb-Pill auf Warenkorb/Kasse ist ein Link, optimistische Mengen-/Entfernen-Updates mit Rückfall, Skeleton beim Laden, Fehlermeldungen in der Kasse per `aria-describedby`, `/de/` → `/`.
- **Texte (P3.1–P3.2):** /tinkturen/ ohne Wirkversprechen (Vorher/Nachher: `git show c8480a1`), Kontakt mit nur einer Adresse, Austernseitlinge im Growkit-Text.
- **CSP (P4, P4.1):** erzwingbare CSP aus `fix/csp-enforce` übernommen; `unsafe-eval` nur für `/shop/checkout*` (SumUp). Caddyfile mit Docker validiert, Redirects und CSP-Header lokal geprüft.
- **Footer-Augen (P5.0):** weichere Graphit-Pupillen, zwei fehlende Augen ergänzt.

## Für Menschen

- Rechtliche Prüfung der /tinkturen/-Texte (`git show c8480a1`); außerdem „Vitalpilze“ (Startseiten-Teaser) und „Pilzextrakte“ (FAQ) ansehen.
- Ein echter SumUp-Sandbox-Checkout auf Staging mit offener Browser-Konsole (CSP).
- Schnell-Hinzufügen-Toast und Pilzkorb-Panel auf einem echten Handy prüfen.
- Entscheiden, ob „Austernpilze“ und „daily business“ auch auf Startseite, Pilze, Gastronomie und Über uns angeglichen werden.
- Produkttexte in Medusa: Wirkversprechen („maximale Bioverfügbarkeit“) und englische Stellen.
- Bild-URLs in der Staging-Datenbank (alte sslip-Adresse) per SQL umschreiben.
