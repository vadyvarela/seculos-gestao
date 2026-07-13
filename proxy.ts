import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

const publicRoutes = ["/login"];
const adminRoutes = ["/estatisticas", "/despesas", "/utilizadores"];
const ownerRoutes = ["/lojas"];

function isStoreAdminSession(session: {
  globalRole?: string;
  storeRole?: string | null;
  role?: string;
}) {
  if (session.globalRole === "owner" || session.role === "owner" || session.role === "admin") {
    return true;
  }
  return session.storeRole === "admin";
}

function isOwnerSession(session: { globalRole?: string; role?: string }) {
  return session.globalRole === "owner" || session.role === "owner" || session.role === "admin";
}

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  const session = await decrypt(req.cookies.get("session")?.value);

  if (!isPublicRoute && !session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isPublicRoute && session?.userId) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (session?.userId && adminRoutes.some((r) => path === r || path.startsWith(`${r}/`))) {
    if (!isStoreAdminSession(session)) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }

  if (session?.userId && ownerRoutes.some((r) => path === r || path.startsWith(`${r}/`))) {
    if (!isOwnerSession(session)) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.ico$).*)"],
};
