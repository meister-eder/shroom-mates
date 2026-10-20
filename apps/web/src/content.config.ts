import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import * as schemas from "./lib/content-schemas";

// Seiten-Collections haben je eine Datei (content.md); Texte und Alt-Texte,
// die auf den Seiten stehen, kommen aus dem Frontmatter. Bilder per image()
// (relativ zur Content-Datei, siehe media_folder in public/admin/config.yml).
// Felder müssen zu public/admin/config.yml passen.

const pageLoader = (name: string) =>
  glob({ pattern: "**/*.md", base: `./src/content/${name}` });

// Einzelne Pilzsorte auf /unsere-pilze/
const mushrooms = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/mushrooms" }),
  schema: schemas.mushrooms,
});

const mushroomsPage = defineCollection({
  loader: pageLoader("mushrooms-page"),
  schema: schemas.mushroomsPage,
});

const landingPage = defineCollection({
  loader: pageLoader("landing-page"),
  schema: schemas.landingPage,
});

const aboutUsPage = defineCollection({
  loader: pageLoader("about-us-page"),
  schema: schemas.aboutUsPage,
});

const growkitsPage = defineCollection({
  loader: pageLoader("growkits-page"),
  schema: schemas.growkitsPage,
});

// Variantenspezifische Hinweise je Growkit
const growkits = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/growkits" }),
  schema: schemas.growkits,
});

const faqPage = defineCollection({
  loader: pageLoader("faq-page"),
  schema: schemas.faqPage,
});

const gastronomiePage = defineCollection({
  loader: pageLoader("gastronomie-page"),
  schema: schemas.gastronomiePage,
});

// Tinkturen stehen auf der Seite selbst (nicht als einzelne Dateien), damit
// Quellenverweise (#quelle-1, …) auf eine gemeinsame Liste zeigen können.
const tinkturenPage = defineCollection({
  loader: pageLoader("tinkturen-page"),
  schema: schemas.tinkturenPage,
});

export const collections = {
  "landing-page": landingPage,
  mushrooms,
  "mushrooms-page": mushroomsPage,
  "about-us-page": aboutUsPage,
  "growkits-page": growkitsPage,
  growkits,
  "faq-page": faqPage,
  "gastronomie-page": gastronomiePage,
  "tinkturen-page": tinkturenPage,
};
