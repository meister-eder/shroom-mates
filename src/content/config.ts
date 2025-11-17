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
    // SVG heading for about section (public directory)
    aboutUsHeadingSvg: z.string(),
    aboutUsTitle: z.string(),
    // Mushroom showcase section
    mushroomShowcaseHeadingSvg: z.string(),
    mushroomShowcaseTitle: z.string(),
    mushroomShowcaseImage: image(),
    mushroomShowcaseImageAlt: z.string(),
    mushroomShowcaseText: z.string(),
  }),
});

export const collections = {
  values,
  aboutUs,
  'landing-page': landingPage,
  mushrooms,
};
