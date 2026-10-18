# Redesign shroom-mates.de: Design-Übergabe

Stand: 2026-10-18. Quelle: Design-Board „shroom-mates.de Redesign“ (Claude Design, privat bei Tim).
Die Board-Quellen liegen unter `docs/redesign/boards/*.dc.html` und dienen nur als Referenz: HTML mit Inline-Styles, nicht übernehmbar.
`/_blob/<id>`-Bild-URLs funktionieren außerhalb des Boards nicht, die Zuordnung zu den Fotos steht unten.

Das Redesign gilt für **Website und Shop gemeinsam**. Ziel: Der Shop sieht aus wie ein Teil der Website und nicht wie ein Tailwind-Template.

## Richtung in einem Satz

Retro-Comic & Sticker: Die Maskottchen aus dem Logo sind die Hauptfiguren. Creme als Grund, Tinte als Linie, harte Offset-Schatten, leicht schräge Sticker-Karten in den Growkit-Kartonfarben. Dazu kommen dunkle Bänder (Footer mit der schwarz-weißen Pilz-Zeichnung, Growraum-Daten) als Kontrast.

## Entscheidungen zu „Redesign (Entscheidungen nötig)“ in TODO.md

| TODO | Entscheidung |
|---|---|
| Einheitliche Überschriften-Typografie | **Fraunces 900** mit `font-variation-settings: 'SOFT' 100, 'WONK' 1` für alle h1/h2. Das kommt der Logo-Schrift am nächsten. DM Mono nur noch für Labels/Eyebrows/Daten (400/500). Die SVG-Headings fallen weg. |
| Fließtext | **Bricolage Grotesque** 400–700 ersetzt Geist Sans |
| M16 gemeinsamer Header/Footer | Ja: `SiteHeader.astro` / `Footer.astro` in `packages/ui`, ein Prop `active`. Der Shop bekommt denselben Header mit Warenkorb-Button rechts neben „Kontakt“. |
| Karten/Buttons im Shop | Schwarze 2–3px-Outlines + Offset-Schatten, siehe Tokens. Kein Tailwind-Grau, keine weichen Schatten. |
| M13 Orange-Kontrast | `#ff4908` nur für große Headlines (≥ 24px bold) und Flächen **mit Tinte als Text**. Kleiner orange Text → `#bf2300`. Buttons: Primär = Tinte mit orangem Schatten, Akzent = Orange mit Tinte-Text. |
| Emojis als Icons | Raus. Inline-SVG-Strichicons (stroke 2–3px, round caps), Farbe `currentColor`. |
| Startseite | Sichtbare H1 „Hi, wir sind die shroom‑mates!“ (Umbruch fest vor dem Namen, Name `white-space: nowrap`) + 2 CTAs. Danach Comic-Ablauf → Sticker-Karten → Gastro-Teaser. |
| Produktkarten | StickerCard (s. u.), 2 Spalten auf Mobil, Preis/Gewicht in DM Mono rechts neben dem Namen. Platzhalter = Kartonfarbe + Rasterpunkte statt beigem Blob. |
| L11 FAQ doppelt | Nur noch `/faq/`, ein Akkordeon (aktive Frage lavendel hinterlegt). `/kontakt/` verlinkt dorthin. |
| L2 `/ueber-uns/` | Behalten und in Header + Footer verlinken (Seite ist im Board neu gestaltet). |

## Tokens

Bestehende Namen in `packages/ui/src/theme.css` bleiben, wo es passt. Neue kommen dazu:

```css
@theme {
  /* Flächen */
  --color-cream: #fdfcea;      /* Seitenhintergrund (war --color-bg-accent) */
  --color-paper: #f2eedb;      /* Daten-Bänder, Growraum-Board */
  --color-ink: #1d1d1d;        /* Text, Linien, Schatten (= --color-text) */
  --color-night: #141210;      /* Footer, dunkle Hero-Bänder */
  /* Akzent */
  --color-accent: #ff4908;     /* nur groß oder mit Tinte darauf */
  --color-accent-dark: #bf2300;/* kleiner Text in Orange, Links */
  --color-accent-light: #ff9c7e;/* Headlines auf --ink */
  /* Produktfarben (Growkit-Kartons) */
  --color-lavender: #b0b1f1;   /* Lion's Mane */
  --color-pink: #f5cbcd;       /* Rosenseitling, Reishi+Cordyceps */
  --color-olive-soft: #d8da8a; /* White Pearl, Tinkturen-Karte */
  --color-olive: #7e8503;
  --color-stone: #868174;      /* Black Pearl */

  --font-display: "Fraunces", serif;
  --font-body: "Bricolage Grotesque", system-ui, sans-serif;
  --font-mono: "DM Mono", monospace;

  --radius-card: 28px;  --radius-img: 16px;  --radius-pill: 999px;
  --shadow-btn: 4px 4px 0 var(--color-ink);
  --shadow-card: 8px 8px 0 var(--color-ink);
  --shadow-teaser: 10px 10px 0 var(--color-ink);
}
```

