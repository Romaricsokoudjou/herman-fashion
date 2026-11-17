import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { ActionForm, Field, SubmitButton } from "@/components/forms";
import { registerAction } from "@/app/actions/auth";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Créer mon compte", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/inscription";
  if (await getUser()) redirect(safe);
  return (
    <AuthShell
      title="Créer mon compte"
      subtitle="Un compte personnel est nécessaire pour finaliser votre inscription et suivre votre dossier."
      footer={<>Déjà inscrit ? <Link className="font-semibold text-brand" href={`/connexion?next=${encodeURIComponent(safe)}`}>Me connecter</Link></>}
    >
      <ActionForm action={registerAction}>
        <input type="hidden" name="next" value={safe} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="lastName" label="Nom" required autoComplete="family-name" />
          <Field name="firstName" label="Prénom" required autoComplete="given-name" />
        </div>
        <Field name="phone" label="Numéro de téléphone" type="tel" required autoComplete="tel" inputMode="tel" placeholder="+237 6XX XXX XXX" hint="Format international recommandé." />
        <Field name="email" label="Adresse e-mail" type="email" required autoComplete="email" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="country" label="Pays" required defaultValue="Cameroun" autoComplete="country-name" />
          <Field name="city" label="Ville" required defaultValue="Douala" autoComplete="address-level2" />
        </div>
        <Field name="password" label="Mot de passe" type="password" required autoComplete="new-password" hint="8 caractères minimum, avec au moins une lettre et un chiffre." />
        <Field name="confirmPassword" label="Confirmation du mot de passe" type="password" required autoComplete="new-password" />
        <p className="text-xs text-anthracite/70">
          En créant un compte, vous acceptez nos <Link href="/informations-legales#cgu" className="underline">conditions d’utilisation</Link> et notre <Link href="/informations-legales#confidentialite" className="underline">politique de confidentialité</Link>.
        </p>
        <SubmitButton>Créer mon compte</SubmitButton>
      </ActionForm>
    </AuthShell>
  );
}
