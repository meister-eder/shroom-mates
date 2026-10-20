# Design

Shroom Mates Redesign Version B, gilt für Website und Shop (beides `apps/web`). Geteilte Styles und Komponenten liegen in `packages/ui`.

## Quellen und Abgleich

Das Design wird in zwei Claude-Artefakten gepflegt. Der Code folgt ihnen, nicht umgekehrt (außer ein Wert wird ausdrücklich im Code geändert, dann Design System nachziehen).

- Design System (Tokens, Regeln, Komponenten-Richtlinien, Logo/Maskottchen/Footer-Fries):
  https://claude.ai/artifact/T2kLpXuMxp5FDZdbgYhG4U
- Redesign-Canvas Version B (Seiten und Layout, Desktop und Mobil):
  https://claude.ai/artifact/Nz3JUoeM5cuiMmvcaLMfzA

Lesen mit dem Artifact-Tool (action "read", für Dateien mit path), nicht per WebFetch.
Assets (Bilder) per action "list", scope "assets", dann einzeln per path=<id>.

### Zuordnung

- Tokens: `packages/ui/src/tokens.css` ↔ `project/tokens.json` im Design System
  (Namen 1:1 aus tokens.json; `base.css` importiert tokens.css, ältere Namen wie `--color-accent` oder die Namen `paper`, `lavender`, `olive-soft` sind nur Aliase darauf; `tokens.ts` spiegelt die Werte für TS)
- Regeln: diese Datei ↔ `project/README.md` im Design System
- Komponenten: Button, Pill, ProductCard, WaveDivider ↔ `project/components/*/README.md`
  (Button/Pill/Chip in `packages/ui/src/utilities.css`, WaveDivider/Header/Footer in `packages/ui/src`, Produktkarte als `.product-tile` in `apps/web/src/styles/shop.css` und `apps/web/src/components/ProductCard.astro`)
- Seiten: Sortiment, Produkt, Warenkorb, Kasse, Bestätigung, Mobil ↔ Boards `Shop*.dc.html` im Redesign-Canvas, Footer ↔ `Footer.dc.html`, Header ↔ `Header.dc.html`/`HeaderMobil.dc.html`
  (Kopie der Boards zum Stand der letzten Übernahme: `docs/redesign/version-b/latest/project/`)

### Abgleich (Artefakt → Code)

1. Beide Artefakte neu lesen (Stand kann sich seit der letzten Übernahme geändert haben).
2. Mit dem Repo vergleichen und nur die Unterschiede auflisten (Tokens, Komponenten, Seiten).
3. Allgemeine Änderungen (Tokens, geteilte Komponenten, Footer, Header) übernehmen, seitenspezifische einzeln nennen und nachfragen.
4. Bestehende Logik (Medusa, Warenkorb, Checkout, Produktdaten) bleibt unverändert; nur Markup und Styles.
5. Am Ende kurz berichten: was geändert, was bewusst abweichend gelassen.

### Rückweg (Code → Design System)

Wird im Code direkt etwas am Design geändert (Farbe, Abstand, Komponente), das Design System danach aus dem Repo abgleichen lassen, nur die Unterschiede.

## Regeln (Kurzfassung, maßgeblich ist das Design System)

- Orange nur für Linien und Headlines, nie schwarze/ink Schrift auf Orange.
- Buttons: ink-Fläche mit cream-Schrift.
- Eckig für Inhalte, rund (Pill) nur für Klickbares.
- Wellen nur zwischen hellen Flächen.
- Der Warenkorb heißt „Pilzkorb“ und hat ein Korb-Icon (kein Einkaufswagen).
- Bei Widersprüchen innerhalb des Design Systems gilt der Canvas (konkreter); Widerspruch im Design System notieren und dort klären.

## Bewusst abweichend (Stand 2026-10-19)

- Produktseite: zweite Statuspille aus dem Board fehlt (kein Datenfeld im Produkt); „So einfach geht's“-Schritte generisch statt sortenspezifisch; Band und „Passt dazu“ auch mobil sichtbar.
- Kasse: Adressfelder um Land, Bundesland, Firma, Telefon erweitert; SumUp-Widget statt Board-Platzhalter.
- Für Warenkorb, Kasse und Bestätigung mobil sowie `checkout/complete` gibt es keine Boards.
