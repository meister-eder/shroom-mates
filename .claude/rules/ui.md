---
paths:
  - "packages/ui/**"
  - "apps/**/*.astro"
  - "apps/**/*.css"
  - "apps/**/*.tsx"
---

# UI und Styles

- Farben, Abstände, Schriften nur über Tokens aus `packages/ui/src/tokens.css` (`tokens.ts` spiegelt sie für TS). Keine hartcodierten Hex-Werte; Alias-Namen nur, wo schon vorhanden.
- Geteiltes (Header, Footer, Wellen, Buttons/Pills) gehört nach `packages/ui`, nicht doppelt in die Apps.
- Schriften kommen lokal über `@fontsource` (Fraunces, Bricolage Grotesque, DM Mono), keine Google-Fonts- oder CDN-Links (CSP `script-src 'self'`).
- Bilder über `astro:assets` (`<Image>`/`<Picture>`) mit Breite/Höhe; dekorative Bilder `alt=""`.
- Interaktives nur mit nativen Elementen (`button`, `a`), sichtbarer Fokus, Tastaturbedienung; Animationen respektieren `prefers-reduced-motion`.
- Full-Bleed-Bereiche mit `var(--scrollbar-width)` statt reinem `100vw`.
- Design-Änderungen gegen die Regeln in `DESIGN.md` prüfen und Abweichungen dort unter „Bewusst abweichend“ notieren.
- Seitenkopf jeder Seite über `PageHero` (`@shroom-mates/ui/PageHero.astro`): eine `<h1>` mit Kennzeile + Titel, `.container`, `--page-top`. Keine eigenen Hero-Container oder Max-Breiten; `e2e/smoke/layout.spec.ts` prüft linke Kante und Oberkante aller Seiten.
