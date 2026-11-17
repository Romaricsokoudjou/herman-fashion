import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, registrationItems, registrations, users } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSettings } from "@/lib/data";
import { fcfa } from "@/lib/pricing";
import { AGREMENT_REF } from "@/lib/settings-fields";
import { formatDate } from "@/lib/util";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getUser();
  if (!user) return new Response("Non autorisé", { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Introuvable", { status: 404 });
  const [p] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  if (!p || p.status !== "confirmed") return new Response("Introuvable", { status: 404 });
  const allowed = p.userId === user.id || can(user.role, "finance") || can(user.role, "registrations");
  if (!allowed) return new Response("Accès refusé", { status: 403 });

  const [reg] = await db.select().from(registrations).where(eq(registrations.id, p.registrationId)).limit(1);
  const [owner] = await db.select().from(users).where(eq(users.id, p.userId)).limit(1);
  const items = await db.select().from(registrationItems).where(eq(registrationItems.registrationId, p.registrationId));
  const s = await getSettings();
  const download = new URL(req.url).searchParams.get("download") === "1";

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reçu ${esc(p.receiptNumber ?? "")}</title>
<style>body{font-family:Arial,Helvetica,sans-serif;color:#141414;max-width:760px;margin:30px auto;padding:0 20px}h1{font-family:Georgia,serif;margin:0}.top{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #f26a1b;padding-bottom:16px}table{width:100%;border-collapse:collapse;margin-top:20px}td,th{padding:10px;border-bottom:1px solid #e5e5e5;text-align:left;font-size:14px}.r{text-align:right}.tot{font-size:18px;font-weight:700;color:#f26a1b}.small{font-size:12px;color:#666;margin-top:24px}button{background:#f26a1b;color:#fff;border:0;border-radius:99px;padding:10px 22px;font-weight:700;cursor:pointer}@media print{button{display:none}}</style></head><body>
<div class="top"><div><h1>HERMAN FASHION</h1><div style="color:#666;font-size:13px">CFP — Douala, Cameroun</div></div><div style="text-align:right"><strong>REÇU DE PAIEMENT</strong><br>N° ${esc(p.receiptNumber ?? "")}<br>${esc(formatDate(p.verifiedAt ?? p.createdAt))}</div></div>
<p><strong>Candidat :</strong> ${esc(owner?.lastName ?? "")} ${esc(owner?.firstName ?? "")}<br><strong>N° d’inscription :</strong> ${esc(reg?.registrationNumber ?? "—")}<br><strong>Centre :</strong> ${esc(reg?.centerName ?? "")}<br><strong>Moyen de paiement :</strong> Chariow${p.userReference ? ` (réf. ${esc(p.userReference)})` : ""}</p>
<table><thead><tr><th>Formation</th><th>Durée</th><th class="r">Formation</th><th class="r">Inscription et polo</th></tr></thead><tbody>${items.map((i) => `<tr><td>${esc(i.formationName)}</td><td>${esc(i.durationLabel)}</td><td class="r">${fcfa(i.trainingFee)}</td><td class="r">${fcfa(i.registrationFee)}</td></tr>`).join("")}</tbody></table>
<p class="tot r">Montant reçu et vérifié : ${fcfa(p.amount)}</p>
<p class="small">Agrément : ${esc(AGREMENT_REF)}${s.rccm ? ` · RCCM : ${esc(s.rccm)}` : ""}<br>Paiement vérifié par l’établissement le ${esc(formatDate(p.verifiedAt, true))}.</p>
<p><button onclick="window.print()">Imprimer / Enregistrer en PDF</button></p></body></html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      ...(download ? { "Content-Disposition": `attachment; filename="recu-${p.receiptNumber}.html"` } : {}),
    },
  });
}
