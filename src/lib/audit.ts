import "server-only";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";

// Journalisation des opérations sensibles (aucune donnée personnelle superflue, jamais de mot de passe).
export async function audit(
  actor: { id: string; email: string } | null,
  action: string,
  target = "",
  detail = "",
) {
  try {
    await db.insert(auditLogs).values({
      actorId: actor?.id ?? null,
      actorLabel: actor ? actor.email : "système",
      action,
      target,
      detail: detail.slice(0, 500),
    });
  } catch (e) {
    console.error("audit failed", e instanceof Error ? e.message : e);
  }
}
