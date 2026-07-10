"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { LineChart, LogOut, KeyRound, Menu } from "lucide-react";
import { logout } from "@/app/login/actions";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  username?: string;
  isAdmin: boolean;
};

function NavLink({
  href,
  label,
  active,
  onClick,
  className,
}: {
  href: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-md text-sm transition-colors",
        active
          ? "bg-muted text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
        className
      )}
    >
      {label}
    </Link>
  );
}

export function DashboardHeader({ username, isAdmin }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const closeMenu = () => setMenuOpen(false);

  const navItems = [
    { href: "/", label: "Vendas" },
    ...(isAdmin ? [{ href: "/despesas", label: "Despesas" }] : []),
    ...(isAdmin ? [{ href: "/utilizadores", label: "Utilizadores" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden shrink-0"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="size-4" />
          </Button>

          <Link href="/" className="flex items-center gap-2 min-w-0 shrink">
            <span className="text-sm font-semibold tracking-tight truncate">Seculos Eletronicos</span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5 ml-2">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={pathname === item.href}
              />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {username && (
            <span className="hidden lg:inline text-xs text-muted-foreground max-w-24 truncate mr-1">
              {username}
            </span>
          )}

          {isAdmin && (
            <Link
              href="/estatisticas"
              className={cn(
                "hidden md:inline-flex p-2 rounded-md text-sm transition-colors",
                pathname === "/estatisticas"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title="Estatísticas"
            >
              <LineChart className="size-4" aria-hidden />
            </Link>
          )}

          <Link
            href="/conta"
            className={cn(
              "hidden md:inline-flex p-2 rounded-md text-sm transition-colors",
              pathname === "/conta"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            title="Alterar senha"
          >
            <KeyRound className="size-4" aria-hidden />
          </Link>

          <ThemeToggle />

          <form action={logout} className="hidden md:block">
            <button
              type="submit"
              className="p-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Sair"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </form>
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent title="Menu">
          {username && (
            <p className="text-xs text-muted-foreground mb-3 px-1 truncate">{username}</p>
          )}

          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={pathname === item.href}
                onClick={closeMenu}
                className="py-2.5"
              />
            ))}
            {isAdmin && (
              <NavLink
                href="/estatisticas"
                label="Estatísticas"
                active={pathname === "/estatisticas"}
                onClick={closeMenu}
                className="py-2.5"
              />
            )}
          </nav>

          <div className="mt-4 pt-4 border-t border-border flex flex-col gap-0.5">
            <NavLink
              href="/conta"
              label="Alterar senha"
              active={pathname === "/conta"}
              onClick={closeMenu}
              className="py-2.5"
            />
            <form action={logout}>
              <button
                type="submit"
                className="w-full text-left px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Sair
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
