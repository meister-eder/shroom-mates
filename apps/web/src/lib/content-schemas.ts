import { z } from "astro/zod";

// Zod-Schemas der Content Collections (eigene Datei, damit die CMS-Vorschau
// sie zur Laufzeit importieren kann, ohne content.config.ts zu laden).
// Felder müssen zu public/admin/config.yml passen.

type ImageFn = () => z.ZodType<ImageMetadata>;

export const mushrooms = ({ image }: { image: ImageFn }) =>
  z.object({
    title: z.string(),
    image: image(),
    imageAlt: z.string(),
    latinName: z.string().optional(),
    // Kleine Pille auf dem Bild, z. B. „Nur im Sommer“
    badge: z.string().optional(),
    order: z.number(),
  });

export const mushroomsPage = z.object({
  title: z.string(),
  description: z.string(),
  heroEyebrow: z.string(),
  heroTitle: z.string(),
  heroLead: z.string(),
  heroImageAlt: z.string(),
  freshTag: z.string(),
  growkitLabel: z.string(),
  emptyText: z.string(),
  bandText: z.string(),
  ctas: z.array(
    z.object({
      label: z.string(),
      title: z.string(),
      text: z.string(),
      link: z.string(),
    }),
  ),
});

export const landingPage = ({ image }: { image: ImageFn }) =>
  z.object({
    // SEO-Titel; die Meta-Beschreibung ist teaserText
    title: z.string(),
    // Nur als Social-Media-Vorschaubild (og:image), nicht auf der Seite sichtbar
    heroImage: image(),
    heroTitle: z.string(),
    teaserText: z.string(),
    heroEyebrow: z.string(),
    heroPrimaryButton: z.string(),
    heroSecondaryButton: z.string(),
    heroMascotAlt: z.string(),
    heroBubble: z.string(),
    steps: z.object({
      title: z.string(),
      intro: z.string(),
      items: z.array(
        z.object({
          title: z.string(),
          // HTML (z. B. Links) erlaubt
          text: z.string(),
          // Ohne Bild erscheint eine Farbfläche
          image: image().optional(),
          imageAlt: z.string().optional(),
        }),
      ),
    }),
    products: z.object({
      title: z.string(),
      items: z.array(
        z.object({
          title: z.string(),
          text: z.string(),
          link: z.string(),
          image: image(),
          imageAlt: z.string(),
        }),
      ),
    }),
    gastro: z.object({
      label: z.string(),
      title: z.string(),
      text: z.string(),
      buttonText: z.string(),
      imageAlt: z.string(),
    }),
  });

export const aboutUsPage = ({ image }: { image: ImageFn }) =>
  z.object({
    title: z.string(),
    description: z.string(),
    heroTitle: z.string(),
    heroSubtitle: z.string(),
    heroName: z.string(),
    heroEmmiAlt: z.string(),
    heroTimAlt: z.string(),
    // Textabschnitte: je Eintrag ein Absatz, HTML (z. B. Links) erlaubt
    whoWeAre: z.array(z.string()),
    howWeWork: z.array(z.string()),
    valuesIntro: z.array(z.string()),
    whereText: z.array(z.string()),
    timeline: z.object({
      title: z.string(),
      items: z.array(
        z.object({
          year: z.string().optional(),
          title: z.string(),
          text: z.string(),
          image: image().optional(),
          imageAlt: z.string().optional(),
        }),
      ),
    }),
    values: z.array(
      z.object({
        title: z.string(),
        // HTML (z. B. Links) erlaubt
        text: z.string(),
        image: image(),
        imageAlt: z.string(),
      }),
    ),
    where: z.object({
      title: z.string(),
      address: z.string(),
      routeButton: z.string(),
      visitButton: z.string(),
      imageAlt: z.string(),
    }),
  });

