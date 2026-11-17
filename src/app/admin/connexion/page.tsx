import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ActionForm, Field, SubmitButton } from "@/components/forms";
import { loginAction } from "@/app/actions/auth";
import { getUser } from "@/lib/auth";
import { ADMIN_ROLES, isStaff } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administration — Connexion", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  const u = await getUser();
  if (u && isStaff(u.role)) redirect("/admin");
  const staff = await db.select({ id: users.id }).from(users).where(inArray(users.role, ADMIN_ROLES)).limit(1);
  return (
    <div className="grid min-h-screen place-items-center bg-ink px-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl sm:p-10">
        <p className="eyebrow">Herman FASHION</p>
        <h1 className="mt-2 text-3xl font-semibold">Espace d’administration</h1>
        <p className="mt-2 text-sm text-anthracite/70">Accès réservé au personnel autorisé.</p>
        <div className="mt-8">
          <ActionForm action={loginAction}>
            <input type="hidden" name="admin" value="1" />
            <Field name="email" label="Adresse e-mail" type="email" required autoComplete="email" />
            <Field name="password" label="Mot de passe" type="password" required autoComplete="current-password" />
            <SubmitButton className="btn-primary w-full">Connexion</SubmitButton>
          </ActionForm>
        </div>
        {staff.length === 0 && (
          <p className="mt-6 rounded-xl bg-brand-soft p-4 text-sm">
            Aucun administrateur n’existe encore. <Link href="/admin/installation" className="font-semibold text-brand underline">Créer le premier super administrateur</Link>.
          </p>
        )}
        <p className="mt-6 text-center text-sm"><Link href="/" className="text-anthracite/70 hover:text-brand">← Retour au site</Link></p>
      </div>
    </div>
  );
}
