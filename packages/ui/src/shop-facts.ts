/** Versandfakten des Shops. Die AGB (legal/agb.md) müssen bei Änderungen von Hand angepasst werden. */
export const SHIPPING = {
  standard: { price: "4,95 €", time: "3–5 Werktage" },
  express: { price: "9,95 €", time: "1–2 Werktage" },
  region: "innerhalb Deutschlands",
} as const;

export const GROW_STEPS = [
  {
    title: "Auspacken",
    text: "Kreuz in die Folie schneiden, an einen hellen Ort ohne direkte Sonne stellen.",
  },
  {
    title: "Feucht halten",
    text: "2–3 × täglich besprühen: feucht, nicht nass.",
  },
  {
    title: "Ernten",
    text: "Vorsichtig abdrehen, kurz bevor die Hüte komplett aufschirmen.",
  },
] as const;
