import { db } from "@/db";
import { media } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/util";

export const dynamic = "force-dynamic";

const ALLOWED: Record<string, (b: Buffer) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8,
  "image/png": (b) => b.subarray(1, 4).toString() === "PNG",
  "image/webp": (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP",
  "image/gif": (b) => b.subarray(0, 3).toString() === "GIF",
  "application/pdf": (b) => b.subarray(0, 4).toString() === "%PDF",
};
const MAX = 6 * 1024 * 1024;

export async function POST(req: Request) {
  const user = await getUser();
  if (!user || !(can(user.role, "content") || can(user.role, "formations") || can(user.role, "settings"))) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (origin && new URL(origin).host !== host) return Response.json({ error: "Origine refusée." }, { status: 403 });
  if (!rateLimit(`upload:${user.id}`, 60, 3600_000)) return Response.json({ error: "Trop de téléversements." }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Aucun fichier." }, { status: 400 });
  if (file.size > MAX) return Response.json({ error: "Fichier trop volumineux (6 Mo maximum)." }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  const check = ALLOWED[file.type];
  if (!check || !check(buf)) return Response.json({ error: "Format non autorisé (JPEG, PNG, WebP, GIF ou PDF)." }, { status: 415 });

  const [row] = await db.insert(media).values({ filename: file.name.slice(0, 120), mime: file.type, size: buf.length, data: buf }).returning({ id: media.id });
  await audit(user, "media.uploaded", row.id, `${file.type} ${buf.length}o`);
  return Response.json({ url: `/api/media/${row.id}` });
}
