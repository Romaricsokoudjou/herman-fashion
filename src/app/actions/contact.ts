"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { formValues, type FormState } from "@/lib/form-state";
import { rateLimit } from "@/lib/util";

const schema = z.object({
  name: z.string().trim().min(2, "Votre nom est obligatoire.").max(120),
  email: z.string().trim().email("Adresse e-mail invalide.").or(z.literal("")),
  phone: z.string().trim().max(30).regex(/^[+0-9\s().-]*$/, "Numéro invalide."),
  subject: z.string().trim().max(160),
  message: z.string().trim().min(10, "Votre message est trop court (10 caractères minimum).").max(3000),
});

export async function contactAction(_: FormState, fd: FormData): Promise<FormState> {
  const values = formValues(fd);
  const ip = ((await headers()).get("x-forwarded-for") || "local").split(",")[0].trim();
  if (!rateLimit(`contact:${ip}`, 5, 3600_000)) return { error: "Trop de messages envoyés. Réessayez plus tard.", values };
  if (fd.get("website")) return { ok: true, message: "Merci, votre message a bien été envoyé." }; // champ piège anti-spam
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of p.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Veuillez corriger les champs signalés.", fieldErrors, values };
  }
  if (!p.data.email && !p.data.phone) return { error: "Indiquez une adresse e-mail ou un numéro de téléphone pour que nous puissions vous répondre.", values };
  await db.insert(contactMessages).values(p.data);
  return { ok: true, message: "Merci, votre message a bien été envoyé. Notre équipe vous répondra prochainement." };
}
