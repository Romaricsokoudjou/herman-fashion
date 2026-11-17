"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { z } from "zod";
import { and, eq, gt, isNull, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { authTokens, users } from "@/db/schema";
import { createSession, destroySession, getUser, hashPassword, invalidateUserSessions, verifyPassword } from "@/lib/auth";
import { baseUrl, sendEmail } from "@/lib/email";
import { audit } from "@/lib/audit";
import { rateLimit, sha256 } from "@/lib/util";
import { formValues, type FormState } from "@/lib/form-state";
import { ADMIN_ROLES, isStaff } from "@/lib/permissions";

async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for") || "local").split(",")[0].trim();
}

function safeNext(n: FormDataEntryValue | null, fallback = "/espace") {
  const v = typeof n === "string" ? n : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "form");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s().-]+$/, "Numéro de téléphone invalide (chiffres, espaces et + uniquement).")
  .refine((v) => {
    const d = v.replace(/\D/g, "");
    return d.length >= 8 && d.length <= 15;
  }, "Le numéro doit contenir entre 8 et 15 chiffres (ex. +237 6XX XXX XXX).");

const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .regex(/[A-Za-z]/, "Le mot de passe doit contenir au moins une lettre.")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre.");

const baseRegister = z.object({
    phone: phoneSchema,
    lastName: z.string().trim().min(2, "Le nom est obligatoire.").max(80),
    firstName: z.string().trim().min(2, "Le prénom est obligatoire.").max(80),
    email: z.string().trim().toLowerCase().email("Adresse e-mail invalide.").max(160),
    country: z.string().trim().min(2, "Le pays est obligatoire.").max(80),
    city: z.string().trim().min(2, "La ville est obligatoire.").max(80),
    password: passwordSchema,
    confirmPassword: z.string(),
});
const registerSchema = baseRegister.refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Les mots de passe ne correspondent pas." });

async function issueToken(userId: string, type: "reset" | "verify", hours: number) {
  const token = randomBytes(32).toString("base64url");
  await db.insert(authTokens).values({ userId, type, tokenHash: sha256(token), expiresAt: new Date(Date.now() + hours * 3600_000) });
  return token;
}

