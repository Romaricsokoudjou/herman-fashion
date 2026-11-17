import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { ActionForm, Field, SubmitButton } from "@/components/forms";
import { loginAction } from "@/app/actions/auth";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  if (await getUser()) redirect(safe || "/espace");
  return (
    <AuthShell
      title="Connexion"
      subtitle="Accédez à votre espace personnel et poursuivez votre inscription."
      footer={<>Pas encore de compte ? <Link className="font-semibold text-brand" href={`/creer-un-compte${safe ? `?next=${encodeURIComponent(safe)}` : ""}`}>Créer mon compte</Link></>}
    >
      <ActionForm action={loginAction}>
        <input type="hidden" name="next" value={safe} />
        <Field name="email" label="Adresse e-mail" type="email" required autoComplete="email" />
        <Field name="password" label="Mot de passe" type="password" required autoComplete="current-password" />
        <div className="flex items-center justify-between gap-4">
          <SubmitButton>Se connecter</SubmitButton>
          <Link href="/mot-de-passe-oublie" className="text-sm text-brand hover:underline">Mot de passe oublié ?</Link>
        </div>
      </ActionForm>
    </AuthShell>
  );
}
