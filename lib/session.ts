import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

function getEncodedKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export type GlobalRole = "owner" | "member";
export type StoreRole = "admin" | "user";

export type SessionPayload = {
  userId: number;
  globalRole: GlobalRole;
  storeId: number;
  storeRole: StoreRole | null;
  expiresAt: Date;
};

export type DecryptedSession = {
  userId: number;
  globalRole?: GlobalRole;
  /** @deprecated use globalRole / storeRole */
  role?: string;
  storeId?: number;
  storeRole?: StoreRole | null;
  expiresAt: string;
};

export async function encrypt(payload: SessionPayload) {
  return new SignJWT({
    userId: payload.userId,
    globalRole: payload.globalRole,
    storeId: payload.storeId,
    storeRole: payload.storeRole,
    expiresAt: payload.expiresAt.toISOString(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedKey());
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as DecryptedSession;
  } catch {
    return null;
  }
}

export async function createSession(
  userId: number,
  globalRole: GlobalRole,
  storeId: number,
  storeRole: StoreRole | null
) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, globalRole, storeId, storeRole, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  return decrypt(session);
}
