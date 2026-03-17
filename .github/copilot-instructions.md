# Copilot Instructions for Shroom-Mates Project

This project is a static website built with Astro 5, focused on **maximum performance and accessibility**. When working with this codebase, prioritize speed optimization and accessibility best practices in all suggestions and implementations.

## Project Overview

- **Framework**: Astro 5.14.6+ (Static Site Generation)
- **Language**: TypeScript (strict mode)
- **Build Tool**: Bun
- **Deployment Target**: Static hosting (shroom-mates.de)
- **Design System**: Custom with Geist font, playful aesthetic
- **Image Handling**: Astro Image component with aggressive optimization
- **Code Quality**: Biome for formatting and linting

## Core Principles

### 1. Performance First
- Target Core Web Vitals scores of 95+ 
- Minimize JavaScript hydration - leverage Astro's zero-JS by default
- Optimize images aggressively using Astro's built-in image optimization
- Implement efficient caching strategies

### 2. Accessibility First
- Follow WCAG 2.2 Level AA guidelines strictly
- Every interactive element must have proper ARIA labels
- Semantic HTML is mandatory
- Support keyboard navigation completely
- Screen reader compatibility is essential

## Image Optimization Guidelines

### Required Image Practices
```astro
---
// ✅ CORRECT: Use Astro's Image component for optimization
import { Image } from 'astro:assets';
import heroImage from '../assets/images/hero.jpg';
---

<!-- Always include alt text, width, height for CLS prevention -->
<Image 
  src={heroImage} 
  alt="Descriptive text explaining the image content"
  width={800}
  height={600}
  loading="lazy"
  decoding="async"
  format="webp"
/>

<!-- ✅ For above-the-fold images, use priority loading -->
<Image 
  src={heroImage} 
  alt="Hero image description"
  priority
  width={1200}
  height={600}
/>
```

### Image Format Strategy
- **Primary**: WebP with AVIF fallback for modern browsers
- **Legacy**: Automatic PNG/JPEG fallback
- **Responsive**: Always generate srcset for different screen sizes
- **Compression**: Quality 85-90 for photos, 90+ for graphics with text

### Caching Headers
```javascript
// In astro.config.mjs - configure static asset caching
export default defineConfig({
  build: {
    assets: 'assets',
    inlineStylesheets: 'auto',
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        quality: 85,
      },
    },
    breakpoints: [320, 640, 768, 1024, 1280, 1600],
  },
});
```

## Accessibility Requirements

### ARIA Labels and Semantic HTML
```astro
<!-- ✅ CORRECT: Proper button with accessible name -->
<button 
  aria-label="Toggle navigation menu"
  aria-expanded="false"
  aria-controls="navigation-menu"
>
  <span class="hamburger-icon" aria-hidden="true"></span>
</button>

<!-- ✅ CORRECT: Navigation landmarks with labels -->
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/contact">Kontakt</a></li>
    <li><a href="/impressum">Impressum</a></li>
  </ul>
</nav>

<!-- ✅ CORRECT: Main content landmark -->
<main aria-label="Page content">
  <!-- page content -->
</main>

<!-- ✅ CORRECT: Decorative images -->
<img src="decoration.svg" alt="" role="presentation">

<!-- ✅ CORRECT: Form labels -->
<label for="email">E-Mail-Adresse</label>
<input 
  type="email" 
  id="email" 
  name="email"
  autocomplete="email"
  required
  aria-describedby="email-help"
>
<p id="email-help">Wir verwenden deine E-Mail nur für die Kontaktaufnahme</p>
```

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Logical tab order (use tabindex="-1" only for programmatic focus)
- Visible focus indicators required
- Skip links for main content navigation

### Screen Reader Support
```astro
<!-- ✅ CORRECT: Screen reader only content -->
<span class="sr-only">Aktuelle Seite: </span>

<!-- ✅ CORRECT: Live regions for dynamic content -->
<div aria-live="polite" aria-atomic="true">
  <!-- Status updates appear here -->
</div>
```

## Component Architecture

