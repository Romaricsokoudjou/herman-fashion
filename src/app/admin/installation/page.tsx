import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ActionForm, Field, SubmitButton } from "@/components/forms";
import { adminSetupAction } from "@/app/actions/auth";
import { ADMIN_ROLES } from "@/lib/permissions";
import { Notice } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Installation — premier administrateur", robots: { index: false, follow: false } };

export default async function SetupPage() {
  const staff = await db.select({ id: users.id }).from(users).where(inArray(users.role, ADMIN_ROLES)).limit(1);
  if (staff.length) notFound();
  return (
    <div className="grid min-h-screen place-items-center bg-ink px-5 py-10">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl sm:p-10">
        <p className="eyebrow">Installation</p>
        <h1 className="mt-2 text-3xl font-semibold">Premier super administrateur</h1>
        <div className="mt-4"><Notice tone="warn">Cette page n’est disponible que tant qu’aucun administrateur n’existe. Créez ce compte immédiatement après le déploiement. Si la variable ADMIN_SETUP_KEY est définie, la clé est exigée.</Notice></div>
        <div className="mt-6">
          <ActionForm action={adminSetupAction}>
            {process.env.ADMIN_SETUP_KEY && <Field name="setupKey" label="Clé d’installation" type="password" required />}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="lastName" label="Nom" required />
              <Field name="firstName" label="Prénom" required />
            </div>
            <Field name="email" label="Adresse e-mail" type="email" required />
            <Field name="phone" label="Téléphone" type="tel" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="country" label="Pays" required defaultValue="Cameroun" />
              <Field name="city" label="Ville" required defaultValue="Douala" />
            </div>
            <Field name="password" label="Mot de passe" type="password" required autoComplete="new-password" />
            <Field name="confirmPassword" label="Confirmation" type="password" required autoComplete="new-password" />
            <SubmitButton className="btn-primary w-full">Créer le compte</SubmitButton>
          </ActionForm>
        </div>
      </div>
    </div>
  );
}