export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  const values = formValues(fd);
  if (!rateLimit(`register:${await clientIp()}`, 8, 3600_000)) {
    return { error: "Trop de tentatives. Réessayez dans une heure.", values };
  }
  const parsed = registerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Veuillez corriger les champs signalés.", fieldErrors: fieldErrors(parsed.error), values };
  const d = parsed.data;
  const normalizedPhone = d.phone.replace(/[^\d+]/g, "");

  const dupe = await db
    .select({ email: users.email, phone: users.phone })
    .from(users)
    .where(sql`${users.email} = ${d.email} or ${users.phone} = ${normalizedPhone}`)
    .limit(1);
  if (dupe.length) {
    const emailTaken = dupe[0].email === d.email;
    return {
      error: "Un compte existe déjà avec ces informations. Connectez-vous ou récupérez votre mot de passe.",
      fieldErrors: emailTaken ? { email: "Cette adresse e-mail est déjà utilisée." } : { phone: "Ce numéro est déjà utilisé." },
      values,
    };
  }

  const [user] = await db
    .insert(users)
    .values({
      phone: normalizedPhone, lastName: d.lastName, firstName: d.firstName, email: d.email,
      country: d.country, city: d.city, passwordHash: await hashPassword(d.password),
    })
    .returning();

  const token = await issueToken(user.id, "verify", 72);
  const link = `${await baseUrl()}/verification-email?token=${token}`;
  await sendEmail(user.email, "Confirmez votre adresse e-mail — Herman FASHION", `Bonjour ${user.firstName},\n\nMerci d’avoir créé votre compte Herman FASHION. Confirmez votre adresse e-mail en ouvrant ce lien (valable 72 h) :\n${link}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez ce message.`);
  await audit({ id: user.id, email: user.email }, "account.created", user.id);
  await createSession(user.id);
  redirect(`${safeNext(fd.get("next"), "/espace")}${safeNext(fd.get("next"), "/espace").includes("?") ? "&" : "?"}bienvenue=1`);
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const adminLogin = fd.get("admin") === "1";
  const values = { email };
  if (!email || !password) return { error: "Saisissez votre adresse e-mail et votre mot de passe.", values };
  if (!rateLimit(`login:${await clientIp()}:${email}`, 10, 15 * 60_000)) {
    return { error: "Trop de tentatives de connexion. Réessayez dans quelques minutes.", values };
  }
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const generic = { error: "Adresse e-mail ou mot de passe incorrect.", values };
  if (!u) return generic;
  if (u.lockedUntil && u.lockedUntil > new Date()) {
    return { error: "Compte temporairement verrouillé après plusieurs échecs. Réessayez dans 15 minutes.", values };
  }
  if (!(await verifyPassword(password, u.passwordHash))) {
    const failed = u.failedLogins + 1;
    await db.update(users).set({ failedLogins: failed, lockedUntil: failed >= 5 ? new Date(Date.now() + 15 * 60_000) : null }).where(eq(users.id, u.id));
    await audit({ id: u.id, email: u.email }, "login.failed", u.id);
    return generic;
  }
  if (!u.isActive) return { error: "Ce compte est désactivé. Contactez l’administration.", values };
  if (adminLogin && !isStaff(u.role)) return { error: "Ce compte n’a pas accès à l’administration.", values };
  await db.update(users).set({ failedLogins: 0, lockedUntil: null }).where(eq(users.id, u.id));
  await createSession(u.id);
  if (isStaff(u.role)) await audit({ id: u.id, email: u.email }, "login.staff", u.id);
  redirect(adminLogin ? "/admin" : safeNext(fd.get("next"), isStaff(u.role) && !fd.get("next") ? "/admin" : "/espace"));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function forgotPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const msg = "Si un compte correspond à cette adresse, un lien de réinitialisation valable 1 heure vient d’être préparé.";
  if (!z.string().email().safeParse(email).success) return { error: "Adresse e-mail invalide.", values: { email } };
  if (!rateLimit(`forgot:${await clientIp()}`, 5, 3600_000)) return { error: "Trop de demandes. Réessayez plus tard.", values: { email } };
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (u && u.isActive) {
    const token = await issueToken(u.id, "reset", 1);
    const link = `${await baseUrl()}/reinitialiser-mot-de-passe?token=${token}`;
    await sendEmail(u.email, "Réinitialisation de votre mot de passe — Herman FASHION", `Bonjour ${u.firstName},\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable 1 heure) :\n${link}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez ce message.`);
    await audit({ id: u.id, email: u.email }, "password.reset_requested", u.id);
  }
  return { ok: true, message: msg };
}

export async function resetPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const token = String(fd.get("token") ?? "");
  const parsed = z
    .object({ password: passwordSchema, confirmPassword: z.string() })
    .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Les mots de passe ne correspondent pas." })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Veuillez corriger les champs signalés.", fieldErrors: fieldErrors(parsed.error) };
  const [t] = await db
    .select()
    .from(authTokens)
    .where(and(eq(authTokens.tokenHash, sha256(token)), eq(authTokens.type, "reset"), isNull(authTokens.usedAt), gt(authTokens.expiresAt, new Date())))
    .limit(1);
  if (!t) return { error: "Ce lien est invalide ou expiré. Refaites une demande de réinitialisation." };
  await db.update(users).set({ passwordHash: await hashPassword(parsed.data.password), failedLogins: 0, lockedUntil: null, updatedAt: new Date() }).where(eq(users.id, t.userId));
  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, t.id));
  await invalidateUserSessions(t.userId);
  await audit(null, "password.reset_done", t.userId);
  return { ok: true, message: "Mot de passe modifié. Vous pouvez maintenant vous connecter." };
}

