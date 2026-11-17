import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { sha256 } from "@/lib/util";
import { can, isStaff, type Permission } from "@/lib/permissions";

const COOKIE = "hf_session";
const SESSION_DAYS = 14;

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt });
  const h = await headers();
  const secure = h.get("x-forwarded-proto") === "https";
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  jar.delete(COOKIE);
}

export type SessionUser = typeof users.$inferSelect;

export const getUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const u = rows[0]?.user;
  if (!u || !u.isActive) return null;
  return u;
});

/** Page privée apprenant : redirige vers la connexion si non connecté. */
export async function requireUser(next = "/espace"): Promise<SessionUser> {
  const u = await getUser();
  if (!u) redirect(`/connexion?next=${encodeURIComponent(next)}`);
  return u;
}

/** Espace d'administration : vérifie le rôle et la permission côté serveur. */
export async function requireStaff(perm?: Permission): Promise<SessionUser> {
  const u = await getUser();
  if (!u) redirect("/admin/connexion");
  if (!isStaff(u.role)) redirect("/espace");
  if (perm && !can(u.role, perm)) redirect("/admin?denied=1");
  return u;
}

export async function invalidateUserSessions(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
