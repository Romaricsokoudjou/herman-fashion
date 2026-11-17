import { randomBytes, createHash } from "crypto";

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function randomCode(len = 6): string {
  const bytes = randomBytes(len);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function lines(s: string | null | undefined): string[] {
  return (s ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

/** Retourne une URL d'intégration YouTube, ou null. */
export function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,15})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0` : null;
}

export function youtubeThumb(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,15})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

export function isSafeUrl(u: string): boolean {
  return /^(https?:\/\/|\/)/i.test(u.trim());
}

export function formatDate(d: Date | string | null | undefined, withTime = false): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
    timeZone: "Africa/Douala",
  } as Intl.DateTimeFormatOptions).format(date);
}

// Limiteur de débit en mémoire (protection basique contre le brute-force / spam).
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const n = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < n) {
    buckets.set(key, { count: 1, reset: n + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < n) buckets.delete(k);
    return true;
  }
  b.count += 1;
  return b.count <= max;
}
