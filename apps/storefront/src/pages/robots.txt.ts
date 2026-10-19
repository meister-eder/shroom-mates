import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = ({ site, url }) => {
  const origin = site ?? url.origin;
  const body = `User-agent: *
Allow: /
Disallow: /*/cart
Disallow: /*/checkout
Disallow: /*/order/
Disallow: /*/vertrag-widerrufen

Sitemap: ${new URL("/sitemap.xml", origin).href}
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
