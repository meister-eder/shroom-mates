// Kopiert das Sveltia-CMS-Bundle aus node_modules nach public/admin/, damit es
// selbst gehostet wird (CSP: script-src 'self', kein CDN). Läuft vor dev/build.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "node_modules/@sveltia/cms/dist");
const target = join(root, "public/admin");

if (!existsSync(join(dist, "sveltia-cms.js"))) {
	console.error("@sveltia/cms nicht gefunden – bitte `bun install` ausführen.");
	process.exit(1);
}

mkdirSync(target, { recursive: true });
cpSync(join(dist, "sveltia-cms.js"), join(target, "sveltia-cms.js"));
// Lazy-geladene Chunks (git, qrcode, react-dom, …) liegen relativ zum Hauptbundle.
rmSync(join(target, "chunks"), { recursive: true, force: true });
cpSync(join(dist, "chunks"), join(target, "chunks"), {
	recursive: true,
	filter: (src) => !src.endsWith(".map"),
});
console.log("Sveltia CMS nach public/admin/ kopiert.");
