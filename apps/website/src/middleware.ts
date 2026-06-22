import { defineMiddleware } from "astro:middleware";

const STATIC_EXTENSIONS = /\.(ico|png|jpg|jpeg|gif|svg|webp|avif|css|js|mjs|woff2?|ttf|eot|xml|txt|webmanifest|map)$/i;

function isStaticAsset(pathname: string): boolean {
  if (
    pathname.startsWith("/_astro/") ||
    pathname.startsWith("/_image") ||
    pathname.startsWith("/@") ||
    pathname.startsWith("/__")
  ) {
    return true;
  }
  return STATIC_EXTENSIONS.test(pathname.split("/").pop() ?? "");
}

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // Skip static assets for performance — these headers don't apply to them
  if (isStaticAsset(context.url.pathname)) {
    return response;
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https: data:",
      "connect-src 'self' https://api.web3forms.com",
      "font-src 'self'",
    ].join("; "),
  );

  return response;
});
