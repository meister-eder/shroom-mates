import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_IP = 10;
const MAX_PER_EMAIL = 3;

const hits = new Map<string, number[]>();

/** Records a hit for `key` and returns whether it is still within `max`. */
function allow(key: string, max: number, now: number) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length <= max;
}

/**
 * Client IP behind Caddy. Caddy replaces any client-sent X-Forwarded-For
 * (no trusted proxies configured), so the last entry is the real client.
 */
function clientIp(req: MedusaRequest) {
  const forwarded = req.headers["x-forwarded-for"];
  const list = (Array.isArray(forwarded) ? forwarded.join(",") : forwarded ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.at(-1) || req.ip || "unknown";
}

/**
 * Every withdrawal sends an email to the address given, so cap how often one
 * client and one recipient can trigger it. In-memory: resets on restart and
 * is per instance, which is enough for a single backend container.
 */
export function withdrawalRateLimit(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  const now = Date.now();
  if (hits.size > 10_000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }

  const email = String((req.body as { email?: unknown })?.email ?? "")
    .trim()
    .toLowerCase();
  const okIp = allow(`ip:${clientIp(req)}`, MAX_PER_IP, now);
  const okEmail = !email || allow(`email:${email}`, MAX_PER_EMAIL, now);

  if (!okIp || !okEmail) {
    res.status(429).json({
      type: "not_allowed",
      message:
        "Zu viele Widerrufe in kurzer Zeit. Bitte versuche es später erneut oder schreib uns an hey@shroom-mates.de.",
    });
    return;
  }
  next();
}