export const growkitsPage = ({ image }: { image: ImageFn }) =>
  z.object({
    title: z.string(),
    description: z.string(),
    // Kleine Zeile über der Hauptzeile (H1)
    heroTitle: z.string(),
    heroHeadline: z.string(),
    heroSubtitle: z.string(),
    heroPrimaryButton: z.string(),
    heroSecondaryButton: z.string(),
    heroImage: image(),
    heroImageAlt: z.string(),
    kitsTitle: z.string(),
    kitDetailsLabel: z.string(),
    kitShopButton: z.string(),
    // Alt-Text für das Foto bei Schritten mit photo: true (Bild liegt im Template)
    guideHarvestImageAlt: z.string(),
    guide: z.object({
      title: z.string(),
      // Absätze, einfaches HTML (<strong>, <em>) erlaubt
      intro: z.array(z.string()),
      steps: z.array(
        z.object({
          title: z.string(),
          photo: z.boolean().default(false),
          // Absätze, einfaches HTML (<strong>, <em>) erlaubt
          text: z.array(z.string()),
        }),
      ),
    }),
    ctaTitle: z.string(),
    ctaText: z.string(),
    ctaShopButton: z.string(),
    ctaButtonText: z.string(),
    ctaButtonLink: z.string(),
    shippingLabel: z.string(),
    shippingText: z.string(),
  });

export const growkits = ({ image }: { image: ImageFn }) =>
  z.object({
    title: z.string(),
    image: image(),
    imageAlt: z.string(),
    order: z.number(),
    tone: z.enum(["pink", "lavender", "olive-soft"]),
    // Handle des Shop-Produkts (Link „Zum Shop“)
    shopHandle: z.string(),
    level: z.string(),
    temperature: z.string(),
    firstPins: z.string(),
    intro: z.string(),
    // Enthält einfaches HTML (<strong>, <em>)
    tips: z.array(z.string()),
    // Enthält einfaches HTML (<strong>, <em>)
    usage: z.string(),
  });

export const faqPage = z.object({
  title: z.string(),
  description: z.string(),
  heroEyebrow: z.string(),
  heroHeadline: z.string(),
  heroLead: z.string(),
  helpTitle: z.string(),
  helpText: z.string(),
  helpEmail: z.string(),
  helpButton: z.string(),
  moreLinkText: z.string(),
  faqs: z.array(
    z.object({
      question: z.string(),
      // HTML (z. B. Links) erlaubt
      answer: z.string(),
      link: z.string().optional(),
    }),
  ),
});

export const gastronomiePage = ({ image }: { image: ImageFn }) =>
  z.object({
    title: z.string(),
    description: z.string(),
    heroEyebrow: z.string(),
    heroTitle: z.string(),
    heroSubtitle: z.string().optional(),
    heroButton: z.string(),
    heroPhotos: z.array(z.object({ image: image(), imageAlt: z.string() })),
    // Nur als Social-Media-Vorschaubild (og:image)
    heroImage: image(),
    introTitle: z.string(),
    introText: z.string(),
    introText2: z.string().optional(),
    sortenTitle: z.string(),
    sorten: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        image: image(),
        imageAlt: z.string(),
      }),
    ),
    vorteileTitle: z.string(),
    // HTML (z. B. <strong>) erlaubt
    vorteile: z.array(z.string()),
    ctaTitle: z.string(),
    ctaText: z.string(),
    ctaButtonText: z.string(),
    ctaButtonLink: z.string(),
    ctaEmail: z.string().optional(),
  });

export const tinkturenPage = ({ image }: { image: ImageFn }) =>
  z.object({
    title: z.string(),
    description: z.string(),
    // Kleine Zeile über der Hauptzeile (H1)
    heroTitle: z.string(),
    heroHeadline: z.string(),
    // Nur als Social-Media-Vorschaubild (og:image)
    heroImage: image(),
    heroPhotoAlt: z.string(),
    introText: z.string(),
    facts: z.array(z.object({ label: z.string(), value: z.string() })),
    tinctures: z.array(
      z.object({
        title: z.string(),
        botanicalName: z.string(),
        image: image(),
        imageAlt: z.string(),
        size: z.string(),
        // HTML erlaubt, z. B. <sup><a href="#quelle-1">1</a></sup>
        description: z.string(),
      }),
    ),
    shopButton: z.string(),
    process: z.object({
      title: z.string(),
      intro: z.string(),
      steps: z.array(z.object({ title: z.string(), text: z.string() })),
    }),
    quellenTitle: z.string(),
    quellen: z.array(z.object({ title: z.string(), url: z.string() })),
    disclaimerText: z.string(),
  });
