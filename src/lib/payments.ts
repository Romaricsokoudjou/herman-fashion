import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, registrations, users } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { getSettings } from "@/lib/data";
import { audit } from "@/lib/audit";
import { randomCode } from "@/lib/util";

export async function notifyAdmin(subject: string, body: string) {
  const s = await getSettings();
  await sendEmail(s.email || "administration@(adresse-non-configurée)", `[Herman FASHION] ${subject}`, body);
}

export const SUCCESS_MESSAGE =
  "Félicitations ! Votre inscription à Herman FASHION a été enregistrée avec succès. Notre équipe vous contactera prochainement pour la suite de votre admission.";

/** Confirmation d'un paiement APRÈS vérification réelle par un administrateur habilité. */
export async function confirmPayment(paymentId: string, actor: { id: string; email: string }, amount: number | null) {
  const [p] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  if (!p) throw new Error("Paiement introuvable");
  if (p.status === "confirmed") return p; // prévention des doublons / double confirmation
  const year = new Date().getFullYear();
  const receiptNumber = `RC-${year}-${randomCode(6)}`;
  const [updated] = await db
    .update(payments)
    .set({ status: "confirmed", amount: amount ?? p.amount, receiptNumber, verifiedBy: actor.id, verifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(payments.id, paymentId))
    .returning();
  const [reg] = await db.select().from(registrations).where(eq(registrations.id, p.registrationId)).limit(1);
  if (reg) {
    await db
      .update(registrations)
      .set({
        registrationNumber: reg.registrationNumber ?? `HF-${year}-${randomCode(6)}`,
        status: reg.status === "validated" ? "validated" : "payment_confirmed",
        updatedAt: new Date(),
      })
      .where(eq(registrations.id, reg.id));
    const [u] = await db.select().from(users).where(eq(users.id, reg.userId)).limit(1);
    if (u) await sendEmail(u.email, "Confirmation de votre inscription — Herman FASHION", `Bonjour ${u.firstName},\n\n${SUCCESS_MESSAGE}\n\nVotre reçu ${receiptNumber} est disponible dans votre espace personnel.`);
    await notifyAdmin("Paiement confirmé", `Paiement ${receiptNumber} confirmé pour l’inscription ${reg.id}.`);
  }
  await audit(actor, "payment.confirmed", paymentId, `montant=${updated.amount}`);
  return updated;
}