### File Organization
```
src/
├── components/           # Reusable UI components
│   ├── ProductCard.astro     # Shared card for mushrooms, growkits & tinkturen
│   ├── Header.astro          # Site header with scroll-shrink behavior
│   ├── Footer.astro          # Site footer
│   ├── SvgHeading.astro      # SVG-based decorative headings
│   ├── Divider.astro         # Animated emoji divider (aria-hidden)
│   ├── ValuesSection.astro   # Values grid with ValueCard children
│   ├── FAQ.astro             # FAQ accordion
│   ├── ImageGallery.astro    # Image gallery grid
│   ├── LocationInfo.astro    # Location & map embed
│   └── UpcomingDates.astro   # Market dates listing
├── layouts/
│   └── Layout.astro      # Main layout (supports noBackground prop)
├── pages/                # Route pages
├── content/              # Astro Content Collections (Markdown)
│   ├── config.ts             # Collection schemas
│   ├── mushrooms/            # Mushroom entries
│   ├── growkits/             # Growkit entries
│   ├── tinkturen/            # Tincture entries
│   └── ...                   # Page content collections
├── scripts/              # Client-side TypeScript
│   ├── hamburger.ts          # Mobile nav (module-scoped cleanup)
│   └── contact-form.ts      # Contact form submission handler
├── assets/               # Images, icons (optimized by Astro)
├── styles/               # Global styles and utilities
└── utils/
    └── color.ts          # Readable text color contrast helper
```

### Key Reusable Components

#### ProductCard.astro
Used across mushrooms, growkits, and tinkturen pages for consistent product display:
```astro
<ProductCard
  title="Lion's Mane"
  image={lionsManeImage}
  imageAlt="Frischer Lion's Mane Pilz"
  color="#f0e6d3"
  headingLevel={3}
  subtitle="Hericium erinaceus"
  id="lions-mane"
>
  <p>Description content via slot</p>
</ProductCard>
```
Props: `title`, `image`, `imageAlt`, `color?`, `headingLevel?` (2|3), `subtitle?`, `id?`, `imageWidth?`, `imageHeight?`

#### Layout.astro
Main layout with props: `title`, `description?`, `ogImage?`, `isLandingPage?`, `noindex?`, `noBackground?`
- `noBackground` removes the checkered background pattern (used on unsere-pilze page)

### Component Best Practices
```astro
---
// Always define a Props interface
interface Props {
  title: string;
  description?: string;
  level?: 2 | 3; // For heading levels
}

const { title, description, level = 2 } = Astro.props;

// Dynamic heading for semantic hierarchy
const HeadingTag = `h${level}` as "h2" | "h3";
---

<div class="card">
  <HeadingTag>{title}</HeadingTag>
  {description && <p>{description}</p>}
  <slot />
</div>
```

## Performance Optimization

### Critical Performance Rules
1. **Zero JavaScript by default** - Only hydrate when necessary
2. **Inline critical CSS** - Above-the-fold styles in `<head>`
3. **Preload key resources** - Fonts, hero images
4. **Bundle splitting** - Separate vendor and app code
5. **Compression** - Enable gzip/brotli on server

### Build Optimization
```javascript
// astro.config.mjs
export default defineConfig({
  build: {
    inlineStylesheets: 'auto', // Inline small stylesheets
    assets: 'assets', // Consistent asset naming
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['astro']
          }
        }
      }
    }
  }
});
```

### Font Loading Strategy
```html
<!-- In Layout.astro head -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" href="/fonts/dm-mono-regular.woff2" as="font" type="font/woff2" crossorigin>
```

## Styling Guidelines

### CSS Architecture
- **Global styles**: Reset, utilities, design tokens
- **Component styles**: Scoped to component using Astro's style blocks
- **Responsive design**: Mobile-first approach
- **Performance**: Avoid layout thrashing, optimize repaints

### Utility Classes Pattern
```css
/* Global utilities for common patterns */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.focus-visible:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}
```

### Full-Bleed Layouts
When creating full-width sections that break out of their container, use scrollbar-aware widths to prevent horizontal overflow:
```css
/* ✅ CORRECT: Accounts for scrollbar on Windows/Linux */
.full-bleed {
  width: calc(100vw - var(--scrollbar-width, 0px));
  margin-left: calc(50% - (100vw - var(--scrollbar-width, 0px)) / 2);
}

/* ❌ INCORRECT: Causes horizontal scrollbar */
.full-bleed {
  width: 100vw;
  margin-left: calc(50% - 50vw);
}
```
The `--scrollbar-width` CSS variable is set dynamically by Layout.astro.

