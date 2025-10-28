# Image Handling with PagesCMS and Astro

## Overview

This document explains how images are properly handled in this project when uploaded via PagesCMS and used in Astro Content Collections.

## The Solution: Astro's `image()` Helper

Astro provides a built-in `image()` helper function for Content Collection schemas that automatically resolves image paths to `ImageMetadata` objects. This is the **recommended approach** for type-safe image handling.

### Why Use `image()` Instead of `z.string()`?

**Before (Problematic):**
```typescript
schema: z.object({
  heroImage: z.string(), // ❌ Loses type information, no optimization
  logoImage: z.string(), // ❌ Requires manual resolution
})
```

**After (Correct):**
```typescript
schema: ({ image }) => z.object({
  heroImage: image(), // ✅ Type-safe, auto-optimized
  logoImage: image(), // ✅ Direct use with <Image /> component
})
```

### Benefits

1. **Type Safety** - TypeScript knows it's an `ImageMetadata` object
2. **Automatic Resolution** - Astro resolves paths to optimized image objects
3. **Direct Use** - No manual import.meta.glob or path resolution needed
4. **Build-Time Optimization** - Images are optimized during build
5. **Performance** - Automatic width, height, format optimization

## Directory Structure

### Images for Optimization (`src/assets/images/`)

**Purpose:** Images that should be optimized by Astro
- **Location:** `src/assets/images/`
- **PagesCMS Config:** 
  ```yaml
  input: src/assets/images
  output: src/assets/images
  ```
- **Usage in Markdown:** Relative paths from content file
  ```markdown
  heroImage: ../../assets/images/hero_rose_tasse.jpg
  ```
- **Schema Type:** `image()` helper
- **Result:** Optimized WebP/AVIF with responsive srcsets

### SVG Files for Public Access (`public/assets/headings/`)

**Purpose:** SVG files accessed directly without optimization
- **Location:** `public/assets/headings/`
- **PagesCMS Config:**
  ```yaml
  input: public/assets/headings
  output: /assets/headings
  ```
- **Usage in Markdown:** Absolute paths from public root
  ```markdown
  headingSvg: /assets/headings/nachhaltig.svg
  ```
- **Schema Type:** `z.string()`
- **Result:** Served as-is from public directory

## Content Collection Schema

Located in `src/content/config.ts`:

```typescript
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const landingPage = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/landing-page' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    
    // ✅ Use image() for optimized images in src/assets/
    heroImage: image(),
    heroImageAlt: z.string(),
    logoImage: image(),
    logoImageAlt: z.string(),
    
    // Regular strings for text content
    heroTitle: z.string(),
    teaserText: z.string(),
    
    values: z.array(z.object({
      title: z.string(),
      // ✅ SVGs in public/ remain as strings
      headingSvg: z.string(),
      description: z.string(),
    })),
    
    // ✅ SVG heading in public directory
    aboutUsHeadingSvg: z.string(),
    aboutUsTitle: z.string(),
  }),
});

export const collections = {
  'landing-page': landingPage,
};
```

## Usage in Components

### Using Optimized Images

In `src/pages/index.astro`:

```astro
---
import { Image } from "astro:assets";
import { getCollection } from "astro:content";

const landingPageEntries = await getCollection("landing-page");
const landingPageContent = landingPageEntries[0];

// ✅ Images are already resolved to ImageMetadata
const { heroImage, heroImageAlt, logoImage, logoImageAlt } = landingPageContent.data;
---

<!-- ✅ Direct use with Astro Image component -->
<Image
  src={heroImage}
  alt={heroImageAlt}
  width={1920}
  height={1080}
  priority
  format="webp"
/>

<Image
  src={logoImage}
  alt={logoImageAlt}
  width={200}
  height={200}
  format="webp"
/>
```

### Using Public SVGs

SVG files in the public directory are accessed as strings:

```astro
---
const { aboutUsHeadingSvg, values } = landingPageContent.data;
---

<!-- ✅ String paths work for public files -->
<SvgHeading src={aboutUsHeadingSvg} alt="Über Uns" />

{values.map(value => (
  <SvgHeading src={value.headingSvg} alt={value.title} />
))}
```

## PagesCMS Configuration

Located in `.pages.yml`:

