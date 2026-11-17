"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  contactMessages, conversations, payments, registrations, settings, users,
} from "@/db/schema";
import { invalidateUserSessions, requireStaff } from "@/lib/auth";
import { ENTITIES } from "@/lib/admin-entities";
import { SETTING_GROUPS } from "@/lib/settings-fields";
import { audit } from "@/lib/audit";
import { isSafeUrl, randomCode, slugify } from "@/lib/util";
import { confirmPayment } from "@/lib/payments";
import { ADMIN_ROLES, ROLES } from "@/lib/permissions";
import type { FormState } from "@/lib/form-state";
import type { PgTable } from "drizzle-orm/pg-core";

type Row = Record<string, unknown>;

function parseEntity(entityKey: string, fd: FormData) {
  const ent = ENTITIES[entityKey];
  if (!ent) throw new Error("Entité inconnue");
  const values: Row = {};
  const errors: Record<string, string> = {};
  for (const f of ent.fields) {
    const raw = fd.get(f.name);
    const str = typeof raw === "string" ? raw.trim() : "";
    if (f.type === "bool") values[f.name] = raw === "on" || raw === "true";
    else if (f.type === "number") {
      const n = str === "" ? 0 : Number(str);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) errors[f.name] = "Nombre entier positif attendu.";
      else values[f.name] = n;
    } else if (f.type === "datetime") {
      // datetime-local est saisi à l'heure de Douala (UTC+1, sans changement d'heure)
      const d = str ? new Date(/T\d\d:\d\d$/.test(str) ? `${str}:00+01:00` : str) : new Date();
      if (isNaN(d.getTime())) errors[f.name] = "Date invalide.";
      else values[f.name] = d;
    } else if (f.type === "select") {
      if (f.options && str && !f.options.includes(str)) errors[f.name] = "Valeur invalide.";
      else values[f.name] = str || f.options?.[0] || "";
    } else {
      if ((f.type === "url" || f.type === "image") && str && !isSafeUrl(str)) errors[f.name] = "Lien invalide (http(s):// ou /chemin).";
      values[f.name] = str;
    }
    if (f.required && (values[f.name] === "" || values[f.name] === undefined)) errors[f.name] = "Champ obligatoire.";
  }
  for (const h of ent.hidden ?? []) values[h] = String(fd.get(h) ?? "");
  return { ent, values, errors };
}