## Error Handling and Edge Cases

### Image Error Handling
```astro
---
import { Image } from 'astro:assets';
import fallbackImage from '../assets/fallback.jpg';

interface Props {
  src: string;
  alt: string;
  fallback?: ImageMetadata;
}

const { src, alt, fallback = fallbackImage } = Astro.props;
---

<Image 
  src={src} 
  alt={alt}
  onerror={`this.src='${fallback.src}'`}
  width={400}
  height={300}
/>
```

### Form Validation
```astro
<!-- Always provide validation feedback -->
<input 
  type="email" 
  id="email"
  name="email"
  required
  aria-invalid="false"
  aria-describedby="email-error"
>
<div id="email-error" role="alert" class="error-message">
  <!-- Error messages appear here -->
</div>
```

## Content Strategy

### German Language Content
- Use semantic HTML with proper `lang` attributes
- Implement proper hyphenation for German text
- Consider cultural context in UX patterns
- Maintain consistent terminology

### SEO Optimization
```astro
---
// In Layout.astro
interface Props {
  title: string;
  description: string;
  ogImage?: string;
}

const { title, description, ogImage } = Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
---

<head>
  <title>{title} | Shroom-Mates</title>
  <meta name="description" content={description}>
  <link rel="canonical" href={canonicalURL}>
  
  <!-- Open Graph -->
  <meta property="og:title" content={title}>
  <meta property="og:description" content={description}>
  <meta property="og:url" content={canonicalURL}>
  <meta property="og:site_name" content="Shroom-Mates">
  {ogImage && <meta property="og:image" content={ogImage}>}
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content={title}>
  <meta name="twitter:description" content={description}>
  {ogImage && <meta name="twitter:image" content={ogImage}>}
</head>
```

## Development Workflow

### Code Quality Requirements
- **Biome formatting**: Run `bun run format` before commits (if configured)
- **Type safety**: All scripts must be TypeScript — no `.js` files in `src/scripts/`
- **Accessibility testing**: Test with screen readers and keyboard navigation
- **Performance testing**: Check Lighthouse scores regularly
- **No global scope pollution**: Use module-scoped variables, not `window.*`
- **Scroll handlers**: Always throttle with `requestAnimationFrame`

### Testing Checklist
- [ ] Lighthouse performance score 95+
- [ ] WAVE accessibility report clean
- [ ] Keyboard navigation complete
- [ ] Screen reader compatibility verified
- [ ] Mobile responsiveness tested
- [ ] Cross-browser compatibility confirmed

## Common Patterns to Avoid

### ❌ Incorrect Patterns
```astro
<!-- Don't use div for interactive elements -->
<div onclick="doSomething()">Click me</div>

<!-- Don't forget alt text -->
<img src="important-image.jpg">

<!-- Don't use placeholder as label -->
<input type="email" placeholder="Enter email">

<!-- Don't hardcode image paths -->
<img src="/images/hero.jpg" alt="Hero">
```

### ✅ Correct Patterns
```astro
<!-- Use semantic HTML -->
<button onclick="doSomething()">Click me</button>

<!-- Always include alt text -->
<img src="important-image.jpg" alt="Detailed description of image content">

<!-- Use proper labels -->
<label for="email">E-Mail</label>
<input type="email" id="email" name="email" placeholder="beispiel@domain.de">

<!-- Use Astro Image component -->
<Image src={heroImage} alt="Hero image description" width={800} height={600} />
```

## When Making Suggestions

1. **Always prioritize accessibility** - Every suggestion should include ARIA labels, semantic HTML, and keyboard support
2. **Optimize for performance** - Suggest image optimization, lazy loading, and minimal JavaScript
3. **Consider German users** - Remember this is a German-language site
4. **Mobile-first** - Suggestions should work excellently on mobile devices
5. **Semantic HTML** - Always prefer semantic elements over generic divs
6. **Progressive enhancement** - Features should work without JavaScript when possible

Remember: This is a food-related business website that needs to be fast, accessible, and trustworthy. Every code suggestion should reflect these priorities.