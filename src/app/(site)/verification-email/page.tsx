import type { Metadata } from "next";
import Link from "next/link";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { authTokens, users } from "@/db/schema";
import AuthShell from "@/components/AuthShell";
import { Notice } from "@/components/ui";
import { sha256 } from "@/lib/util";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vérification de l’adresse e-mail", robots: { index: false } };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  let ok = false;
  if (token) {
    const [t] = await db.select().from(authTokens).where(and(eq(authTokens.tokenHash, sha256(token)), eq(authTokens.type, "verify"), isNull(authTokens.usedAt), gt(authTokens.expiresAt, new Date()))).limit(1);
    if (t) {
      await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, t.userId));
      await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, t.id));
      ok = true;
    }
  }
  return (
    <AuthShell title="Vérification de l’adresse e-mail" footer={<Link href="/espace" className="font-semibold text-brand">Mon espace</Link>}>
      {ok ? <Notice tone="success">Votre adresse e-mail est confirmée. Merci !</Notice> : <Notice tone="error">Ce lien est invalide ou expiré. Vous pouvez demander un nouvel e-mail depuis votre profil.</Notice>}
    </AuthShell>
  );
}
