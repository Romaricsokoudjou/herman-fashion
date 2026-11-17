import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ActionForm, Field, SubmitButton } from "@/components/forms";
import { changePasswordAction, updateProfileAction } from "@/app/actions/auth";
import { Notice } from "@/components/ui";

export const metadata: Metadata = { title: "Mon profil", robots: { index: false } };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ verification?: string }> }) {
  const user = await requireUser("/espace/profil");
  const sp = await searchParams;
  return (
    <div className="space-y-8">
      {sp.verification && <Notice tone="success">Un nouvel e-mail de vérification a été préparé.</Notice>}
      <div className="card p-7">
        <h2 className="text-xl font-semibold">Informations personnelles</h2>
        <p className="mt-1 text-sm text-anthracite/70">E-mail : {user.email} {user.emailVerifiedAt ? "(vérifié)" : "(non vérifié)"}</p>
        <ActionForm action={updateProfileAction} className="mt-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="lastName" label="Nom" required defaultValue={user.lastName} />
            <Field name="firstName" label="Prénom" required defaultValue={user.firstName} />
          </div>
          <Field name="phone" label="Téléphone" type="tel" required defaultValue={user.phone} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="country" label="Pays" required defaultValue={user.country} />
            <Field name="city" label="Ville" required defaultValue={user.city} />
          </div>
          <SubmitButton>Enregistrer</SubmitButton>
        </ActionForm>
      </div>
      <div className="card p-7">
        <h2 className="text-xl font-semibold">Changer mon mot de passe</h2>
        <ActionForm action={changePasswordAction} className="mt-6 space-y-5" resetOnSuccess>
          <Field name="current" label="Mot de passe actuel" type="password" required autoComplete="current-password" />
          <Field name="password" label="Nouveau mot de passe" type="password" required autoComplete="new-password" />
          <Field name="confirmPassword" label="Confirmation" type="password" required autoComplete="new-password" />
          <SubmitButton>Modifier le mot de passe</SubmitButton>
        </ActionForm>
      </div>
    </div>
  );
}
