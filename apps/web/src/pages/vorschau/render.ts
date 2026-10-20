import { getCollection } from "astro:content";
import reactRenderer from "@astrojs/react/server.js";
import type { APIRoute } from "astro";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { z } from "astro/zod";
import AboutUsPage from "../../components/pages/AboutUsPage.astro";
import FaqPage from "../../components/pages/FaqPage.astro";
import GastronomiePage from "../../components/pages/GastronomiePage.astro";
import GrowkitsPage from "../../components/pages/GrowkitsPage.astro";
import LandingPage from "../../components/pages/LandingPage.astro";
import MushroomsPage from "../../components/pages/MushroomsPage.astro";
import TinkturenPage from "../../components/pages/TinkturenPage.astro";
import * as schemas from "../../lib/content-schemas";
import { pageStyles, prepareData } from "../../lib/preview";

// CMS-Vorschau: rendert die echte Seitenkomponente mit den Daten aus dem
// Editor (siehe public/admin/preview.js).
export const prerender = false;

const MAX_BYTES = 256 * 1024;

const headers = {
  "Content-Security-Policy":
    "sandbox; default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self'",
  "X-Robots-Tag": "noindex",
  "Cache-Control": "no-store",
};

// file (Name in public/admin/config.yml) -> Content-Collection, Komponente,
// echter Pfad (für die Stylesheets) und zugehörige Collection
const pages = {
  "landing-page": { schema: schemas.landingPage, Page: LandingPage, path: "/" },
  "about-us-page": {
    schema: schemas.aboutUsPage,
    Page: AboutUsPage,
    path: "/ueber-uns/",
  },
  "growkits-page": {
    schema: schemas.growkitsPage,
    Page: GrowkitsPage,
    path: "/growkits/",
    related: ["growkits", "growkits"],
  },
  "faq-page": { schema: schemas.faqPage, Page: FaqPage, path: "/faq/" },
  "gastronomie-page": {
    schema: schemas.gastronomiePage,
    Page: GastronomiePage,
    path: "/gastronomie/",
  },
  "tinkturen-page": {
    schema: schemas.tinkturenPage,
    Page: TinkturenPage,
    path: "/tinkturen/",
  },
  "mushrooms-page": {
    schema: schemas.mushroomsPage,
    Page: MushroomsPage,
    path: "/unsere-pilze/",
    related: ["mushrooms", "mushrooms"],
  },
} as const;

type Schema = {
  safeParse: (v: unknown) => {
    success: boolean;
    data?: unknown;
    error?: { issues: { path: (string | number)[]; message: string }[] };
  };
};

type PageKey = keyof typeof pages;

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
  });

export const POST: APIRoute = async ({ request, url }) => {
  if (
    !request.headers.get("content-type")?.startsWith("application/json") ||
    request.headers.get("x-preview") !== "1"
  ) {
    return json(400, "Ungültige Anfrage.");
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  const raw = declared > MAX_BYTES ? "" : await request.text();
  if (declared > MAX_BYTES || raw.length > MAX_BYTES) {
    return json(400, "Anfrage zu groß.");
  }

  let body: { file?: unknown; data?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, "Ungültiges JSON.");
  }
  if (
    typeof body.file !== "string" ||
    !Object.hasOwn(pages, body.file) ||
    !body.data ||
    typeof body.data !== "object"
  ) {
    return json(400, "Unbekannte Seite oder fehlende Daten.");
  }

  const def = pages[body.file as PageKey];
  const schemaOrFn = def.schema as unknown as
    | Schema
    | ((ctx: { image: () => unknown }) => Schema);
  const schema =
    typeof schemaOrFn === "function"
      ? schemaOrFn({ image: () => z.any() })
      : schemaOrFn;

  const parsed = schema.safeParse(prepareData(body.data));
  if (!parsed.success) {
    const fields = (parsed.error?.issues ?? [])
      .map(
        (i) =>
          `${i.path.join(".") || "(Seite)"}: ${
            i.message.includes("received undefined")
              ? "Pflichtfeld fehlt"
              : i.message
          }`,
      )
      .join("; ");
    return json(422, `Bitte diese Felder prüfen: ${fields}`);
  }

  const props: Record<string, unknown> = { data: parsed.data };
  if ("related" in def) {
    props[def.related[1]] = await getCollection(def.related[0]);
  }

  const container = await AstroContainer.create();
  container.addServerRenderer({
    name: "@astrojs/react",
    renderer: reactRenderer,
  });
  container.addClientRenderer({
    name: "@astrojs/react",
    entrypoint: "@astrojs/react/client.js",
  });
  let html = await container.renderToString(def.Page, {
    props,
    request: new Request(new URL(def.path, url.origin)),
  });

  const styleOrigin = import.meta.env.DEV
    ? url.origin
    : `http://127.0.0.1:${process.env.PORT ?? 4321}`;
  const styles = await pageStyles(def.path, styleOrigin);

  // Platzhalterbilder (data-URL) nicht durch /_image schicken
  html = html.replace(/<img\b[^>]*href=data%3A[^>]*>/gi, (tag) =>
    tag
      .replace(/\ssrcset="[^"]*"/i, "")
      .replace(
        /\ssrc="\/_image\/\?href=(data%3A[^&"]*)[^"]*"/i,
        (_, d) => ` src="${decodeURIComponent(d)}"`,
      ),
  );

  html = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<base\b[^>]*>/gi, "")
    .replace(/<head([^>]*)>/i, `<head$1><base href="/">`)
    .replace(/<\/head>/i, `${styles}</head>`);

  return new Response(html, {
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
  });
};
