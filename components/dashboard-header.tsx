"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { LineChart, LogOut, KeyRound, Menu, Store } from "lucide-react";
import { logout } from "@/app/login/actions";
import { switchStore } from "@/app/api/store-actions";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type StoreOption = { id: number; name: string };

type Props = {
  username?: string;
  isStoreAdmin: boolean;
  isOwner: boolean;
  storeName: string;
  storeId: number;
  stores: StoreOption[];
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

export function DashboardHeader({
  username,
  isStoreAdmin,
  isOwner,
  storeName,
  storeId,
  stores,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  const closeMenu = () => setMenuOpen(false);

  const navItems = [
    { href: "/", label: "Vendas" },
    { href: "/despesas", label: "Despesas" },
    ...(isStoreAdmin ? [{ href: "/utilizadores", label: "Utilizadores" }] : []),
    ...(isOwner ? [{ href: "/lojas", label: "Lojas" }] : []),
  ];

  const handleSwitch = (value: string | null) => {
    if (!value) return;
    const id = Number(value);
    if (id === storeId) return;
    startTransition(async () => {
      try {
        await switchStore(id);
        router.refresh();
        toast.success("Loja alterada.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao mudar de loja.");
      }
    });
  };

  const storeItems = stores.map((s) => ({
    value: String(s.id),
    label: s.name,
  }));

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

          <div className="flex flex-col min-w-0 shrink">
            <Link href="/" className="text-sm font-semibold tracking-tight truncate leading-tight">
              {storeName}
            </Link>
            {isOwner && stores.length > 1 && (
              <span className="text-[10px] text-muted-foreground leading-none hidden sm:block">
                Dono · {stores.length} lojas
              </span>
            )}
          </div>

          {isOwner && stores.length > 0 ? (
            <Select
              value={String(storeId)}
              onValueChange={handleSwitch}
              disabled={pending}
              items={storeItems}
            >
              <SelectTrigger className="hidden sm:flex h-8 min-w-[10rem] max-w-[14rem] text-xs">
                <Store className="size-3.5 shrink-0 opacity-60" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {storeItems.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <nav className="hidden md:flex items-center gap-0.5 ml-1">
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

          {isStoreAdmin && (
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

          {isOwner && stores.length > 0 && (
            <div className="mb-3 px-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Loja</p>
              <Select
                value={String(storeId)}
                onValueChange={handleSwitch}
                disabled={pending}
                items={storeItems}
              >
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {storeItems.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!isOwner && (
            <p className="text-xs text-muted-foreground mb-3 px-1 flex items-center gap-1.5">
              <Store className="size-3.5" />
              {storeName}
            </p>
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
            {isStoreAdmin && (
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
