import "server-only";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { payments, registrationItems, registrations } from "@/db/schema";

export async function getUserRegistrations(userId: string) {
  const regs = await db.select().from(registrations).where(eq(registrations.userId, userId)).orderBy(desc(registrations.createdAt));
  if (!regs.length) return [];
  const ids = regs.map((r) => r.id);
  const [items, pays] = await Promise.all([
    db.select().from(registrationItems).where(inArray(registrationItems.registrationId, ids)),
    db.select().from(payments).where(inArray(payments.registrationId, ids)).orderBy(desc(payments.createdAt)),
  ]);
  return regs.map((r) => ({ ...r, items: items.filter((i) => i.registrationId === r.id), payments: pays.filter((p) => p.registrationId === r.id) }));
}
