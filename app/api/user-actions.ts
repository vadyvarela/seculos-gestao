"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { deleteSession } from "@/lib/session";

export async function getSessionUser() {
  return requireAuth();
}

export async function listUsers() {
  await requireAdmin();
  return db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.username);
}

export async function createUser(username: string, password: string, role: "admin" | "user") {
  await requireAdmin();

  const trimmed = username.trim().toLowerCase();
  if (!trimmed || trimmed.length < 3) throw new Error("Utilizador deve ter pelo menos 3 caracteres.");
  if (!password || password.length < 6) throw new Error("Senha deve ter pelo menos 6 caracteres.");

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, trimmed)).limit(1);
  if (existing[0]) throw new Error("Utilizador já existe.");

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(users)
    .values({ username: trimmed, passwordHash, role })
    .returning({ id: users.id, username: users.username, role: users.role, createdAt: users.createdAt });

  return user;
}

export async function deleteUser(id: number) {
  const current = await requireAdmin();
  if (current.id === id) throw new Error("Não pode eliminar a sua própria conta.");

  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"));

  if (admins.length === 1 && admins[0].id === id) {
    throw new Error("Não pode eliminar o último administrador.");
  }

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
