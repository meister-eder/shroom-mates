// Hilfsfunktionen für die CMS-Vorschau (src/pages/vorschau/render.ts):
// Bildauflösung und Platzhalter, Stylesheets der echten Seite.

const assetImages = import.meta.glob<ImageMetadata>(
  "/src/assets/images/**/*.{jpg,jpeg,png,webp,avif,gif}",
  { eager: true, import: "default" },
);

/** Felder, die in den Content-Schemas `image()` sind. */
const IMAGE_KEY = /^(image|heroImage)$/;

const escapeXml = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[
        c
      ] as string,
  );

/** Neutrales Platzhalterbild (SVG als data-URL, wird von astro:assets nicht umgerechnet). */
function placeholder(alt: string): ImageMetadata {
  const lines = [alt, "Neues Bild – erscheint nach dem Speichern"].filter(
    Boolean,
  );
  const text = lines
    .map(
      (l, i) =>
        `<text x="400" y="${280 + i * 40}" text-anchor="middle" font-family="sans-serif" font-size="26" fill="#555">${escapeXml(l.slice(0, 60))}</text>`,
    )
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#e8e4da"/>${text}</svg>`;
  return {
    src: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    width: 800,
    height: 600,
    format: "svg",
  } as unknown as ImageMetadata;
}

/** Sucht das Bild zu einem Pfad wie `../../assets/images/fotos/x.jpg`. */
function resolveImage(value: string): ImageMetadata | undefined {
  const rel = value
    .replace(/^(\.\.?\/)+/, "")
    .replace(/^\/?(apps\/web\/)?(src\/)?assets\/images\//, "");
  const key = Object.keys(assetImages).find((k) =>
    k.endsWith(`/assets/images/${rel}`),
  );
  return key ? assetImages[key] : undefined;
}

/**
 * Ersetzt Bildpfade durch Bild-Metadaten (oder Platzhalter) und entfernt
 * leere Werte, wie es auch `omit_empty_optional_fields` im CMS tut.
 */
export function prepareData(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(prepareData);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === null || v === undefined || v === "") continue;
      if (IMAGE_KEY.test(k) && typeof v === "string") {
        const alt = obj[`${k}Alt`] ?? obj.imageAlt ?? obj.heroImageAlt ?? "";
        out[k] = resolveImage(v) ?? placeholder(String(alt));
      } else {
        out[k] = prepareData(v);
      }
    }
    return out;
  }
  return value;
}

const styleCache = new Map<string, string>();

/** Stylesheets (`<link>` und `<style>`) der echten, vorgerenderten Seite. */
export async function pageStyles(path: string, origin: string) {
  const cached = styleCache.get(path);
  if (cached !== undefined) return cached;
  try {
    const res = await fetch(new URL(path, origin));
    if (!res.ok) return "";
    const html = await res.text();
    const head = html.slice(0, html.indexOf("</head>"));
    const parts = [
      ...(head.match(/<link\b[^>]*\brel=["']?stylesheet["']?[^>]*>/gi) ?? []),
      ...(head.match(/<style\b[\s\S]*?<\/style>/gi) ?? []),
    ];
    const css = parts.join("\n");
    if (!import.meta.env.DEV) styleCache.set(path, css);
    return css;
  } catch {
    return "";
  }
}
