"use server";

import { db } from "@/lib/db";
import { users, storeMembers } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAuth, requireStoreAdmin } from "@/lib/auth";
import { deleteSession } from "@/lib/session";

export async function getSessionUser() {
  return requireAuth();
}

export async function listUsers() {
  const current = await requireStoreAdmin();

  return db
    .select({
      id: users.id,
      username: users.username,
      role: storeMembers.role,
      createdAt: users.createdAt,
    })
    .from(storeMembers)
    .innerJoin(users, eq(users.id, storeMembers.userId))
    .where(eq(storeMembers.storeId, current.storeId))
    .orderBy(users.username);
}

export async function createUser(
  username: string,
  password: string,
  role: "admin" | "user"
) {
  const current = await requireStoreAdmin();

  const trimmed = username.trim().toLowerCase();
  if (!trimmed || trimmed.length < 3) throw new Error("Utilizador deve ter pelo menos 3 caracteres.");
  if (!password || password.length < 6) throw new Error("Senha deve ter pelo menos 6 caracteres.");
  if (role !== "admin" && role !== "user") throw new Error("Permissão inválida.");

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, trimmed)).limit(1);
  if (existing[0]) throw new Error("Utilizador já existe.");

  // 1 loja por user: não pode já ser membro de outra
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(users)
    .values({ username: trimmed, passwordHash, role: "member" })
    .returning({ id: users.id, username: users.username, createdAt: users.createdAt });

  try {
    await db.insert(storeMembers).values({
      userId: user.id,
      storeId: current.storeId,
      role,
    });
  } catch {
    await db.delete(users).where(eq(users.id, user.id));
    throw new Error("Não foi possível associar o utilizador à loja.");
  }

  return { ...user, role };
}

export async function deleteUser(id: number) {
  const current = await requireStoreAdmin();
  if (current.id === id) throw new Error("Não pode eliminar a sua própria conta.");

  const [targetUser] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!targetUser) throw new Error("Utilizador não encontrado.");
  if (targetUser.role === "owner") throw new Error("Não pode eliminar o dono da conta.");

  const [membership] = await db
    .select()
    .from(storeMembers)
    .where(and(eq(storeMembers.userId, id), eq(storeMembers.storeId, current.storeId)))
    .limit(1);

  if (!membership) throw new Error("Utilizador não pertence a esta loja.");

  // Não eliminar o último admin da loja
  if (membership.role === "admin") {
    const admins = await db
      .select({ id: storeMembers.id })
      .from(storeMembers)
      .where(and(eq(storeMembers.storeId, current.storeId), eq(storeMembers.role, "admin")));
    if (admins.length === 1) {
      throw new Error("Não pode eliminar o último administrador da loja.");
    }
  }

  await db.delete(storeMembers).where(eq(storeMembers.userId, id));
  await db.delete(users).where(eq(users.id, id));
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const current = await requireAuth();
  if (!newPassword || newPassword.length < 6) throw new Error("Nova senha deve ter pelo menos 6 caracteres.");

  const [user] = await db.select().from(users).where(eq(users.id, current.id)).limit(1);
  if (!user) throw new Error("Utilizador não encontrado.");

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new Error("Senha atual incorreta.");

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(users).set({ passwordHash }).where(eq(users.id, current.id));

  await deleteSession();
  return { success: true };
}
