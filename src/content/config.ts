import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Define the values collection
const values = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/values' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
  }),
});

// Define the about-us collection
const aboutUs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/about-us' }),
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = {
  values,
  'about-us': aboutUs,
};
