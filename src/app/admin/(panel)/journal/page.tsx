import { desc } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, emailOutbox } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { Notice } from "@/components/ui";
import { formatDate } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function AdminJournal() {
  await requireStaff("audit");
  const [logs, mails] = await Promise.all([
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200),
    db.select().from(emailOutbox).orderBy(desc(emailOutbox.createdAt)).limit(50),
  ]);
  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-semibold">Journal des opérations sensibles</h1>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[700px]"><thead className="border-b border-ink/10"><tr><th className="th">Date</th><th className="th">Acteur</th><th className="th">Action</th><th className="th">Cible</th><th className="th">Détail</th></tr></thead>
          <tbody className="divide-y divide-ink/5">{logs.map((l) => <tr key={l.id}><td className="td whitespace-nowrap">{formatDate(l.createdAt, true)}</td><td className="td">{l.actorLabel}</td><td className="td font-mono text-xs">{l.action}</td><td className="td font-mono text-xs">{l.target.slice(0, 8)}</td><td className="td text-xs">{l.detail}</td></tr>)}</tbody></table>
      </div>
      <section>
        <h2 className="text-xl font-semibold">E-mails sortants</h2>
        {!process.env.RESEND_API_KEY && <div className="my-3"><Notice tone="warn">Aucun service d’e-mail n’est configuré (RESEND_API_KEY) : les messages ci-dessous n’ont PAS été envoyés. Configurez le service pour que les confirmations, vérifications et réinitialisations partent réellement.</Notice></div>}
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[700px]"><thead className="border-b border-ink/10"><tr><th className="th">Date</th><th className="th">Destinataire</th><th className="th">Objet</th><th className="th">État</th></tr></thead>
            <tbody className="divide-y divide-ink/5">{mails.map((m) => <tr key={m.id}><td className="td whitespace-nowrap">{formatDate(m.createdAt, true)}</td><td className="td">{m.toEmail}</td><td className="td">{m.subject}</td><td className="td">{m.status === "sent" ? "Envoyé" : m.status === "failed" ? `Échec ${m.error}` : "Non envoyé (service non configuré)"}</td></tr>)}</tbody></table>
        </div>
      </section>
    </div>
  );
}
