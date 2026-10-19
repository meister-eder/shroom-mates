import { listProducts } from "@lib/data/products";
import { getRegion } from "@lib/data/regions";
import type { APIRoute } from "astro";

export const prerender = false;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const GET: APIRoute = async ({ site, url }) => {
  const origin = site ?? url.origin;
  const abs = (path: string) => new URL(path, origin).href;

  const region = await getRegion();
  if (!region) return new Response("No region", { status: 503 });

  const products = await listProducts(region.id);
  const entries: { loc: string; lastmod?: string }[] = [
    { loc: abs("/shop/") },
    ...products.map((p) => ({
      loc: abs(`/shop/${p.handle}/`),
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url><loc>${esc(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}</url>`,
  )
  .join("\n")}
</urlset>
`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
};