export async function saveEntityAction(entityKey: string, id: string | null, _: FormState, fd: FormData): Promise<FormState> {
  const ent0 = ENTITIES[entityKey];
  if (!ent0) return { error: "Entité inconnue." };
  const user = await requireStaff(ent0.perm);
  const { ent, values, errors } = parseEntity(entityKey, fd);
  if (Object.keys(errors).length) return { error: "Veuillez corriger les champs signalés.", fieldErrors: errors };
  const table = ent.table as PgTable & { id: never; updatedAt?: never };

  if ((entityKey === "formations" || entityKey === "actualites")) {
    const base = String(values.slug || values[entityKey === "formations" ? "name" : "title"]);
    let slug = slugify(base) || randomCode(6).toLowerCase();
    const col = (table as unknown as { slug: never }).slug;
    const clash = await db.select({ id: (table as unknown as { id: never }).id }).from(table).where(id ? and(eq(col, slug), ne((table as unknown as { id: never }).id, id as never)) : eq(col, slug)).limit(1);
    if (clash.length) slug = `${slug}-${randomCode(3).toLowerCase()}`;
    values.slug = slug;
  }
  if (entityKey === "formations") values.updatedAt = new Date();

  try {
    if (id) {
      await db.update(table).set(values as never).where(eq((table as unknown as { id: never }).id, id as never));
    } else {
      await db.insert(table).values(values as never);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return { error: /unique|duplicate/i.test(msg) ? "Cette valeur existe déjà (identifiant en doublon)." : "Enregistrement impossible." };
  }
  await audit(user, `${entityKey}.${id ? "updated" : "created"}`, id ?? "");
  revalidatePath("/", "layout");
  return { ok: true, message: id ? "Modifications enregistrées." : "Élément ajouté." };
}

export async function deleteEntityAction(fd: FormData): Promise<void> {
  const key = String(fd.get("entity"));
  const ent = ENTITIES[key];
  if (!ent) return;
  const user = await requireStaff(ent.perm);
  const id = String(fd.get("id"));
  try {
    await db.delete(ent.table).where(eq((ent.table as unknown as { id: never }).id, id as never));
  } catch {
    // clé étrangère : on ne supprime pas ce qui est déjà utilisé
  }
  await audit(user, `${key}.deleted`, id);
  revalidatePath("/", "layout");
  redirect(String(fd.get("back") || "/admin"));
}

export async function saveSettingsAction(groupId: string, _: FormState, fd: FormData): Promise<FormState> {
  const user = await requireStaff("settings");
  const group = SETTING_GROUPS.find((g) => g.id === groupId);
  if (!group) return { error: "Groupe inconnu." };
  const errors: Record<string, string> = {};
  const rows: { key: string; value: string }[] = [];
  for (const f of group.fields) {
    const raw = fd.get(f.key);
    let v = typeof raw === "string" ? raw.trim() : "";
    if (f.type === "bool") v = raw === "on" ? "true" : "false";
    if ((f.type === "url" || f.type === "image") && v && !isSafeUrl(v)) errors[f.key] = "Lien invalide.";
    if (f.key === "gaId" && v && !/^G-[A-Z0-9]+$/.test(v)) errors[f.key] = "Format attendu : G-XXXXXXXXXX";
    if (f.type === "select" && f.options && !f.options.some((o) => o.value === v)) errors[f.key] = "Valeur invalide.";
    if (f.key === "whatsappUrl" && v && !/^https:\/\/wa\.me\/\d+/.test(v)) errors[f.key] = "Format attendu : https://wa.me/237XXXXXXXXX";
    rows.push({ key: f.key, value: v });
  }
  if (Object.keys(errors).length) return { error: "Veuillez corriger les champs signalés.", fieldErrors: errors };
  for (const r of rows) {
    await db.insert(settings).values({ ...r, updatedAt: new Date() }).onConflictDoUpdate({ target: settings.key, set: { value: r.value, updatedAt: new Date() } });
  }
  await audit(user, "settings.updated", groupId, rows.map((r) => r.key).join(","));
  revalidatePath("/", "layout");
  return { ok: true, message: "Paramètres enregistrés et répercutés sur le site." };
}

/* ───────── Inscriptions & paiements ───────── */

export async function updateRegistrationAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireStaff("registrations");
  const id = String(fd.get("id"));
  const status = String(fd.get("status"));
  const adminNote = String(fd.get("adminNote") ?? "").slice(0, 2000);
  if (!["pending", "payment_confirmed", "payment_failed", "validated", "to_complete"].includes(status)) return { error: "Statut invalide." };
  const [reg] = await db.select().from(registrations).where(eq(registrations.id, id)).limit(1);
  if (!reg) return { error: "Inscription introuvable." };
  const confirmed = await db.select({ id: payments.id }).from(payments).where(and(eq(payments.registrationId, id), eq(payments.status, "confirmed"))).limit(1);
  if ((status === "validated" || status === "payment_confirmed") && !confirmed.length) {
    return { error: "Impossible : aucun paiement vérifié et confirmé n’est enregistré pour cette inscription." };
  }
  const set: Record<string, unknown> = { status, adminNote, updatedAt: new Date() };
  const total = String(fd.get("totalAmount") ?? "").trim();
  if (total !== "") {
    const n = Number(total);
    if (!Number.isInteger(n) || n < 0) return { error: "Montant total invalide." };
    set.totalAmount = n;
    set.pricingMode = "definitive";
  }
  await db.update(registrations).set(set).where(eq(registrations.id, id));
  await audit(user, "registration.updated", id, `status=${status}${total !== "" ? ` total=${total}` : ""}`);
  revalidatePath("/admin/inscriptions");
  return { ok: true, message: "Inscription mise à jour." };
}

export async function confirmPaymentAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireStaff("finance");
  const amount = Number(String(fd.get("amount") ?? ""));
  if (!Number.isInteger(amount) || amount <= 0) return { error: "Saisissez le montant réellement reçu (FCFA)." };
  if (fd.get("verified") !== "on") return { error: "Cochez la case attestant que la transaction a été vérifiée." };
  await confirmPayment(String(fd.get("paymentId")), user, amount);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Paiement confirmé, reçu généré, candidat et administration notifiés." };
}

