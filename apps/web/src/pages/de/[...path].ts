import { legacyTarget } from "@lib/legacy-redirects";
import type { APIRoute } from "astro";

export const prerender = false;

// Old shop URLs (country prefix, former shop host) -> new paths. The
// redirect is relative on purpose: behind the reverse proxy `url.origin` is
// the internal address, not the public host.
export const ALL: APIRoute = ({ url }) => {
  const target = legacyTarget(url.pathname);
  if (!target) return new Response("Not found", { status: 404 });
  return new Response(null, {
    status: 301,
    headers: { Location: `${target}${url.search}` },
  });
};
