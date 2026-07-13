import type { Metadata } from "next";
import React from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { getCurrentUser } from "@/lib/auth";
import { listMyStores } from "@/app/api/store-actions";

export const metadata: Metadata = {
  title: "Gestão de Loja",
  description: "Sistema de gestão multi-loja",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const stores = user ? await listMyStores() : [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <DashboardHeader
        username={user?.username}
        isStoreAdmin={!!user?.isStoreAdmin}
        isOwner={!!user?.isOwner}
        storeName={user?.storeName ?? "Loja"}
        storeId={user?.storeId ?? 0}
        stores={stores.map((s) => ({ id: s.id, name: s.name }))}
      />

      <main
        key={user?.storeId ?? "none"}
        className="flex-1 max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6"
      >
        {children}
      </main>

      <footer className="border-t border-border">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-muted-foreground">
          © 2026 · {user?.storeName ?? "Gestão de Loja"}
        </div>
      </footer>
    </div>
  );
}
