"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession, deleteSession } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

export async function login(state: LoginState, formData: FormData): Promise<LoginState> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Preencha todos os campos." };
  }

  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  const user = result[0];

  if (!user) {
    return { error: "Utilizador ou senha inválidos." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Utilizador ou senha inválidos." };
  }

  await createSession(user.id, user.role ?? "user");
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
