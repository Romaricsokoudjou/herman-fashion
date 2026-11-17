import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { ActionForm, Field, SubmitButton } from "@/components/forms";
import { resetPasswordAction } from "@/app/actions/auth";
import { Notice } from "@/components/ui";

export const metadata: Metadata = { title: "Réinitialiser mon mot de passe", robots: { index: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Nouveau mot de passe" footer={<Link href="/connexion" className="font-semibold text-brand">Aller à la connexion</Link>}>
      {!token ? (
        <Notice tone="error">Lien invalide. Refaites une demande de réinitialisation.</Notice>
      ) : (
        <ActionForm action={resetPasswordAction}>
          <input type="hidden" name="token" value={token} />
          <Field name="password" label="Nouveau mot de passe" type="password" required autoComplete="new-password" hint="8 caractères minimum, avec une lettre et un chiffre." />
          <Field name="confirmPassword" label="Confirmation" type="password" required autoComplete="new-password" />
          <SubmitButton>Modifier mon mot de passe</SubmitButton>
        </ActionForm>
      )}
    </AuthShell>
  );
}
