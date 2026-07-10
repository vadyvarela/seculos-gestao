"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAllMonths,
  getMonthlyStats,
  getSalesByMonth,
  createSale,
  updateSale,
  deleteSale,
  getNextSaleNumber,
} from "@/app/api/actions";
import { getSessionUser } from "@/app/api/user-actions";
import { Sale } from "@/lib/schema";
import {
  formatCurrency,
  getMonthName,
  getCurrentMonth,
  getCurrentYear,
  paymentMethodLabel,
} from "@/lib/utils";
import { StatCard, SalesTable } from "@/components/ui";
import { SaleForm, type SaleFormData } from "@/components/SaleForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Search, X } from "lucide-react";
import { toast } from "sonner";

interface MonthlyStats {
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalQuantity: number;
  paidCount: number;
  pendingCount: number;
  pendingPaymentValue: number;
}

type PaymentFilter = "todos" | "pendente" | "pago";

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [months, setMonths] = useState<{ month: string; year: number }[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("todos");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [detailSale, setDetailSale] = useState<Sale | null>(null);

  useEffect(() => {
    getSessionUser().then((u) => setIsAdmin(u.role === "admin")).catch(() => {});
  }, []);

  useEffect(() => {
    async function loadMonths() {
      const m = await getAllMonths();
      const currentMonth = getCurrentMonth();
      const currentYear = getCurrentYear();
      const monthOrder = ["JANEIRO","FEVEREIRO","MARCO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
      const hasCurrentMonth = m.some((x) => x.month === currentMonth && x.year === currentYear);
      const merged = hasCurrentMonth ? m : [...m, { month: currentMonth, year: currentYear }];
      merged.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
      });
      setMonths(merged);
      setSelectedMonth(currentMonth);
      setSelectedYear(currentYear);
    }
    loadMonths();
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [saleData, statsData] = await Promise.all([
          getSalesByMonth(selectedMonth, selectedYear),
          getMonthlyStats(selectedMonth, selectedYear),
        ]);
        setSales(saleData);
        setStats(statsData);
      } finally {
        setLoading(false);
      }
    }
    if (selectedMonth) loadData();
    setSearch("");
    setPaymentFilter("todos");
  }, [selectedMonth, selectedYear]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const q = search.toLowerCase();
      if (
        search &&
        !s.productService.toLowerCase().includes(q) &&
        !(s.clientName?.toLowerCase().includes(q))
      ) {
        return false;
      }
      if (paymentFilter !== "todos" && s.paymentStatus !== paymentFilter) return false;
      return true;
    });
  }, [sales, search, paymentFilter]);

  const hasActiveFilters = search || paymentFilter !== "todos";

  const reload = async () => {
    const [updated, statsData] = await Promise.all([
      getSalesByMonth(selectedMonth, selectedYear),
      getMonthlyStats(selectedMonth, selectedYear),
    ]);
    setSales(updated);
    setStats(statsData);
  };

  const handleAddSale = async (formData: SaleFormData) => {
    const tid = toast.loading("A registar venda...");
    try {
      const currentMonth = getCurrentMonth();
      const currentYear = getCurrentYear();
      const nextNumber = await getNextSaleNumber(currentMonth, currentYear);
      await createSale({
        ...formData,
        number: nextNumber,
        month: currentMonth,
        year: currentYear,
      });
      setShowForm(false);
      await reload();
      toast.success("Venda registada!", { id: tid });
    } catch {
      toast.error("Erro ao registar venda.", { id: tid });
    }
  };

  const handleEditSale = async (formData: SaleFormData) => {
    if (!editingSale) return;
    const tid = toast.loading("A guardar alterações...");
    try {
      await updateSale(editingSale.id, formData);
      setEditingSale(null);
      await reload();
      toast.success("Venda atualizada!", { id: tid });
    } catch {
      toast.error("Erro ao atualizar venda.", { id: tid });
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteId === null) return;
    const tid = toast.loading("A eliminar venda...");
    try {
      await deleteSale(deleteId);
      setDeleteId(null);
      await reload();
      toast.success("Venda eliminada.", { id: tid });
    } catch {
      toast.error("Erro ao eliminar venda.", { id: tid });
    }
  };

  const handleMarkPaid = async (id: number) => {
    const tid = toast.loading("A registar pagamento...");
    try {
      await updateSale(id, { paymentStatus: "pago" });
      await reload();
      toast.success("Pagamento registado!", { id: tid });
    } catch {
      toast.error("Erro ao registar pagamento.", { id: tid });
    }
  };

  return (
    <div className="space-y-6">
      <Dialog open={detailSale !== null} onOpenChange={(open) => !open && setDetailSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Venda #{detailSale?.number} — {detailSale?.productService}
            </DialogTitle>
            <DialogDescription>Detalhes da venda</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 py-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Total</p>
              <p className="font-medium">{detailSale ? formatCurrency(detailSale.total) : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Lucro</p>
              <p className="font-medium">{detailSale ? formatCurrency(detailSale.profit) : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Método</p>
              <p className="font-medium">{detailSale ? paymentMethodLabel(detailSale.paymentMethod) : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Data</p>
              <p className="font-medium">
                {detailSale?.saleDate
                  ? new Date(detailSale.saleDate + "T00:00:00").toLocaleDateString("pt-PT")
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Cliente</p>
              <p className="font-medium">{detailSale?.clientName || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Observações</p>
              <p className="font-medium whitespace-pre-wrap">{detailSale?.notes || "—"}</p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Fechar</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Eliminar venda</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja eliminar esta venda? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Vendas — {getMonthName(selectedMonth)}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Produtos, serviços, custos e lucros</p>
        </div>
        <Button
          onClick={() => {
            setEditingSale(null);
            setShowForm(true);
          }}
        >
          + Nova Venda
        </Button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {months.map(({ month, year }) => {
          const isSelected = month === selectedMonth && year === selectedYear;
          const hasMultipleYears = new Set(months.map((m) => m.year)).size > 1;
          return (
            <button
              key={`${year}-${month}`}
              onClick={() => {
                setSelectedMonth(month);
                setSelectedYear(year);
                setShowForm(false);
                setEditingSale(null);
              }}
              className={[
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              ].join(" ")}
            >
              {getMonthName(month)}
              {hasMultipleYears && <span className="ml-1 opacity-70">{year}</span>}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Vendas" value={stats?.totalSales ?? 0} color="blue" />
        <StatCard label="Unidades" value={stats?.totalQuantity ?? 0} color="orange" />
        <StatCard label="Faturamento" value={formatCurrency(stats?.totalRevenue ?? 0)} color="green" />
        <StatCard label="Custo" value={formatCurrency(stats?.totalCost ?? 0)} color="yellow" />
        <StatCard label="Lucro" value={formatCurrency(stats?.totalProfit ?? 0)} color="purple" />
        <StatCard label="Pagto. pendente" value={formatCurrency(stats?.pendingPaymentValue ?? 0)} color="red" />
      </div>

      <Sheet open={showForm} onOpenChange={(open) => !open && setShowForm(false)}>
        <SheetContent title="Nova Venda">
          <SaleForm onSubmit={handleAddSale} onCancel={() => setShowForm(false)} />
        </SheetContent>
      </Sheet>

      <Sheet open={!!editingSale} onOpenChange={(open) => !open && setEditingSale(null)}>
        <SheetContent title="Editar Venda">
          {editingSale && (
            <SaleForm
              sale={editingSale}
              onSubmit={handleEditSale}
              onCancel={() => setEditingSale(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      <Card>
        <CardHeader className="border-b border-border pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Lista de vendas</CardTitle>
              <CardDescription>
                {hasActiveFilters
                  ? `${filteredSales.length} de ${sales.length} venda${sales.length !== 1 ? "s" : ""}`
                  : `${sales.length} venda${sales.length !== 1 ? "s" : ""}`}{" "}
                em {getMonthName(selectedMonth)}
              </CardDescription>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setPaymentFilter("todos");
                }}
                className="text-muted-foreground text-xs gap-1"
              >
                <X className="size-3" />
                Limpar filtros
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Pesquisar produto ou cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={paymentFilter} onValueChange={(v) => v && setPaymentFilter(v as PaymentFilter)}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os pagtos</SelectItem>
                <SelectItem value="pendente">Pagto. pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Carregando...</p>
          ) : filteredSales.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              {hasActiveFilters
                ? "Nenhuma venda corresponde aos filtros"
                : `Nenhuma venda em ${getMonthName(selectedMonth)}`}
            </p>
          ) : (
            <SalesTable
              sales={filteredSales}
              onRowClick={setDetailSale}
              onEdit={(sale) => {
                setEditingSale(sale);
                setShowForm(false);
              }}
              onDelete={isAdmin ? (id) => setDeleteId(id) : undefined}
              onMarkPaid={handleMarkPaid}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
