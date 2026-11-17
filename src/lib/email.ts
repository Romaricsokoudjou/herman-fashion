import "server-only";
import { db } from "@/db";
import { emailOutbox } from "@/db/schema";

// Envoi via Resend si RESEND_API_KEY est défini. Sinon le message est conservé dans la file
// "email_outbox" (visible par la direction) avec le statut « non configuré » : rien n'est simulé.
export async function sendEmail(to: string, subject: string, body: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Herman FASHION <onboarding@resend.dev>";
  let status = "not_configured";
  let error = "";
  if (key) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, subject, text: body }),
      });
      if (res.ok) status = "sent";
      else {
        status = "failed";
        error = `HTTP ${res.status}`;
      }
    } catch (e) {
      status = "failed";
      error = e instanceof Error ? e.message : "erreur";
    }
  }
  await db.insert(emailOutbox).values({ toEmail: to, subject, body, status, error });
  return status;
}

export async function baseUrl() {
  const { headers } = await import("next/headers");
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;
}