Container 1280px, Gutter 32px, Abschnittsabstand 88–96px.
Typo-Skala: h1 `clamp(40px, 8.4vw, 124px)` / lh .9 · h2 `clamp(40px, 5vw, 72px)` / .95 · h3 26–34px 800–900 · Lead 21/1.5 · Body 17/1.55 · Label 13–14px uppercase .12em DM Mono.
Fonts per `@fontsource-variable/fraunces` (mit SOFT/WONK-Achsen!) und `@fontsource-variable/bricolage-grotesque`.

## Bausteine (→ Komponenten)

- **Button**: Primär (Tinte, Creme-Text, `--shadow-btn` in Orange), Sekundär (2px Outline), Akzent (Orange, Tinte-Text, Tinte-Schatten). Immer Pille, ≥ 44px hoch.
- **NavPill**: 2px Outline, aktiv = Tinte gefüllt, `aria-current="page"`.
- **StickerCard**: Kartonfarbe als Fläche, 3px Tinte, `--radius-card`, `--shadow-card`, Bild mit 3px weißem Rand, `rotate(-2…+2deg)` abwechselnd. Hover: gerade + leicht anheben. Rotation aus bei `prefers-reduced-motion`. → Produktkarte im Shop.
- **ComicPanel**: nummeriertes Panel (DM Mono „01“) auf Tinte-Band, Bild oben mit 3px Unterkante. Für Abläufe (Spore→Ernte, Growkit-Anleitung, Tinktur-Herstellung, auch **Checkout-Schritte**).
- **SpeechBubble**: weiß, 2.5px Tinte, Radius 22, `rotate(-4deg)`, für Neuigkeiten (aktuell: Umzug in die Glasfabrik).
- ~~GrowroomBoard~~: **verworfen** (Technik fehlt). Für später merken: evtl. Livecam-Feed aus dem Growraum. Auch der Erntekalender auf der Gastro-Seite ist raus.
- **Ticker**: Laufband über dem Header (Tinte, DM Mono uppercase). Animation aus bei reduced motion.
- **Footer**: `--color-night`, Pilz-Zeichnung (`shroom-mates-drawing.png`, creme auf transparent) volle Breite oben, darunter „Bis bald in der Glasfabrik!“ (Fraunces, orange) + 4 Link-Spalten.
- **Formularfeld**: Label über dem Feld (fett), Feld 2px Tinte, Radius 14, Hintergrund Creme. Auswahl-Chips als echte `<button aria-pressed>`.
- **Rasterpunkte** `.dots`: `radial-gradient(#ff4908 1.6px, transparent 1.7px) 0 0/14px 14px`, Deko hinter Maskottchen/Hero-Bildern.

## Shop konkret

- Shop-Header = Website-Header (gleiche Komponente), plus Warenkorb-Pille (Akzent-Button mit Strich-Icon + Anzahl). „← Website“ entfällt, weil die Navigation identisch ist.
- Produktliste: StickerCards im Grid `repeat(auto-fill, minmax(280px, 1fr))`, auf Mobil 2 Spalten mit kleinerer Rotation (±1°).
- Produktseite: Bild als Sticker links, rechts Name (Fraunces), lateinischer Name (DM Mono kursiv), Varianten als NavPills, Preis groß in DM Mono, „In den Warenkorb“ = Primär-Button.
- Warenkorb-Leiste/Checkout: Creme-Flächen mit 3px-Tinte-Rahmen, Schritte als nummerierte ComicPanel-Köpfe (01 Adresse · 02 Versand · 03 Zahlung · 04 Prüfen). SumUp-Widget in eine weiße Karte mit Tinte-Rahmen setzen.
- Leere Zustände: Maskottchen + ein Satz („Hier wächst noch nichts.“).

## Inhaltliche Änderungen

- **Umzug**: Plagwitzer Markthalle → **Glasfabrik, Franz-Flemming-Straße 25, Leipzig-Leutzsch** (PLZ noch prüfen, im Board steht 04179). Betrifft Footer, Kontakt, FAQ, Über uns, Gastro, Impressum, Meta-Geo-Tags, Google-Maps-Link.
- Texte werden noch überarbeitet. Im Board sind sie gekürzt, `[eckige Klammern]` = Platzhalter.
- Tinkturen: Produkttexte bleiben die HCVO-geprüften Fassungen + Quellenliste.

