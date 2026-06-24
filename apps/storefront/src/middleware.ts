import { defineMiddleware } from "astro:middleware";
import type { HttpTypes } from "@medusajs/types";
import { sdk } from "./lib/sdk";

const MEDUSA_BACKEND_URL = import.meta.env.PUBLIC_MEDUSA_BACKEND_URL;
const DEFAULT_REGION = import.meta.env.DEFAULT_REGION;

const regionMapCache = {
	regionMap: new Map<string, HttpTypes.StoreRegion>(),
	regionMapUpdated: Date.now(),
};

function isStaticOrInternalPath(pathname: string) {
	// Astro/Vite internal and image optimization routes
	if (
		pathname === "/_astro" ||
		pathname.startsWith("/_astro/") ||
		pathname === "/_image" ||
		pathname.startsWith("/_image") ||
		pathname.startsWith("/@") || // e.g. /@vite, /@id, /@fs (dev)
		pathname.startsWith("/__") // e.g. /__vite_ping (dev)
	) {
		return true;
	}

	// Common site root static files
	if (
		pathname === "/favicon.ico" ||
		pathname === "/robots.txt" ||
		pathname === "/sitemap.xml" ||
		pathname === "/manifest.webmanifest"
	) {
		return true;
	}

	// Any file with an extension (images, css, js, fonts, etc.)
	const lastSegment = pathname.split("/").pop() ?? "";
	return lastSegment.includes(".") && lastSegment !== ".well-known";
}

/**
 * Fetches regions from Medusa and caches them in a map.
 * @returns A map of country codes to regions.
 */
async function getRegionMap() {
	const { regionMap, regionMapUpdated } = regionMapCache;

	if (!MEDUSA_BACKEND_URL) {
		throw new Error(
			"src/middleware.ts: Error fetching regions. Did you set up regions in your Medusa Admin and define a PUBLIC_MEDUSA_BACKEND_URL environment variable?",
		);
	}

	const isCacheValid =
		regionMap.keys().next().value &&
		regionMapUpdated > Date.now() - 3600 * 1000; // 1 hour

	if (!isCacheValid) {
		try {
			const { regions } = await sdk.store.region.list();

			if (!regions?.length) {
				throw new Error(
					"No regions found. Please set up regions in your Medusa Admin.",
				);
			}

			regions.forEach((region: HttpTypes.StoreRegion) => {
				region.countries?.forEach((country) => {
					regionMapCache.regionMap.set(country.iso_2 ?? "", region);
				});
			});

			regionMapCache.regionMapUpdated = Date.now();
		} catch (error) {
			console.error(error);
			throw new Error("Failed to fetch regions from Medusa.");
		}
	}

	return regionMapCache.regionMap;
}

/**
 * Gets the country code from the URL pathname.
 * @param pathname
 * @returns The country code.
 */
async function getCountryCode(pathname: string) {
	let countryCode: string | undefined;

	const urlCountryCode = pathname.split("/")[1]?.toLowerCase();

	const regionMap = await getRegionMap();

	if (urlCountryCode && regionMap.has(urlCountryCode)) {
		countryCode = urlCountryCode;
	} else if (regionMap.has(DEFAULT_REGION)) {
		countryCode = DEFAULT_REGION;
	} else if (regionMap.keys().next().value) {
		countryCode = regionMap.keys().next().value;
	}

	return countryCode;
}

/**
 * Sets security headers on every response. In production these are also
 * set by Caddy, but this ensures they're present during local development.
 */
function addSecurityHeaders(response: Response): Response {
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("X-Frame-Options", "SAMEORIGIN");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	response.headers.set(
		"Permissions-Policy",
		"camera=(), microphone=(), geolocation=()",
	);
	response.headers.set(
		"Content-Security-Policy",
		[
			"default-src 'self'",
			"script-src 'self' https://gateway.sumup.com",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' https: data:",
			"connect-src 'self' https://api.shroom-mates.de http://localhost:9000",
			"frame-src https://gateway.sumup.com",
			"font-src 'self'",
		].join("; "),
	);
	return response;
}

export const onRequest = defineMiddleware(async (context, next) => {
	// Never redirect non-page requests (assets, dev internals, etc.)
	if (isStaticOrInternalPath(context.url.pathname)) {
		return next();
	}

	// Only redirect navigations; avoid changing semantics for form submits, etc.
	const method = context.request.method.toUpperCase();
	if (method !== "GET" && method !== "HEAD") {
		return next();
	}

	const pathname = context.url.pathname;
	const origin = context.url.origin;
	const search = context.url.search;

	let countryCode: string | undefined;
	try {
		countryCode = await getCountryCode(pathname);
	} catch (err) {
		// Region lookup failed (Medusa down, no regions, etc.) — continue without redirect
		console.warn("Region lookup failed, continuing without country redirect:", err);
	}

	if (countryCode) {
		const urlHasCountryCode =
			pathname.split("/")[1] === countryCode ||
			pathname.split("/")[1].includes(`${countryCode}/`);

		if (!urlHasCountryCode) {
			const redirectPath = pathname === "/" ? "" : pathname;
			const queryString = search || "";
			return context.redirect(`${origin}/${countryCode}${redirectPath}${queryString}`, 307);
		}
	}

	const response = await next();
	// Security headers are handled by Caddy in production
	return response;
});
