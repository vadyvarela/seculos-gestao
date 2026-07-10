import type { Metadata } from "next";
import React from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Seculos Eletronicos",
  description: "Sistema de gestão — Seculos Eletronicos",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <DashboardHeader username={user?.username} isAdmin={isAdmin} />

      <main className="flex-1 max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <footer className="border-t border-border">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-muted-foreground">
          © 2026 Seculos Eletronicos
        </div>
      </footer>
    </div>
  );
}