export async function updateProfileAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await getUser();
  if (!u) redirect("/connexion");
  const parsed = baseRegister
    .pick({ phone: true, lastName: true, firstName: true, country: true, city: true })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Veuillez corriger les champs signalés.", fieldErrors: fieldErrors(parsed.error), values: formValues(fd) };
  const phone = parsed.data.phone.replace(/[^\d+]/g, "");
  const dupe = await db.select({ id: users.id }).from(users).where(and(eq(users.phone, phone), sql`${users.id} <> ${u.id}`)).limit(1);
  if (dupe.length) return { error: "Ce numéro est déjà utilisé par un autre compte.", fieldErrors: { phone: "Numéro déjà utilisé." }, values: formValues(fd) };
  await db.update(users).set({ ...parsed.data, phone, updatedAt: new Date() }).where(eq(users.id, u.id));
  await audit(u, "profile.updated", u.id);
  return { ok: true, message: "Profil mis à jour.", values: formValues(fd) };
}

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await getUser();
  if (!u) redirect("/connexion");
  const parsed = z
    .object({ current: z.string().min(1, "Mot de passe actuel requis."), password: passwordSchema, confirmPassword: z.string() })
    .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Les mots de passe ne correspondent pas." })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Veuillez corriger les champs signalés.", fieldErrors: fieldErrors(parsed.error) };
  if (!(await verifyPassword(parsed.data.current, u.passwordHash))) return { error: "Mot de passe actuel incorrect.", fieldErrors: { current: "Incorrect." } };
  await db.update(users).set({ passwordHash: await hashPassword(parsed.data.password), updatedAt: new Date() }).where(eq(users.id, u.id));
  await audit(u, "password.changed", u.id);
  return { ok: true, message: "Mot de passe modifié." };
}

export async function resendVerificationAction(): Promise<void> {
  const u = await getUser();
  if (!u || u.emailVerifiedAt) return;
  if (!rateLimit(`verify:${u.id}`, 3, 3600_000)) return;
  const token = await issueToken(u.id, "verify", 72);
  await sendEmail(u.email, "Confirmez votre adresse e-mail — Herman FASHION", `Confirmez votre adresse e-mail :\n${await baseUrl()}/verification-email?token=${token}`);
  redirect("/espace/profil?verification=envoyee");
}

/** Création du tout premier super administrateur (uniquement tant qu'aucun compte staff n'existe). */
export async function adminSetupAction(_: FormState, fd: FormData): Promise<FormState> {
  const staff = await db.select({ id: users.id }).from(users).where(inArray(users.role, ADMIN_ROLES)).limit(1);
  if (staff.length) return { error: "L’installation est déjà effectuée." };
  const key = process.env.ADMIN_SETUP_KEY;
  if (key && fd.get("setupKey") !== key) return { error: "Clé d’installation incorrecte." };
  const parsed = registerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Veuillez corriger les champs signalés.", fieldErrors: fieldErrors(parsed.error), values: formValues(fd) };
  const d = parsed.data;
  const phone = d.phone.replace(/[^\d+]/g, "");
  const existing = await db.select().from(users).where(eq(users.email, d.email)).limit(1);
  let id: string;
  if (existing.length) {
    return { error: "Cette adresse e-mail est déjà utilisée par un compte apprenant. Utilisez une autre adresse.", values: formValues(fd) };
  } else {
    const [u] = await db.insert(users).values({
      phone, lastName: d.lastName, firstName: d.firstName, email: d.email, country: d.country, city: d.city,
      passwordHash: await hashPassword(d.password), role: "super_admin", emailVerifiedAt: new Date(),
    }).returning();
    id = u.id;
  }
  await audit({ id, email: d.email }, "admin.setup", id);
  await createSession(id);
  redirect("/admin");
}
