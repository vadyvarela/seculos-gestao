"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users, storeMembers, stores } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession, deleteSession, type GlobalRole, type StoreRole } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

export async function login(state: LoginState, formData: FormData): Promise<LoginState> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Preencha todos os campos." };
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username.trim().toLowerCase()))
    .limit(1);
  const user = result[0];

  if (!user) {
    return { error: "Utilizador ou senha inválidos." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Utilizador ou senha inválidos." };
  }

  // Compat: admin legado → owner; user legado → member
  let globalRole: GlobalRole =
    user.role === "owner" || user.role === "admin" ? "owner" : "member";

  let storeId: number;
  let storeRole: StoreRole | null = null;

  if (globalRole === "owner") {
    const all = await db.select().from(stores).orderBy(stores.id).limit(1);
    if (!all[0]) {
      const [created] = await db.insert(stores).values({ name: "Loja principal" }).returning();
      storeId = created.id;
    } else {
      storeId = all[0].id;
    }
  } else {
    const [membership] = await db
      .select()
      .from(storeMembers)
      .where(eq(storeMembers.userId, user.id))
      .limit(1);
    if (!membership) {
      return { error: "Utilizador sem loja atribuída. Contacte o administrador." };
    }
    storeId = membership.storeId;
    storeRole = membership.role as StoreRole;
  }

  await createSession(user.id, globalRole, storeId, storeRole);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
