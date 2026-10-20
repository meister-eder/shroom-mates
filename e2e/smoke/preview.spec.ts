import { expect, test } from "@playwright/test";
import growkitsPage from "../fixtures/growkits-page.json" with { type: "json" };
import { WEB } from "../visual/routes";

/**
 * CMS-Vorschau: /vorschau/render/ rendert die echte Seitenkomponente mit den
 * Daten aus dem Editor. Fixture = Frontmatter von
 * apps/web/src/content/growkits-page/content.md (bei Schema-Änderungen anpassen).
 */
const URL = `${WEB}/vorschau/render/`;
const JSON_HEADERS = { "Content-Type": "application/json", "X-Preview": "1" };
const payload = (data: unknown) => JSON.stringify({ file: "growkits-page", data });

test.describe("CMS-Vorschau", () => {
  test("rendert die Seite mit geänderter Überschrift", async ({ request }) => {
    const res = await request.post(URL, {
      headers: JSON_HEADERS,
      data: payload({ ...growkitsPage, heroHeadline: "Vorschau-Testzeile" }),
    });
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain("Vorschau-Testzeile");
    expect(html).toContain('id="kits"');
    expect(html).toContain('<base href="/">');
    expect(html).not.toMatch(/<script/i);
    expect(res.headers()["content-security-policy"]).toContain("sandbox;");
    expect(res.headers()["x-robots-tag"]).toBe("noindex");
    expect(res.headers()["cache-control"]).toBe("no-store");
  });

  test("ohne X-Preview: 400", async ({ request }) => {
    const res = await request.post(URL, {
      headers: { "Content-Type": "application/json" },
      data: payload(growkitsPage),
    });
    expect(res.status()).toBe(400);
  });

  test("ungültige Daten: 422 mit deutscher Meldung", async ({ request }) => {
    const res = await request.post(URL, {
      headers: JSON_HEADERS,
      data: payload({ ...growkitsPage, heroHeadline: undefined }),
    });
    expect(res.status()).toBe(422);
    expect((await res.json()).error).toContain("heroHeadline");
  });

  test("neues, noch nicht gespeichertes Bild: Platzhalter", async ({ request }) => {
    const res = await request.post(URL, {
      headers: JSON_HEADERS,
      data: payload({ ...growkitsPage, heroImage: "blob:http://localhost/neu" }),
    });
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain("data:image/svg+xml");
  });
});