## Fotos

Aus Drive `optics and design/Website Fotos` (Originale, im Board verkleinert eingesetzt):

Nummerierung wie im Board-Kontaktbogen (alphabetisch sortiert):
`#1 20250305_174300` Laborkittel → Comic „Beimpfen“ ·
`#2 20250305_174332` Growraum → Comic „Wachsen lassen“ ·
`#5 20250309_184151` Black Pearl ·
`#13 20250812_194927` Rosenseitling vor Wandbild → Growkit Rosenseitling ·
`#14 20250812_195027` rosa Lamellen → Bildband „Unsere Pilze“ ·
`#16 20250902_180025.png` Tim freigestellt → Über uns (Sticker) ·
`#17 20250902_180651` White Pearl vor Wandbild ·
`#19 20250902_182308` bunte Pilze von oben → „Frische Pilze“, Gastro ·
`#20 20250902_183049` Lion's Mane Makro ·
`#21 20251011_092625` Marktstand Lion's Mane → Gastro, Über uns ·
`#22 20251013_185250` Rosenseitling-Büschel ·
`#23 20251029_163225` Pioppino ·
`#27 20260218_185144` Schneidebrett → Gastro-Teaser ·
`#30 20260321_142258` Tinkturen + Reishi → Tinkturen ·
`#31 IMG_20251116_192030_083` Emmi am Markttisch in der **Glasfabrik** (Backsteinhalle) → Über uns, Zeitleiste „Glasfabrik“ ·
`#34 PXL_20250125_112625234.PORTRAIT` Emmi küsst gelben Austernpilz → Über uns Hero.
Personen: gelbe Mütze = Emmi. Die Backsteinhalle (#25, #31–33) ist die Glasfabrik.
Bestehende Assets bleiben: Logo/Maskottchen, `shroom-mates-drawing.png` (Footer), `growkits.jpg`, `tinkturen.jpeg`, Growkit-Fotos.

## Reihenfolge-Vorschlag

1. Tokens + Fonts in `packages/ui` (theme.css/base.css/utilities.css), Buttons/NavPill.
2. `SiteHeader`/`Footer` neu, in beiden Apps einsetzen.
3. Shop: Produktkarte, Produktseite, Warenkorb, Checkout.
4. Website-Seiten nach Board.
5. Glasfabrik-Adresse überall.

## SEO beim Relaunch (Pflicht)

Ein Redesign kostet kein Ranking, solange Inhalte, URLs und Technik erhalten bleiben.

1. **URLs unverändert lassen**: `/unsere-pilze/`, `/growkits/`, `/tinkturen/`, `/gastronomie/`, `/faq/`, `/kontakt/`, `/ueber-uns/`, `/impressum/` inkl. Trailing Slash. Jede Änderung → 301 im Caddyfile.
2. **`title` + `description` aus dem Frontmatter der Content-Collections übernehmen** (lokale Keywords wie „Growkits kaufen in Leipzig“, „Pilze für Gastronomie in Leipzig“). Nicht durch die verspielten Board-Headlines ersetzen.
3. **H1**: Die Board-Headlines sind Sprüche („Frag die Mates.“, „Zieh dir deine eigenen Mates.“). Das Keyword muss in der H1 stehen. Lösung: sachliche H1 (z. B. „Growkits aus Leipzig“) als Eyebrow-Zeile auszeichnen und den Spruch visuell groß als `<p>`. Alternativ: Spruch als H1, Keyword im ersten Absatz. Pro Seite genau eine H1.
4. **Inhalte nicht löschen**: Die Board-Texte sind gekürzt. FAQ, Growkit-Anleitung, Sortenbeschreibungen und Tinktur-Quellen vollständig behalten (lange Teile ggf. als `<details>`).
5. **Umzug = NAP-Konsistenz** (wichtiger als das Redesign): Adresse überall auf Glasfabrik, Franz-Flemming-Straße 25, Leipzig-Leutzsch. Betrifft `geo.position`/`ICBM`-Meta (aktuell Plagwitz 51.33, 12.33), `LocalBusiness`-JSON-LD (anlegen, falls nicht vorhanden), Impressum, Kontakt, Footer. Extern (macht das Team): Google-Unternehmensprofil, Instagram, Verzeichnisse.
6. **Technik**: Neue Fotos nur über `astro:assets` (Originale 2–6 MB). Fonts self-hosted mit `font-display: swap`, Display-Font preloaden. `X-Robots-Tag: noindex` vom Testserver darf nicht in Produktion. Alt-Texte aus dem Board übernehmen.
7. **Getrennte Subdomains bleiben** (Website + Shop): Beide als eigene Property in der Search Console, jeweils eigene Sitemap, self-referencing canonicals. Website ↔ Shop gegenseitig verlinken (Header/Footer, Produktseiten ↔ Sortenseiten), damit die Shop-Subdomain Autorität von der Hauptdomain bekommt. Gleiche Organisation/Logo im JSON-LD auf beiden.
8. **Nach dem Launch**: Sitemaps neu einreichen, Search Console 2–4 Wochen auf 404s/Crawling-Fehler beobachten.

Hinweis Schriftlizenz: Falls Bentley Vintage als Webfont kommt, zählen getrennte Subdomains bei der Grezline-Webfont-Lizenz vermutlich als zwei Websites (Extended-Lizenz deckt beides ab). Aktuell im Board: Fraunces als freier Ersatz.

## Shop-Screens (Board-Reihe „Shop“, Dateien `boards/Shop*.dc.html`)

Ersetzt den Abschnitt „Shop konkret“ oben im Detail. Produkte und Preise wie im Seed.

| Screen | Datei | Wichtig |
|---|---|---|
| Header | `ShopHeader` | = Website-Header, „Shop“ aktiv + Warenkorb-Pille (Akzent, Strich-Icon, Anzahl-Badge). Infozeile oben statt Laufband: Versand, selbst gezüchtet, SumUp. **Auch der Website-Header braucht einen „Shop“-Link** (fehlt im Board-Header noch). |
| Sortiment `/de/store` | `ShopStart` | Kurzer Hero mit freigestellten Tassen-Fotos, Kategorie-Chips mit Anzahl (Alles / Growkits / Tinkturen), StickerCards mit Quick-Add-Button („Rein ins Körbchen“) + Toast mit Maskottchen. **Frische Pilze gehören nicht in den Shop**: nur eine Link-Karte „Lieber frische Pilze? Zu unseren Sorten →“ zur Website-Sortenseite. Keine Vertrauensleiste. |
| Produktseite `/de/store/[handle]` | `ShopProdukt` | Sticker-Bild + Thumbnails, Kategorie-Pille, Titel + lateinischer Name, Preis groß in DM Mono, Varianten als Pillen, Mengen-Stepper (−/+), Häkchenliste, Akkordeon (Inhalt / Pflege / Versand). Darunter Comic-Band „So einfach geht's“ mit Link zur Website-Anleitung, „Passt dazu“ (Cross-Sell + Link zur Sortenseite auf der Website). |
| Warenkorb-Seitenleiste | `ShopWarenkorb` | 480px, Creme, 3px-Rahmen. Positionen als weiße Karten mit Stepper + „Entfernen“. Fuß auf `--paper` mit Zwischensumme, „Zur Kasse“ (Primär), „Weiter stöbern“. Leerer Zustand: Maskottchen + „Hier wächst noch nichts.“ |
| Kasse `/de/checkout` | `ShopCheckout` | Fortschrittsleiste mit 4 Pillen (01 Adresse · 02 Lieferung · 03 Zahlung · 04 Prüfen). Aktiver Schritt = Panel mit Lavendel-Kopf + harter Schatten, erledigte zeigen Zusammenfassung + „Ändern“, künftige gedimmt. Versand als Radio-Karten. SumUp-Widget in gestrichelter Karte, eigenes Styling, eine Überschrift. Bestell-Button orange mit Betrag. Rechts sticky Übersicht auf `--paper`. |
| Bestätigung `/de/checkout/complete` | `ShopDanke` | Hüpfende Maskottchen, „Danke, [Vorname]!“, 4-Schritte-Band „Wie es weitergeht“, Bestellübersicht, Link zum Growkit-Simulator. |
| Mobil Sortiment | `ShopMobilListe` | Header: Menü-Button links, Wortmarke Mitte, Warenkorb-Pille rechts. Menü = Vollbild-Overlay auf Tinte mit großen Fraunces-Links. Chips horizontal scrollbar, Produkte **2 Spalten**, runder +-Button (44px). |
| Mobil Produktseite | `ShopMobilProdukt` | Zurück-Button im Header, Bild mit Punkt-Navigation, **sticky Kaufleiste unten** (Stepper + „In den Warenkorb“). |

Offen / bewusst markiert:
- „Abholung in der Glasfabrik (kostenlos)“ ist ein **Vorschlag**, im Seed gibt es nur Standard 4,95 / Express 9,95.
- Austernseitlinge-Growkit: Ertrag fehlt `[Ertrag]`. Zahlarten bei SumUp `[ergänzen]`. Widerruf bei lebender Kultur juristisch prüfen.
- Footer im Shop braucht zusätzlich AGB, Widerruf, Gewährleistung (heute schon verlinkt).

## Bewegung (Board-Reihe „Bewegung“, Dateien `boards/Proto*.dc.html`)

Freigegeben: 1, 2, 3, 5. Alles mit `prefers-reduced-motion`-Fallback, Inhalte immer im HTML.

1. **Myzel-Faden** (`ProtoMyzel`): SVG-Pfad wächst beim Scrollen (`pathLength=1` + `stroke-dashoffset`), Abzweigungen + kleine Pilze an Knoten, Karten blenden ein, Pilz-Zeichnung steigt am Ende hoch. Umsetzung bevorzugt mit CSS Scroll-Driven Animations (`animation-timeline: view()/scroll()`), Fallback statisch.
2. **Augen folgen der Maus** (`ProtoEyes`): nur die Augen, die Pilze wachsen **nicht** einzeln heraus. Footer-Zeichnung als SVG mit Pupillen-Ebene, kleine JS-Insel (`pointermove`, rAF-gedrosselt). Mobil: still oder an Scroll gekoppelt.
3. **Maskottchen-Augen** (`ProtoMates`): nur die Augen folgen dem Mauszeiger, dazu ab und zu ein Blinzeln. Keine Lauf-/Hüpf-Animationen. Logo als SVG mit separater Augen-Ebene.
5. **Growkit-Simulator** (`ProtoGrowkit`): Svelte/Vue-Insel auf `/growkits/`. Kit wählen, sprühen, Tage vorspulen, Phasen Durchwachsen → Pins → Wächst → Erntereif → Überreif (Sporen), 3 Wellen, dann Kompost. Logik im Board-Script (`renderVals`) ist direkt übertragbar. Grafiken final als Illustrationen pro Phase.


## Änderungen nach Review (2026-10-18, Kommentare im Board)

- **Wording Shop**: Warenkorb heißt überall **„Pilzkorb“** (Header-Pille, Seitenleiste „Dein Pilzkorb“, Kasse, aria-labels). Button „In den Warenkorb“ → **„Rein ins Körbchen“**, Bestätigung „Liegt im Körbchen ✓“.
- **Website und Shop sind für Nutzer eine Seite**: keine Hinweise wie „auf shroom-mates.de“ oder „auf der Website“, einfach verlinken („Mehr über Lion's Mane →“, „Zur ganzen Anleitung →“).
- **Tinkturen-Seite**: Produktkarten verlinken direkt in den Shop („Im Shop kaufen“), kein „Anfragen“.
- **Frische Pilze**: nicht im Shop (s. o.), keine Kategorie, kein dunkles Band.
- **Shop-Vertrauensleiste** (Versand / selbst gezüchtet / SumUp) entfernt.
- **Weniger bunte Kacheln**: „Das ist uns wichtig“ (Über uns) und „Was auf den Teller kommt“ (Gastronomie) sind jetzt **bildgetrieben** statt farbiger Sticker-Kacheln: Über uns als Liste mit Nummer, Titel, Text und Foto pro Zeile, Gastro als Foto-Karten mit Bildunterschrift. Sticker-Kacheln nur noch sparsam (Produkte), nicht für Inhaltsabschnitte.
- **Bogen-Rahmen** (Tinkturen-Hero, `border-radius: 200px 200px 28px 28px` + Tinte-Rahmen + harter Schatten) gefällt und darf als Bildrahmen öfter vorkommen.
- **Umbrüche**: Headlines nie mit einem einzelnen Wort in der Zeile. Global `h1,h2{text-wrap:balance}`, `p{text-wrap:pretty}`, bei Schlüsselzeilen feste Umbrüche bzw. `white-space: nowrap`-Gruppen (z. B. Footer „Bis bald / in der Glasfabrik!“, „shroom‑mates!“ mit geschütztem Bindestrich).
- **Footer-Credit**: „gebaut mit [Pilz-Icon] und freier Software“ (Strich-Icon statt Wort, `role="img" aria-label="Pilzen"`).
- **Maskottchen**: laufen/hüpfen/fliegen verworfen. Übrig bleibt nur: **Augen der Mates folgen dem Mauszeiger** (+ gelegentliches Blinzeln), siehe `boards/ProtoMates.dc.html`. Dafür das Logo als SVG mit Augen als eigener Ebene (Augapfel + Pupille) exportieren.
