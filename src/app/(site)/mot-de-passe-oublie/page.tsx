import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { ActionForm, Field, SubmitButton } from "@/components/forms";
import { forgotPasswordAction } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default function ForgotPage() {
  return (
    <AuthShell title="Mot de passe oublié" subtitle="Saisissez votre adresse e-mail : nous préparons un lien de réinitialisation valable 1 heure." footer={<Link href="/connexion" className="font-semibold text-brand">Retour à la connexion</Link>}>
      <ActionForm action={forgotPasswordAction}>
        <Field name="email" label="Adresse e-mail" type="email" required autoComplete="email" />
        <SubmitButton>Envoyer le lien</SubmitButton>
      </ActionForm>
    </AuthShell>
  );
}
