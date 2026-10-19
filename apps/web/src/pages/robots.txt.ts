import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site, url }) => {
  const origin = site ?? url.origin;
  // sitemap-index.xml (@astrojs/sitemap) lists the static pages and the
  // shop sitemap (/sitemap.xml, SSR).
  const body = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /shop/cart/
Disallow: /shop/checkout/
Disallow: /shop/order/
Disallow: /vertrag-widerrufen/
Crawl-delay: 1

Sitemap: ${new URL("/sitemap-index.xml", origin).href}
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
