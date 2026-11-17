import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { payments, registrationItems, registrations, users } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { REGISTRATION_STATUS, PAYMENT_STATUS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

function cell(v: unknown): string {
  let s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise l'injection de formules Excel
  return `"${s.replace(/"/g, '""')}"`;
}
function csv(headers: string[], rows: unknown[][]) {
  return "\uFEFF" + [headers, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
}

export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return new Response("Non autorisé", { status: 401 });
  const sp = new URL(req.url).searchParams;
  const type = sp.get("type");
  let body = "";

  if (type === "inscriptions") {
    if (!can(user.role, "registrations") && !can(user.role, "finance")) return new Response("Accès refusé", { status: 403 });
    const center = sp.get("centre");
    const status = sp.get("statut");
    const regs = await db
      .select({ r: registrations, u: users })
      .from(registrations)
      .innerJoin(users, eq(users.id, registrations.userId))
      .where(and(center ? eq(registrations.centerId, center) : undefined, status ? eq(registrations.status, status) : undefined))
      .orderBy(desc(registrations.createdAt));
    const ids = regs.map((x) => x.r.id);
    const items = ids.length ? await db.select().from(registrationItems).where(inArray(registrationItems.registrationId, ids)) : [];
    const formation = sp.get("formation");
    const rows = regs
      .filter((x) => !formation || items.some((i) => i.registrationId === x.r.id && i.formationId === formation))
      .map(({ r, u }) => [
        r.registrationNumber ?? "", r.createdAt, u.lastName, u.firstName, u.email, u.phone, u.country, u.city, r.centerName,
        items.filter((i) => i.registrationId === r.id).map((i) => `${i.formationName} (${i.durationLabel})`).join(" + "),
        r.trainingTotal, r.registrationTotal, r.totalAmount ?? "à valider", REGISTRATION_STATUS[r.status]?.label ?? r.status,
      ]);
    body = csv(["N° inscription", "Date", "Nom", "Prénom", "E-mail", "Téléphone", "Pays", "Ville", "Centre", "Formations", "Total formation", "Total inscription", "Montant total", "Statut"], rows);
  } else if (type === "paiements") {
    if (!can(user.role, "finance")) return new Response("Accès refusé", { status: 403 });
    const rows = await db.select({ p: payments, u: users }).from(payments).innerJoin(users, eq(users.id, payments.userId)).orderBy(desc(payments.createdAt));
    body = csv(["Date", "Reçu", "Candidat", "E-mail", "Moyen", "Référence déclarée", "Référence prestataire", "Montant", "Statut"],
      rows.map(({ p, u }) => [p.createdAt, p.receiptNumber ?? "", `${u.lastName} ${u.firstName}`, u.email, p.provider, p.userReference, p.providerReference, p.amount ?? "", PAYMENT_STATUS[p.status]?.label ?? p.status]));
  } else if (type === "utilisateurs") {
    if (!can(user.role, "users")) return new Response("Accès refusé", { status: 403 });
    const rows = await db.select().from(users).orderBy(desc(users.createdAt));
    body = csv(["Date", "Nom", "Prénom", "E-mail", "Téléphone", "Pays", "Ville", "Rôle", "Actif", "E-mail vérifié"],
      rows.map((u) => [u.createdAt, u.lastName, u.firstName, u.email, u.phone, u.country, u.city, u.role, u.isActive ? "oui" : "non", u.emailVerifiedAt ? "oui" : "non"]));
  } else return new Response("Type inconnu", { status: 400 });

  await audit(user, "export.csv", type ?? "");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="herman-fashion-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
