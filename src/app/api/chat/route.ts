import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, contactMessages, conversations } from "@/db/schema";
import { answer, type Turn } from "@/lib/ai";
import { getUser } from "@/lib/auth";
import { rateLimit } from "@/lib/util";

export const dynamic = "force-dynamic";

const KEY_RE = /^[A-Za-z0-9-]{16,64}$/;

function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!KEY_RE.test(key)) return Response.json({ messages: [] });
  const [c] = await db.select().from(conversations).where(eq(conversations.visitorKey, key)).limit(1);
  if (!c) return Response.json({ messages: [] });
  const msgs = await db.select({ role: chatMessages.role, content: chatMessages.content }).from(chatMessages).where(eq(chatMessages.conversationId, c.id)).orderBy(asc(chatMessages.createdAt)).limit(100);
  return Response.json({ messages: msgs, status: c.status });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "Origine refusée." }, { status: 403 });
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (!rateLimit(`chat:${ip}`, 40, 60_000)) return Response.json({ error: "Trop de messages, patientez un instant." }, { status: 429 });

  const body = (await req.json().catch(() => null)) as { key?: string; message?: string; action?: string; contact?: string; note?: string } | null;
  const key = body?.key ?? "";
  if (!body || !KEY_RE.test(key)) return Response.json({ error: "Requête invalide." }, { status: 400 });

  const user = await getUser();
  let [conv] = await db.select().from(conversations).where(eq(conversations.visitorKey, key)).limit(1);
  if (!conv) [conv] = await db.insert(conversations).values({ visitorKey: key, userId: user?.id ?? null }).returning();

  if (body.action === "handoff") {
    const contact = String(body.contact ?? "").trim().slice(0, 120);
    const note = String(body.note ?? "").trim().slice(0, 600);
    if (contact.length < 6) return Response.json({ error: "Indiquez un numéro de téléphone ou une adresse e-mail pour être rappelé." }, { status: 400 });
    await db.update(conversations).set({ status: "handoff", handoffContact: contact, handoffNote: note, updatedAt: new Date() }).where(eq(conversations.id, conv.id));
    await db.insert(contactMessages).values({ name: user ? `${user.firstName} ${user.lastName}` : "Visiteur (HERMAN AI)", phone: contact.includes("@") ? "" : contact, email: contact.includes("@") ? contact : "", subject: "Demande de conseiller via HERMAN AI ASSISTANT", message: note || "Le visiteur souhaite parler à un conseiller." });
    return Response.json({ ok: true, message: "Votre demande a été transmise à un conseiller. Il vous contactera prochainement." });
  }

  const message = String(body.message ?? "").trim().slice(0, 800);
  if (!message) return Response.json({ error: "Message vide." }, { status: 400 });

  const prev = await db.select({ role: chatMessages.role, content: chatMessages.content }).from(chatMessages).where(eq(chatMessages.conversationId, conv.id)).orderBy(asc(chatMessages.createdAt)).limit(20);
  const result = await answer(message, prev as Turn[]);
  await db.insert(chatMessages).values([
    { conversationId: conv.id, role: "user", content: message },
    { conversationId: conv.id, role: "assistant", content: result.reply },
  ]);
  await db.update(conversations).set({ updatedAt: new Date(), ...(conv.userId || !user ? {} : { userId: user.id }) }).where(and(eq(conversations.id, conv.id)));
  return Response.json(result);
}
