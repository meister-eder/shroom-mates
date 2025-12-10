import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Define the values collection (kept for backward compatibility if needed)
const values = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/values' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
  }),
});

// Define the about-us collection (kept for backward compatibility if needed)
const aboutUs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/about-us' }),
  schema: z.object({
    title: z.string(),
  }),
});

// Define the mushrooms collection - individual mushroom types
const mushrooms = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/mushrooms' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    image: image(),
    imageAlt: z.string(),
    // Background color for the mushroom text box (e.g. "#fff7e6" or "rgba(255,255,255,0.9)")
    color: z.string().optional(),
    order: z.number(),
  }),
});

// Define the landing-page collection - unified content for the index page
const landingPage = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/landing-page' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    // Use image() helper for optimized images in src/assets/
    // These paths will be automatically resolved to ImageMetadata
    heroImage: image(),
    heroImageAlt: z.string(),
    logoImage: image(),
    logoImageAlt: z.string(),
    heroTitle: z.string(),
    teaserText: z.string(),
    values: z.array(z.object({
      title: z.string(),
      // SVG headings are stored in public/ directory, so they remain strings
      // PagesCMS outputs them to /assets/headings/ which is publicly accessible
      headingSvg: z.string(),
      description: z.string(),
    })),
    // Mushroom showcase section
    mushroomShowcaseHeadingSvg: z.string(),
    mushroomShowcaseTitle: z.string(),
    mushroomShowcaseImage: image(),
    mushroomShowcaseImageAlt: z.string(),
    // Description of growing methods to display before mushrooms
    mushroomShowcaseGrowingMethodsText: z.string().optional(),
  }),
});

// Define the about-us-page collection - content for the about us page
const aboutUsPage = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/about-us-page' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    heroTitle: z.string(),
    heroSubtitle: z.string(),
    // Multiple images for lab photos and team photos
    // With PagesCMS multiple image field, this becomes an array of image paths
    images: z.array(image()),
  }),
});

// Define the growkits-page collection - generic instructions for all growkits
const growkitsPage = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/growkits-page' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    heroTitle: z.string(),
    heroSubtitle: z.string(),
    // Hero/intro image for the growkits tutorial page
    heroImage: image(),
    heroImageAlt: z.string(),
    // CTA section content
    ctaTitle: z.string(),
    ctaText: z.string(),
    ctaButtonText: z.string(),
    ctaButtonLink: z.string(),
  }),
});

// Define the growkits collection - variety-specific notes for each growkit type
const growkits = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/growkits' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    image: image(),
    imageAlt: z.string(),
    // Background color for the growkit section (e.g. "#fff7e6" or "rgba(255,255,255,0.9)")
    color: z.string().optional(),
    order: z.number(),
  }),
});

// Define the FAQ page collection - FAQ items as an array in a single file
const faqPage = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq-page' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // FAQ items as an array
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
      link: z.string().optional(),
    })),
  }),
});

export const collections = {
  values,
  aboutUs,
  'landing-page': landingPage,
  mushrooms,
  'about-us-page': aboutUsPage,
  'growkits-page': growkitsPage,
  growkits,
  'faq-page': faqPage,
};
