import "server-only";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

export type UserRole = "admin" | "user";

export type AuthUser = {
  id: number;
  username: string;
  role: UserRole;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session?.userId) return null;

  const [user] = await db
    .select({ id: users.id, username: users.username, role: users.role })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) return null;
  return { ...user, role: user.role as UserRole };
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado.");
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== "admin") throw new Error("Sem permissão.");
  return user;
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === "admin";
}
