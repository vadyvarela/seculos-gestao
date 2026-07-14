"use client";

import { useEffect, useState } from "react";
import { getAllStats, getDailyStats } from "@/app/api/actions";
import type { Sale, Expense } from "@/lib/schema";
import {
  formatCurrency,
  getMonthName,
  paymentMethodLabel,
  cn,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { CalendarDays, ChartColumn, ChevronLeft, ChevronRight } from "lucide-react";

interface MonthStat {
  month: string;
  year: number;
  revenue: number;
  cost: number;
  profit: number;
  sales: number;
  paid: number;
  pendingPayment: number;
  quantity: number;
}

interface Stats {
  months: MonthStat[];
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalExpenses: number;
  netProfit: number;
  totalSales: number;
  totalPaid: number;
  totalPendingPayment: number;
  totalQuantity: number;
  topProducts: { name: string; revenue: number; profit: number; sales: number }[];
}

interface DailyStats {
  date: string;
  totalSales: number;
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalExpenses: number;
  netProfit: number;
  paidCount: number;
  pendingCount: number;
  paidRevenue: number;
  pendingPaymentValue: number;
  byMethod: Record<string, number>;
  sales: Sale[];
  expenses: Expense[];
}

type Tab = "daily" | "overview";

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#f1f5f9",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  },
  labelStyle: { color: "#94a3b8", marginBottom: 4 },
  cursor: { fill: "rgba(255,255,255,0.04)" },
};

const AXIS_PROPS = {
  tick: { fontSize: 11, fill: "#64748b" },
  axisLine: false,
  tickLine: false,
};

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function shiftDate(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatPtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-PT", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Metric({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "emerald" | "rose" | "amber" | "blue";
}) {
  const accentClass =
    accent === "emerald"
      ? "text-emerald-500"
      : accent === "rose"
        ? "text-rose-500"
        : accent === "amber"
          ? "text-amber-500"
          : accent === "blue"
            ? "text-blue-400"
            : "text-foreground";

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      <p className={cn("mt-1 text-lg font-semibold tabular-nums leading-tight", accentClass)}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{hint}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const paid = status === "pago";
  return (
    <Badge
      variant="outline"
      className={
        paid
          ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
      }
    >
      {paid ? "Pago" : "Pendente"}
    </Badge>
  );
}

