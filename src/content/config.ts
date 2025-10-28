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

// Define the landing-page collection - unified content for the index page
const landingPage = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/landing-page' }),
  schema: z.object({
    title: z.string(),
    heroImage: z.string(),
    heroImageAlt: z.string(),
    logoImage: z.string(),
    logoImageAlt: z.string(),
    heroTitle: z.string(),
    teaserText: z.string(),
    values: z.array(z.object({
      title: z.string(),
      headingSvg: z.string(),
      description: z.string(),
    })),
    aboutUsHeadingSvg: z.string(),
    aboutUsTitle: z.string(),
  }),
});

export const collections = {
  values,
  aboutUs,
  'landing-page': landingPage,
};
