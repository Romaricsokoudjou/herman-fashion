import { createHmac, timingSafeEqual } from "crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { chariowEvents, payments, users } from "@/db/schema";

export const dynamic = "force-dynamic";

// Pulse Chariow : signature HMAC-SHA256 du corps brut, en-tête x-chariow-signature = "sha256=<hex>".
// Idempotence : x-pulse-delivery-id. Secret du Pulse (whsec_…) dans CHARIOW_PULSE_SECRET.
// Une vente signée est enregistrée et rapprochée d'un paiement « en attente de vérification » ;
// la confirmation finale reste une validation administrative (montant, correspondance du candidat).
export async function POST(req: Request) {
  const secret = process.env.CHARIOW_PULSE_SECRET;
  if (!secret) return Response.json({ error: "Webhook non configuré." }, { status: 503 });

  const raw = Buffer.from(await req.arrayBuffer());
  const received = req.headers.get("x-chariow-signature") ?? "";
  const expected = "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return Response.json({ error: "Signature invalide." }, { status: 401 });

  let payload: { event?: string; sale?: { id?: string }; customer?: { email?: string } };
  try {
    payload = JSON.parse(raw.toString("utf8"));
  } catch {
    return Response.json({ error: "Corps invalide." }, { status: 400 });
  }
  const deliveryId = req.headers.get("x-pulse-delivery-id") || `${payload.event}:${payload.sale?.id}`;
  const dup = await db.select({ id: chariowEvents.id }).from(chariowEvents).where(eq(chariowEvents.deliveryId, deliveryId)).limit(1);
  if (dup.length) return Response.json({ ok: true, duplicate: true });

  const email = (payload.customer?.email ?? "").trim().toLowerCase();
  let matched: string | null = null;
  if (payload.event === "successful.sale" && email) {
    const [u] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (u) {
      const open = await db.select().from(payments).where(and(eq(payments.userId, u.id), eq(payments.provider, "chariow"), inArray(payments.status, ["initiated", "pending_verification"]))).orderBy(desc(payments.createdAt)).limit(2);
      if (open.length === 1) {
        matched = open[0].id;
        await db.update(payments).set({ status: "pending_verification", providerVerified: true, providerReference: payload.sale?.id ?? "", note: "Vente Chariow signée reçue — validation administrative requise.", updatedAt: new Date() }).where(eq(payments.id, matched));
      }
    }
  }
  await db.insert(chariowEvents).values({ deliveryId, eventType: payload.event ?? "inconnu", saleId: payload.sale?.id ?? "", customerEmail: email, payload: payload as object, matchedPaymentId: matched });
  return Response.json({ ok: true });
}