export async function failPaymentAction(fd: FormData): Promise<void> {
  const user = await requireStaff("finance");
  const id = String(fd.get("paymentId"));
  const [p] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  if (!p || p.status === "confirmed") return;
  await db.update(payments).set({ status: "failed", verifiedBy: user.id, verifiedAt: new Date(), updatedAt: new Date() }).where(eq(payments.id, id));
  const ok = await db.select({ id: payments.id }).from(payments).where(and(eq(payments.registrationId, p.registrationId), eq(payments.status, "confirmed"))).limit(1);
  if (!ok.length) await db.update(registrations).set({ status: "payment_failed", updatedAt: new Date() }).where(eq(registrations.id, p.registrationId));
  await audit(user, "payment.failed", id);
  revalidatePath("/admin", "layout");
}

export async function addManualPaymentAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireStaff("finance");
  const regId = String(fd.get("registrationId"));
  const amount = Number(String(fd.get("amount") ?? ""));
  const method = String(fd.get("method") ?? "manual").slice(0, 30);
  const reference = String(fd.get("reference") ?? "").trim().slice(0, 120);
  if (!Number.isInteger(amount) || amount <= 0) return { error: "Montant invalide." };
  if (reference.length < 3) return { error: "Indiquez une référence (n° de reçu, de transaction…)." };
  const [reg] = await db.select().from(registrations).where(eq(registrations.id, regId)).limit(1);
  if (!reg) return { error: "Inscription introuvable." };
  const [p] = await db.insert(payments).values({ registrationId: regId, userId: reg.userId, provider: method, status: "pending_verification", amount, userReference: reference, note: "Enregistré par l’administration" }).returning();
  await confirmPayment(p.id, user, amount);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Paiement enregistré et confirmé." };
}

/* ───────── Utilisateurs, administrateurs, messages ───────── */

export async function toggleUserActiveAction(fd: FormData): Promise<void> {
  const actor = await requireStaff("users");
  const id = String(fd.get("id"));
  if (id === actor.id) return;
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!u || (ADMIN_ROLES.includes(u.role) && actor.role !== "super_admin")) return;
  await db.update(users).set({ isActive: !u.isActive }).where(eq(users.id, id));
  if (u.isActive) await invalidateUserSessions(id);
  await audit(actor, u.isActive ? "user.disabled" : "user.enabled", id);
  revalidatePath("/admin/utilisateurs");
}

export async function setRoleAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireStaff("admins");
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const role = String(fd.get("role"));
  if (!ROLES[role]) return { error: "Rôle invalide." };
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!u) return { error: "Aucun compte avec cette adresse e-mail. La personne doit d’abord créer un compte." };
  if (u.id === actor.id) return { error: "Vous ne pouvez pas modifier votre propre rôle." };
  if (u.role === "super_admin" && role !== "super_admin") {
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "super_admin"));
    if (n <= 1) return { error: "Impossible de retirer le dernier super administrateur." };
  }
  await db.update(users).set({ role }).where(eq(users.id, u.id));
  if (role === "learner") await invalidateUserSessions(u.id);
  await audit(actor, "role.changed", u.id, `${u.role} -> ${role}`);
  revalidatePath("/admin/administrateurs");
  return { ok: true, message: `Rôle de ${u.firstName} ${u.lastName} : ${ROLES[role].label}.` };
}

export async function markMessageHandledAction(fd: FormData): Promise<void> {
  const user = await requireStaff("registrations");
  const id = String(fd.get("id"));
  await db.update(contactMessages).set({ isHandled: fd.get("handled") === "1" }).where(eq(contactMessages.id, id));
  await audit(user, "message.handled", id);
  revalidatePath("/admin/messages");
}

export async function closeConversationAction(fd: FormData): Promise<void> {
  const user = await requireStaff("ai");
  const id = String(fd.get("id"));
  await db.update(conversations).set({ status: "closed", updatedAt: new Date() }).where(eq(conversations.id, id));
  await audit(user, "conversation.closed", id);
  revalidatePath("/admin/ia");
}
