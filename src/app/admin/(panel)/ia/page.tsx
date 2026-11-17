import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, conversations } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import EntityManager from "@/components/admin/EntityManager";
import { closeConversationAction } from "@/app/actions/admin";
import { Notice, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function AdminAI() {
  await requireStaff("ai");
  const convs = await db.select().from(conversations).orderBy(desc(conversations.updatedAt)).limit(40);
  const msgs = convs.length ? await db.select().from(chatMessages).where(inArray(chatMessages.conversationId, convs.map((c) => c.id))).orderBy(asc(chatMessages.createdAt)) : [];
  const sorted = [...convs.filter((c) => c.status === "handoff"), ...convs.filter((c) => c.status !== "handoff")];
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold">HERMAN AI ASSISTANT</h1>
        <div className="mt-3"><Notice tone="info">L’assistant lit en direct les formations, tarifs, centres et coordonnées enregistrés. {process.env.OPENAI_API_KEY ? "Un modèle de langage est configuré (OPENAI_API_KEY)." : "Aucune clé d’API IA n’est configurée : l’assistant répond avec le moteur de connaissances intégré (réponses fiables, sans génération libre). Ajoutez OPENAI_API_KEY pour activer les réponses conversationnelles."}</Notice></div>
      </div>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Questions fréquentes et réponses officielles</h2>
        <EntityManager entityKey="faq" back="/admin/ia" />
      </section>
      <section>
        <h2 className="text-xl font-semibold">Conversations récentes</h2>
        <p className="mb-4 text-sm text-anthracite/70">Les demandes de conseiller humain apparaissent en premier (les coordonnées laissées figurent aussi dans « Messages de contact »).</p>
        <div className="space-y-3">
          {sorted.length === 0 && <p className="text-sm text-anthracite/60">Aucune conversation.</p>}
          {sorted.map((c) => (
            <details key={c.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm">
                <span>{formatDate(c.updatedAt, true)} · {msgs.filter((m) => m.conversationId === c.id).length} messages</span>
                <StatusBadge label={c.status === "handoff" ? "Conseiller demandé" : c.status === "closed" ? "Clôturée" : "Ouverte"} tone={c.status === "handoff" ? "amber" : c.status === "closed" ? "slate" : "blue"} />
              </summary>
              {c.status === "handoff" && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm">Contact : <strong>{c.handoffContact}</strong>{c.handoffNote && <> — {c.handoffNote}</>}</p>}
              <ul className="mt-3 space-y-2 text-sm">
                {msgs.filter((m) => m.conversationId === c.id).map((m) => (
                  <li key={m.id} className={m.role === "user" ? "text-right" : ""}><span className={`inline-block max-w-[85%] whitespace-pre-line rounded-xl px-3 py-2 ${m.role === "user" ? "bg-brand-soft" : "bg-beige"}`}>{m.content}</span></li>
                ))}
              </ul>
              {c.status !== "closed" && <form action={closeConversationAction} className="mt-3"><input type="hidden" name="id" value={c.id} /><button className="btn-outline btn-sm">Marquer comme traitée</button></form>}
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
