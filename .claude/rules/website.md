---
paths:
  - "apps/web/**"
  - "packages/ui/**"
---

# Website-Inhalte und SEO

- Inhalte, die Redakteure pflegen, stehen als Felder im Frontmatter (Schema in `content.config.ts`, Widgets in `public/admin/config.yml`), nicht als Markdown-Abschnitte, die eine Seite per Regex zerlegt. Listen (Schritte, Tipps) sind Listen-Felder.
- Jede Tatsache hat einen Ort: Produktdaten (Preis, Temperatur, Ernte) in Medusa, redaktionelle Texte im CMS, feste Shop-Fakten (Versand) in `@shroom-mates/ui/shop-facts`. Nicht in Seiten abschreiben.
- Structured Data: nur gültige Typen mit Pflichtfeldern (kein `Product` ohne `offers`), URLs und Bilder absolut, Ausgabe über den `jsonLd()`-Helper (escaped `<`). Keine `meta keywords`, kein `hreflang` ohne zweite Sprache.
- Kein `ClientRouter`; Seitenübergänge per CSS (`@view-transition`). Skripte sind Modul-Code, der einmal läuft (keine `astro:page-load`-Re-Inits).
- Datenschutz: keine Drittanbieter-Requests und kein Speichern im Browser vor einer Nutzeraktion, außer technisch notwendig (Allowlist im Privacy-Test `e2e/smoke/privacy.spec.ts`). Neues Tracking oder Einbettungen brauchen vorher eine Einwilligungslösung.
- Seiten-Markup steht in `src/components/pages/*Page.astro`, die Seiten unter `src/pages/` laden nur Daten; die CMS-Vorschau (`public/admin/preview.js`) rendert dieselben Komponenten über `/vorschau/render/` (Schemas in `src/lib/content-schemas.ts`). Neues Pflichtfeld oder neue Seite: Schema, `config.yml`, Komponente und `FILES` in `preview.js` zusammen anpassen.
