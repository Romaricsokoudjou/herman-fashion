import { desc } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { markMessageHandledAction } from "@/app/actions/admin";
import { formatDate } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function AdminMessages() {
  await requireStaff("registrations");
  const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(200);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Messages de contact</h1>
      {rows.length === 0 && <p className="text-sm text-anthracite/60">Aucun message.</p>}
      {rows.map((m) => (
        <article key={m.id} className={`rounded-2xl bg-white p-6 shadow-sm ${m.isHandled ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <strong>{m.name}</strong>
            <span className="text-anthracite/60">{formatDate(m.createdAt, true)}</span>
          </div>
          <p className="mt-1 text-xs text-anthracite/70">{[m.email, m.phone].filter(Boolean).join(" · ")}{m.subject && ` · ${m.subject}`}</p>
          <p className="mt-3 whitespace-pre-line text-sm">{m.message}</p>
          <form action={markMessageHandledAction} className="mt-4">
            <input type="hidden" name="id" value={m.id} /><input type="hidden" name="handled" value={m.isHandled ? "0" : "1"} />
            <button className="btn-outline btn-sm">{m.isHandled ? "Marquer comme non traité" : "Marquer comme traité"}</button>
          </form>
        </article>
      ))}
    </div>
  );
}
