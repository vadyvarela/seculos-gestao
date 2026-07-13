"use server";

import { db } from "@/lib/db";
import { stores, storeMembers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireOwner, getCurrentUser } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function listMyStores() {
  const user = await requireAuth();
  if (user.isOwner) {
    return db.select().from(stores).orderBy(stores.name);
  }
  const [membership] = await db
    .select({
      id: stores.id,
      name: stores.name,
      createdAt: stores.createdAt,
    })
    .from(storeMembers)
    .innerJoin(stores, eq(stores.id, storeMembers.storeId))
    .where(eq(storeMembers.userId, user.id))
    .limit(1);
  return membership ? [membership] : [];
}

export async function switchStore(storeId: number) {
  const user = await requireAuth();

  if (user.isOwner) {
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
    if (!store) throw new Error("Loja não encontrada.");
    await createSession(user.id, "owner", store.id, null);
    revalidatePath("/", "layout");
    return { storeId: store.id, storeName: store.name };
  }

  if (user.storeId !== storeId) throw new Error("Sem acesso a esta loja.");
  await createSession(user.id, "member", user.storeId, user.storeRole);
  revalidatePath("/", "layout");
  return { storeId: user.storeId, storeName: user.storeName };
}

export async function createStore(name: string) {
  const user = await requireOwner();
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) throw new Error("Nome da loja inválido.");

  const [store] = await db.insert(stores).values({ name: trimmed }).returning();
  await createSession(user.id, "owner", store.id, null);
  revalidatePath("/", "layout");
  return store;
}

export async function renameStore(storeId: number, name: string) {
  await requireOwner();
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) throw new Error("Nome da loja inválido.");

  const [store] = await db
    .update(stores)
    .set({ name: trimmed })
    .where(eq(stores.id, storeId))
    .returning();
  if (!store) throw new Error("Loja não encontrada.");

  const current = await getCurrentUser();
  if (current?.storeId === storeId) {
    await createSession(current.id, "owner", store.id, null);
  }
  revalidatePath("/", "layout");
  return store;
}

export async function getActiveStoreInfo() {
  const user = await requireAuth();
  return {
    storeId: user.storeId,
    storeName: user.storeName,
    isOwner: user.isOwner,
    isStoreAdmin: user.isStoreAdmin,
    storeRole: user.storeRole,
  };
}