export default function EstatisticasPage() {
  const [tab, setTab] = useState<Tab>("daily");
  const [stats, setStats] = useState<Stats | null>(null);
  const [daily, setDaily] = useState<DailyStats | null>(null);
  const [date, setDate] = useState(todayISO);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [overviewLoaded, setOverviewLoaded] = useState(false);

  useEffect(() => {
    setLoadingDaily(true);
    getDailyStats(date)
      .then(setDaily)
      .catch(() => setDaily(null))
      .finally(() => setLoadingDaily(false));
  }, [date]);

  useEffect(() => {
    if (tab !== "overview" || overviewLoaded) return;
    setLoadingOverview(true);
    getAllStats()
      .then((s) => {
        setStats(s);
        setOverviewLoaded(true);
      })
      .finally(() => setLoadingOverview(false));
  }, [tab, overviewLoaded]);

  const chartData =
    stats?.months.map((m) => ({
      ...m,
      label: getMonthName(m.month).slice(0, 3),
    })) ?? [];

  const paymentRate =
    stats && stats.totalSales > 0 ? Math.round((stats.totalPaid / stats.totalSales) * 100) : 0;
  const marginRate =
    stats && stats.totalRevenue > 0
      ? Math.round((stats.totalProfit / stats.totalRevenue) * 100)
      : 0;

  const methodEntries = daily
    ? Object.entries(daily.byMethod).sort((a, b) => b[1] - a[1])
    : [];

  const isToday = date === todayISO();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Estatísticas</h1>
          <p className="text-sm text-muted-foreground">Fecho diário e visão geral da loja</p>
        </div>

        <div
          role="tablist"
          className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 self-start sm:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "daily"}
            onClick={() => setTab("daily")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === "daily"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDays className="size-3.5" />
            Fecho diário
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "overview"}
            onClick={() => setTab("overview")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === "overview"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ChartColumn className="size-3.5" />
            Visão geral
          </button>
        </div>
      </div>

      {tab === "daily" && (
        <div className="space-y-4" role="tabpanel">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Dia selecionado
                  </p>
                  <p className="text-sm font-medium capitalize mt-0.5">{formatPtDate(date)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setDate(shiftDate(date, -1))}
                    aria-label="Dia anterior"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => e.target.value && setDate(e.target.value)}
                    className="h-8 w-[9.5rem] text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setDate(shiftDate(date, 1))}
                    disabled={isToday}
                    aria-label="Dia seguinte"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                  {!isToday && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8"
                      onClick={() => setDate(todayISO())}
                    >
                      Hoje
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {loadingDaily ? (
            <p className="text-sm text-muted-foreground py-10 text-center">A carregar fecho...</p>
          ) : !daily ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              Não foi possível carregar o fecho.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <Metric
                  label="Vendas"
                  value={String(daily.totalSales)}
                  hint={`${daily.totalQuantity} un.`}
                />
                <Metric label="Faturamento" value={formatCurrency(daily.totalRevenue)} />
                <Metric label="Custo" value={formatCurrency(daily.totalCost)} />
                <Metric
                  label="Lucro bruto"
                  value={formatCurrency(daily.totalProfit)}
                  accent={daily.totalProfit >= 0 ? "emerald" : "rose"}
                />
                <Metric label="Despesas" value={formatCurrency(daily.totalExpenses)} />
                <Metric
                  label="Lucro líquido"
                  value={formatCurrency(daily.netProfit)}
                  accent={daily.netProfit >= 0 ? "emerald" : "rose"}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Metric
                  label="Recebido"
                  value={formatCurrency(daily.paidRevenue)}
                  hint={`${daily.paidCount} paga${daily.paidCount !== 1 ? "s" : ""}`}
                  accent="blue"
                />
                <Metric
                  label="Pendente"
                  value={formatCurrency(daily.pendingPaymentValue)}
                  hint={`${daily.pendingCount} pendente${daily.pendingCount !== 1 ? "s" : ""}`}
                  accent="amber"
                />
                <div className="rounded-lg border border-border bg-card px-3 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Métodos (pago)
                  </p>
                  {methodEntries.length === 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">Sem pagamentos</p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {methodEntries.map(([method, value]) => (
                        <Badge key={method} variant="outline" className="font-normal tabular-nums">
                          {paymentMethodLabel(method)} · {formatCurrency(value)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <Card className="gap-0 py-0">
                  <CardHeader className="border-b border-border py-3">
                    <CardTitle className="text-sm font-semibold">Vendas do dia</CardTitle>
                    <CardDescription>
                      {daily.sales.length} registo{daily.sales.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {daily.sales.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Nenhuma venda nesta data.
                      </p>
                    ) : (
                      <div className="overflow-x-auto max-h-80">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="text-xs w-10">#</TableHead>
                              <TableHead className="text-xs">Produto</TableHead>
                              <TableHead className="text-xs">Total</TableHead>
                              <TableHead className="text-xs">Lucro</TableHead>
                              <TableHead className="text-xs">Pagto</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {daily.sales.map((s) => (
                              <TableRow key={s.id}>
                                <TableCell className="text-muted-foreground text-xs">
                                  {s.number}
                                </TableCell>
                                <TableCell className="font-medium max-w-36 truncate text-sm">
                                  {s.productService}
                                </TableCell>
                                <TableCell className="tabular-nums text-sm">
                                  {formatCurrency(s.total)}
                                </TableCell>
                                <TableCell
                                  className={cn(
                                    "tabular-nums text-sm font-medium",
                                    s.profit >= 0 ? "text-emerald-500" : "text-rose-500"
                                  )}
                                >
                                  {formatCurrency(s.profit)}
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={s.paymentStatus} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="gap-0 py-0">
                  <CardHeader className="border-b border-border py-3">
                    <CardTitle className="text-sm font-semibold">Despesas do dia</CardTitle>
                    <CardDescription>
                      {daily.expenses.length} registo{daily.expenses.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {daily.expenses.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Nenhuma despesa nesta data.
                      </p>
                    ) : (
                      <div className="overflow-x-auto max-h-80">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="text-xs">Descrição</TableHead>
                              <TableHead className="text-xs">Categoria</TableHead>
                              <TableHead className="text-xs">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {daily.expenses.map((e) => (
                              <TableRow key={e.id}>
                                <TableCell className="font-medium max-w-44 truncate text-sm">
                                  {e.description}
                                </TableCell>
                                <TableCell className="text-muted-foreground capitalize text-sm">
                                  {e.category}
                                </TableCell>
                                <TableCell className="tabular-nums text-sm">
                                  {formatCurrency(e.value)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "overview" && (
        <div className="space-y-4" role="tabpanel">
          {loadingOverview ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              A carregar visão geral...
            </p>
          ) : !stats || stats.months.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              Sem dados mensais disponíveis.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <Metric
                  label="Faturamento"
                  value={formatCurrency(stats.totalRevenue)}
                  hint={`${stats.totalSales} vendas`}
                />
                <Metric
                  label="Custo produtos"
                  value={formatCurrency(stats.totalCost)}
                  hint={`Margem ${marginRate}%`}
                />
                <Metric
                  label="Lucro bruto"
                  value={formatCurrency(stats.totalProfit)}
                  accent={stats.totalProfit >= 0 ? "emerald" : "rose"}
                />
                <Metric
                  label="Lucro líquido"
                  value={formatCurrency(stats.netProfit)}
                  hint={`Despesas ${formatCurrency(stats.totalExpenses)}`}
                  accent={stats.netProfit >= 0 ? "emerald" : "rose"}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Metric label="Unidades" value={String(stats.totalQuantity)} />
                <Metric
                  label="Taxa pagamento"
                  value={`${paymentRate}%`}
                  hint={`${stats.totalPaid} pagas`}
                />
                <Metric
                  label="Pagto. pendente"
                  value={formatCurrency(stats.totalPendingPayment)}
                  accent="amber"
                />
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Faturamento vs Lucro</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                        <XAxis dataKey="label" {...AXIS_PROPS} />
                        <YAxis
                          {...AXIS_PROPS}
                          tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                        />
                        <Tooltip
                          {...TOOLTIP_STYLE}
                          formatter={(v) => formatCurrency(Number(v) || 0)}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          name="Faturamento"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.15}
                        />
                        <Area
                          type="monotone"
                          dataKey="profit"
                          name="Lucro"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.15}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Vendas por mês</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                        <XAxis dataKey="label" {...AXIS_PROPS} />
                        <YAxis {...AXIS_PROPS} allowDecimals={false} />
                        <Tooltip {...TOOLTIP_STYLE} />
                        <Bar dataKey="sales" name="Vendas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Top produtos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.topProducts.map((p, i) => {
                    const max = stats.topProducts[0]?.revenue || 1;
                    return (
                      <div key={p.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm gap-2">
                          <span className="truncate">
                            <span className="text-muted-foreground mr-2">{i + 1}.</span>
                            {p.name}
                          </span>
                          <span className="tabular-nums font-medium shrink-0">
                            {formatCurrency(p.revenue)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${Math.round((p.revenue / max) * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {p.sales} venda{p.sales !== 1 ? "s" : ""} · lucro{" "}
                          {formatCurrency(p.profit)}
                        </p>
                      </div>
                    );
                  })}
                  {stats.topProducts.length === 0 && (
                    <p className="text-sm text-muted-foreground">Sem dados</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