```yaml
media:
  # Optimized images go to src/assets/
  - name: images
    label: Bilder (Optimiert)
    input: src/assets/images
    output: src/assets/images  # ✅ Changed from /assets/images
    categories: [image, video]
    description: Images here will be optimized by Astro
  
  # SVG headings go to public/
  - name: headings
    label: Überschriften (SVG)
    input: public/assets/headings
    output: /assets/headings
    categories: [image]
    description: SVG files served from public directory

content:
  - name: landing-page
    fields:
      # Image field with optimization
      - name: heroImage
        label: Hero-Bild
        type: image
        required: true
        options:
          media: images  # ✅ Uses optimized images media config
          extensions: [jpg, jpeg, png, webp]
      
      # SVG field from public directory
      - name: headingSvg
        label: Überschrift SVG
        type: image
        required: true
        options:
          media: headings  # ✅ Uses public headings media config
          extensions: [svg]
```

## Path Resolution

### For Optimized Images (src/assets/)

**In Content File:**
```markdown
---
heroImage: ../../assets/images/hero.jpg
---
```

**Resolved By Astro To:**
```typescript
{
  src: "/_astro/hero.hash123.webp",
  width: 1920,
  height: 1080,
  format: "jpg"
}
```

### For Public Files (public/)

**In Content File:**
```markdown
---
headingSvg: /assets/headings/nachhaltig.svg
---
```

**Remains As:**
```typescript
"/assets/headings/nachhaltig.svg"
```

## Best Practices

### ✅ Do's

1. **Use `image()` for optimized images** in `src/assets/`
2. **Use relative paths** in markdown frontmatter for src/assets images
3. **Use absolute paths** (from public root) for public directory files
4. **Provide alt text** for all images (accessibility requirement)
5. **Specify width/height** to prevent Cumulative Layout Shift (CLS)

### ❌ Don'ts

1. **Don't use `z.string()` for images** that should be optimized
2. **Don't use `import.meta.glob`** manually - let `image()` handle it
3. **Don't put optimized images in public/** - they won't be processed
4. **Don't forget ARIA labels** for SVG headings
5. **Don't use string type guards** - `image()` provides proper types

## Troubleshooting

### Issue: "Cannot find image"

**Problem:** Image path doesn't resolve
**Solution:** Check that the path is relative from the content file:
```markdown
heroImage: ../../assets/images/hero.jpg  # ✅ Correct
heroImage: /assets/images/hero.jpg       # ❌ Wrong for src/assets
```

### Issue: "Type 'string' is not assignable to ImageMetadata"

**Problem:** Using string type when image() is expected
**Solution:** Update your schema to use `image()`:
```typescript
schema: ({ image }) => z.object({
  heroImage: image(),  // ✅ Not z.string()
})
```

### Issue: Images not optimized in build

**Problem:** Images in public/ directory
**Solution:** Move to `src/assets/` and update paths to relative:
```yaml
# PagesCMS .pages.yml
input: src/assets/images
output: src/assets/images  # Not /assets/images
```

## Performance Benefits

Using `image()` helper provides:

- ✅ **Automatic WebP/AVIF conversion**
- ✅ **Responsive srcsets** for different screen sizes
- ✅ **Lazy loading** by default
- ✅ **Width/height attributes** to prevent layout shift
- ✅ **Optimized file sizes** (typically 60-80% smaller)
- ✅ **CDN-friendly hashed filenames** for cache busting

## Migration Guide

If you have existing string-based image fields:

1. **Update schema** to use `image()`:
   ```typescript
   // Before
   heroImage: z.string(),
   
   // After
   heroImage: image(),
   ```

2. **Update paths** in content files:
   ```markdown
   # Before
   heroImage: /assets/images/hero.jpg
   
   # After (for src/assets)
   heroImage: ../../assets/images/hero.jpg
   ```

3. **Update PagesCMS config**:
   ```yaml
   # Before
   output: /assets/images
   
   # After (for src/assets)
   output: src/assets/images
   ```

4. **Simplify components** - remove manual image resolution code:
   ```astro
   ---
   // Before: Manual resolution needed
   const allImages = import.meta.glob("/src/assets/images/*");
   const heroImageSrc = getImageFromAssets(data.heroImage);
   
   // After: Direct use
   const { heroImage } = data;
   ---
   <Image src={heroImage} alt="..." />
   ```

## References

- [Astro Images Guide](https://docs.astro.build/en/guides/images/)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Content Collection Schema with Images](https://docs.astro.build/en/guides/images/#images-in-content-collections)
- [PagesCMS Documentation](https://pagescms.org/docs/configuration)
