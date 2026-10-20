import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, type Page, test } from "@playwright/test";
import growkitsPage from "../fixtures/growkits-page.json" with { type: "json" };
import { MOCK, routes, WEB } from "../visual/routes";

/**
 * Content-Security-Policy aus dem Caddyfile, im Browser erzwungen: Die
 * Antworten der Web-App bekommen hier denselben Header wie auf dem Server
 * (Seite bzw. /admin/), dann darf keine Seite eine CSP-Verletzung melden und
 * die React-Inseln müssen hydrieren.
 *
 * Schlägt der Test nach einem Astro-Update fehl, die ausgegebenen Hashes im
 * Caddyfile (script-src der Seite) ersetzen.
 */
const ROOT = path.resolve(__dirname, "../..");
const CADDYFILE = readFileSync(path.join(ROOT, "Caddyfile"), "utf8");

function caddyPolicy(matcher: string): string {
  const m = CADDYFILE.match(
    new RegExp(
      `header ${matcher} \\{\\s*\\{\\$CSP_HEADER:Content-Security-Policy\\} "([^"]+)"`,
    ),
  );
  if (!m) throw new Error(`CSP für ${matcher} nicht im Caddyfile gefunden`);
  return m[1];
}

// Lokal ist Medusa der Mock (http) statt https://api.<DOMAIN>; Produktbilder
// kommen ebenfalls von dort (auf dem Server deckt `img-src https:` sie ab).
const SITE_POLICY = caddyPolicy("@notadmin")
  .replaceAll("https://api.{$DOMAIN}", MOCK)
  .replace("img-src", `img-src ${MOCK}`);
const ADMIN_POLICY = caddyPolicy("@admin");

const sha256 = (s: string) =>
  `sha256-${createHash("sha256").update(s).digest("base64")}`;

/** Inline-Skripte, deren Hash im script-src der Seite fehlt. */
const missingHashes = new Set<string>();

/** Erzwingt die CSP aus dem Caddyfile und sammelt Verletzungen. */
async function enforceCsp(page: Page): Promise<string[]> {
  const violations: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && /Content Security Policy/.test(msg.text())) {
      violations.push(`${page.url()}: ${msg.text()}`);
    }
  });
  await page.route(`${WEB}/**`, async (route) => {
    const res = await route.fetch();
    const { pathname } = new URL(route.request().url());
    const admin = pathname === "/admin" || pathname.startsWith("/admin/");
    const policy = admin ? ADMIN_POLICY : SITE_POLICY;
    const headers = res.headers();
    // Caddy ergänzt den Header; ein eigener der App (Vorschau) gilt zusätzlich.
    headers["content-security-policy"] = [
      headers["content-security-policy"],
      policy,
    ]
      .filter(Boolean)
      .join(", ");
    if (!admin && headers["content-type"]?.startsWith("text/html")) {
      const html = await res.text();
      for (const [, body] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
        const hash = sha256(body);
        if (!SITE_POLICY.includes(`'${hash}'`)) missingHashes.add(hash);
      }
    }
    await route.fulfill({ response: res, headers });
  });
  return violations;
}

test.describe("Content-Security-Policy (erzwungen)", () => {
  // Per route.fulfill ausgelieferte Seiten gelten für Chrome nicht als lokal;
  // ohne die Freigabe blockt Local Network Access die Aufrufe an den Mock.
  test.use({ permissions: ["local-network-access"] });

  test.afterEach(({ page }) => page.unrouteAll({ behavior: "ignoreErrors" }));

  test.afterAll(() => {
    expect(
      [...missingHashes],
      "Inline-Skripte ohne Hash im Caddyfile (script-src der Seite)",
    ).toEqual([]);
  });

  test("Hashes im Caddyfile = Insel-Skripte des installierten Astro", async () => {
    const runtime = path.join(
      ROOT,
      "apps/web/node_modules/astro/dist/runtime",
    );
    const files = [
      "server/astro-island.prebuilt.js",
      ...["idle", "load", "media", "only", "visible"].map(
        (d) => `client/${d}.prebuilt.js`,
      ),
    ];
    const expected = await Promise.all(
      files.map(
        async (f) =>
          sha256(
            (await import(pathToFileURL(path.join(runtime, f)).href)).default,
          ),
      ),
    );
    const scriptSrc = SITE_POLICY.match(/script-src ([^;]+)/)?.[1] ?? "";
    const actual = [...scriptSrc.matchAll(/'(sha256-[^']+)'/g)].map(
      (m) => m[1],
    );
    expect(actual, "Caddyfile: script-src-Hashes in dieser Reihenfolge").toEqual(
      expected,
    );
  });

  test("Pilzkorb: Produkt, Korb, Kasse hydrieren", async ({ page }) => {
    const violations = await enforceCsp(page);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto(`${WEB}/shop/rosenseitling-growkit/`);
    await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
    const add = page.getByRole("button", { name: "Rein ins Körbchen" });
    await expect(add).toBeEnabled();
    await add.click();
    await expect(
      page.getByRole("button", { name: /^Pilzkorb, 1 Artikel/ }),
    ).toBeVisible();

    await page.goto(`${WEB}/shop/cart/`);
    await expect(page.getByText(/Rosenseitling/).first()).toBeVisible();
    await expect(page.locator("astro-island[ssr]")).toHaveCount(0);

    await page.goto(`${WEB}/shop/checkout/`);
    await expect(page.getByLabel("Vorname *")).toBeVisible();
    await expect(page.locator("astro-island[ssr]")).toHaveCount(0);

    await page.goto(`${WEB}/shop/checkout/complete/`);
    await expect(page.locator("astro-island[ssr]")).toHaveCount(0);

    expect(errors).toEqual([]);
    expect(violations).toEqual([]);
  });

  test("Alle Seiten aus dem Screenshot-Vergleich", async ({ page }) => {
    const violations = await enforceCsp(page);
    for (const route of routes) {
      await page.goto(route.url, { waitUntil: "networkidle" });
    }
    expect(violations).toEqual([]);
  });

  test("CMS-Vorschau im Admin (srcdoc wie public/admin/preview.js)", async ({
    page,
  }) => {
    const violations = await enforceCsp(page);
    await page.goto(`${WEB}/admin/`, { waitUntil: "networkidle" });
    await page.evaluate(async (data) => {
      const res = await fetch("/vorschau/render/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Preview": "1" },
        body: JSON.stringify({ file: "growkits-page", data }),
      });
      const frame = document.createElement("iframe");
      frame.title = "Vorschau";
      document.body.append(frame);
      const loaded = new Promise((r) => frame.addEventListener("load", r));
      frame.srcdoc = await res.text();
      await loaded;
    }, growkitsPage);
    const preview = page.frameLocator('iframe[title="Vorschau"]');
    await expect(preview.locator("#kits")).toBeAttached();
    await page.waitForLoadState("networkidle");
    expect(violations).toEqual([]);
  });
});
