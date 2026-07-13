import "server-only";
import { db } from "@/lib/db";
import { users, storeMembers, stores } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession, type GlobalRole, type StoreRole } from "@/lib/session";

export type AuthUser = {
  id: number;
  username: string;
  globalRole: GlobalRole;
  storeId: number;
  storeRole: StoreRole | null;
  storeName: string;
  /** true if owner or admin da loja ativa */
  isStoreAdmin: boolean;
  isOwner: boolean;
};

async function resolveStoreContext(
  userId: number,
  globalRole: GlobalRole,
  preferredStoreId?: number
): Promise<{ storeId: number; storeRole: StoreRole | null; storeName: string } | null> {
  if (globalRole === "owner") {
    const allStores = await db.select().from(stores).orderBy(stores.id);
    if (allStores.length === 0) return null;
    const active =
      (preferredStoreId && allStores.find((s) => s.id === preferredStoreId)) || allStores[0];
    return { storeId: active.id, storeRole: null, storeName: active.name };
  }

  const [membership] = await db
    .select({
      storeId: storeMembers.storeId,
      storeRole: storeMembers.role,
      storeName: stores.name,
    })
    .from(storeMembers)
    .innerJoin(stores, eq(stores.id, storeMembers.storeId))
    .where(eq(storeMembers.userId, userId))
    .limit(1);

  if (!membership) return null;
  return {
    storeId: membership.storeId,
    storeRole: membership.storeRole as StoreRole,
    storeName: membership.storeName,
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session?.userId) return null;

  const [user] = await db
    .select({ id: users.id, username: users.username, role: users.role })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) return null;

  // Migração: roles antigas
  let globalRole: GlobalRole =
    user.role === "owner" ? "owner" : user.role === "admin" ? "owner" : "member";
  if (user.role === "admin") {
    // tratar admin legado como owner em runtime até migrate
    globalRole = "owner";
  }

  const preferredStoreId = session.storeId;
  const ctx = await resolveStoreContext(user.id, globalRole, preferredStoreId);
  if (!ctx) return null;

  const isOwner = globalRole === "owner";
  const isStoreAdmin = isOwner || ctx.storeRole === "admin";

  return {
    id: user.id,
    username: user.username,
    globalRole,
    storeId: ctx.storeId,
    storeRole: ctx.storeRole,
    storeName: ctx.storeName,
    isStoreAdmin,
    isOwner,
  };
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado.");
  return user;
}

export async function requireOwner(): Promise<AuthUser> {
  const user = await requireAuth();
  if (!user.isOwner) throw new Error("Sem permissão.");
  return user;
}

/** Owner ou admin da loja ativa */
export async function requireStoreAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (!user.isStoreAdmin) throw new Error("Sem permissão.");
  return user;
}

/** @deprecated use requireStoreAdmin */
export async function requireAdmin(): Promise<AuthUser> {
  return requireStoreAdmin();
}

export function isStoreAdmin(user: AuthUser | null): boolean {
  return !!user?.isStoreAdmin;
}
