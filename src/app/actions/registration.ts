"use server";

import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { centers, formationOffers, formations, payments, registrationItems, registrations } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { cumulRule, getSettings } from "@/lib/data";
import { computePrice } from "@/lib/pricing";
import { audit } from "@/lib/audit";
import { sha256 } from "@/lib/util";
import { notifyAdmin } from "@/lib/payments";
import type { FormState } from "@/lib/form-state";

const selSchema = z.array(z.object({ formationId: z.string().uuid(), offerId: z.string().uuid() })).min(1, "Sélectionnez au moins une formation.").max(12);

export async function createRegistrationAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/inscription");
  let raw: unknown;
  try {
    raw = JSON.parse(String(fd.get("selections") ?? "[]"));
  } catch {
    return { error: "Sélection invalide." };
  }
  const sel = selSchema.safeParse(raw);
  if (!sel.success) return { error: sel.error.issues[0]?.message ?? "Sélection invalide." };
  if (new Set(sel.data.map((s) => s.formationId)).size !== sel.data.length) return { error: "Une formation ne peut être sélectionnée qu’une fois." };
  const centerId = String(fd.get("centerId") ?? "");
  if (!z.string().uuid().safeParse(centerId).success) return { error: "Choisissez votre centre de formation." };
  if (fd.get("confirm") !== "on") return { error: "Veuillez confirmer l’exactitude des informations pour continuer." };

  const [center] = await db.select().from(centers).where(and(eq(centers.id, centerId), eq(centers.isActive, true))).limit(1);
  if (!center) return { error: "Centre indisponible." };

  // Recalcul 100 % serveur depuis les tarifs officiels en base.
  const offers = await db.select().from(formationOffers).where(inArray(formationOffers.id, sel.data.map((s) => s.offerId)));
  const fs = await db.select().from(formations).where(inArray(formations.id, sel.data.map((s) => s.formationId)));
  const rows: { f: typeof formations.$inferSelect; o: typeof formationOffers.$inferSelect }[] = [];
  for (const s of sel.data) {
    const o = offers.find((x) => x.id === s.offerId);
    const f = fs.find((x) => x.id === s.formationId);
    if (!o || !f || o.formationId !== f.id || !o.isActive || !f.isActive) return { error: "Une des formations ou durées sélectionnées n’est plus disponible. Actualisez la page." };
    rows.push({ f, o });
  }
  const settings = await getSettings();
  const price = computePrice(rows.map((r) => ({ trainingFee: r.o.trainingFee, registrationFee: r.o.registrationFee })), cumulRule(settings));
  const fingerprint = sha256(rows.map((r) => `${r.f.id}:${r.o.id}`).sort().join("|") + centerId);

  const existing = await db.select().from(registrations).where(and(eq(registrations.userId, user.id), eq(registrations.fingerprint, fingerprint))).limit(5);
  const dupe = existing.find((r) => r.status === "pending" || r.status === "to_complete");
  if (dupe) redirect(`/inscription/paiement/${dupe.id}`);

  const id = await db.transaction(async (tx) => {
    const [reg] = await tx
      .insert(registrations)
      .values({
        userId: user.id, centerId: center.id, centerName: center.name, fingerprint,
        pricingMode: price.definitive ? "definitive" : "needs_validation",
        trainingTotal: price.trainingTotal, registrationTotal: price.registrationTotal, totalAmount: price.total,
      })
      .returning({ id: registrations.id });
    await tx.insert(registrationItems).values(
      rows.map((r) => ({
        registrationId: reg.id, formationId: r.f.id, offerId: r.o.id, formationName: r.f.name,
        durationLabel: r.o.durationLabel, diploma: r.o.diploma, trainingFee: r.o.trainingFee,
        registrationFee: r.o.registrationFee, installments: r.o.installments,
      })),
    );
    return reg.id;
  });
  await audit(user, "registration.created", id, `${rows.length} formation(s)`);
  await notifyAdmin("Nouvelle inscription à traiter", `Nouvelle inscription (${rows.map((r) => r.f.name).join(", ")}) — centre ${center.name}.${price.definitive ? "" : " Montant total à valider (règle de cumul non définie)."}`);
  redirect(`/inscription/paiement/${id}`);
}

async function ownRegistration(id: string) {
  const user = await requireUser(`/inscription/paiement/${id}`);
  if (!z.string().uuid().safeParse(id).success) redirect("/espace/inscriptions");
  const [reg] = await db.select().from(registrations).where(and(eq(registrations.id, id), eq(registrations.userId, user.id))).limit(1);
  if (!reg) redirect("/espace/inscriptions");
  return { user, reg };
}

/** Clic sur « PROCÉDER AU PAIEMENT » : enregistre l'intention puis redirige vers Chariow. Pas une preuve de paiement. */
export async function startPaymentAction(formData: FormData): Promise<void> {
  const { user, reg } = await ownRegistration(String(formData.get("registrationId")));
  if (reg.pricingMode !== "definitive" || reg.totalAmount === null) redirect(`/inscription/paiement/${reg.id}`);
  const s = await getSettings();
  const existing = await db.select().from(payments).where(and(eq(payments.registrationId, reg.id), eq(payments.provider, "chariow"))).limit(10);
  if (!existing.some((p) => p.status === "initiated" || p.status === "pending_verification")) {
    await db.insert(payments).values({ registrationId: reg.id, userId: user.id, provider: "chariow", status: "initiated" });
  }
  await audit(user, "payment.redirected", reg.id, "chariow");
  redirect(s.chariowUrl);
}

export async function declarePaymentAction(_: FormState, fd: FormData): Promise<FormState> {
  const { user, reg } = await ownRegistration(String(fd.get("registrationId")));
  const reference = String(fd.get("reference") ?? "").trim().slice(0, 120);
  if (reference.length < 3) return { error: "Indiquez la référence ou le numéro de transaction reçu après votre paiement.", fieldErrors: { reference: "Référence requise." } };
  const list = await db.select().from(payments).where(and(eq(payments.registrationId, reg.id), eq(payments.provider, "chariow"))).limit(20);
  if (list.some((p) => p.userReference === reference)) return { error: "Cette référence a déjà été déclarée." };
  const open = list.find((p) => p.status === "initiated");
  if (open) {
    await db.update(payments).set({ status: "pending_verification", userReference: reference, updatedAt: new Date() }).where(eq(payments.id, open.id));
  } else {
    await db.insert(payments).values({ registrationId: reg.id, userId: user.id, provider: "chariow", status: "pending_verification", userReference: reference });
  }
  await audit(user, "payment.declared", reg.id);
  await notifyAdmin("Paiement à vérifier", `Un candidat a déclaré un paiement (réf. ${reference}) pour l’inscription ${reg.id}. À vérifier dans l’administration.`);
  return { ok: true, message: "Merci. Votre paiement est enregistré « En attente de vérification » : l’équipe le confirmera après contrôle de la transaction." };
}
