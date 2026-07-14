"use client";

import { useEffect, useState } from "react";
import { getAllStats, getDailyStats } from "@/app/api/actions";
import type { Sale, Expense } from "@/lib/schema";
import { formatCurrency, getMonthName, paymentMethodLabel } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";

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

function formatPtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
        <p className="mt-2 text-2xl sm:text-3xl font-semibold tabular-nums">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function EstatisticasPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [daily, setDaily] = useState<DailyStats | null>(null);
  const [date, setDate] = useState(todayISO);
  const [loading, setLoading] = useState(true);
  const [loadingDaily, setLoadingDaily] = useState(true);

  useEffect(() => {
    getAllStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoadingDaily(true);
    getDailyStats(date)
      .then(setDaily)
      .catch(() => setDaily(null))
      .finally(() => setLoadingDaily(false));
  }, [date]);

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
  const avgRevenuePerMonth =
    stats && stats.months.length > 0 ? stats.totalRevenue / stats.months.length : 0;

  const methodEntries = daily
    ? Object.entries(daily.byMethod).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Estatísticas</h1>
          <p className="text-sm text-muted-foreground">Fecho diário e visão geral</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="fechoDate" className="text-xs text-muted-foreground">
              Data do fecho
            </Label>
            <Input
              id="fechoDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 w-auto"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => setDate(todayISO())}
          >
            Hoje
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Fecho diário</h2>
          <p className="text-xs text-muted-foreground capitalize">{formatPtDate(date)}</p>
        </div>

        {loadingDaily ? (
          <p className="text-sm text-muted-foreground py-6">A carregar fecho...</p>
        ) : !daily ? (
          <p className="text-sm text-muted-foreground py-6">Não foi possível carregar o fecho.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiCard
                label="Faturamento"
                value={formatCurrency(daily.totalRevenue)}
                sub={`${daily.totalSales} venda${daily.totalSales !== 1 ? "s" : ""} · ${daily.totalQuantity} un.`}
              />
              <KpiCard
                label="Custo"
                value={formatCurrency(daily.totalCost)}
                sub={`Lucro bruto ${formatCurrency(daily.totalProfit)}`}
              />
              <KpiCard
                label="Despesas"
                value={formatCurrency(daily.totalExpenses)}
                sub={`${daily.expenses.length} registo${daily.expenses.length !== 1 ? "s" : ""}`}
              />
              <KpiCard
                label="Lucro líquido"
                value={formatCurrency(daily.netProfit)}
                sub={
                  daily.netProfit >= 0 ? "Dia positivo" : "Dia negativo"
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <KpiCard
                label="Recebido"
                value={formatCurrency(daily.paidRevenue)}
                sub={`${daily.paidCount} paga${daily.paidCount !== 1 ? "s" : ""}`}
              />
              <KpiCard
                label="Pendente"
                value={formatCurrency(daily.pendingPaymentValue)}
                sub={`${daily.pendingCount} pendente${daily.pendingCount !== 1 ? "s" : ""}`}
              />
              <KpiCard
                label="Métodos (pago)"
                value={methodEntries.length ? formatCurrency(methodEntries[0]?.[1] ?? 0) : "—"}
                sub={
                  methodEntries.length
                    ? methodEntries.map(([m, v]) => `${paymentMethodLabel(m)} ${formatCurrency(v)}`).join(" · ")
                    : "Sem pagamentos"
                }
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Vendas do dia</CardTitle>
                  <CardDescription>
                    {daily.sales.length} registo{daily.sales.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {daily.sales.length === 0 ? (
                    <p className="px-6 pb-6 text-sm text-muted-foreground">Nenhuma venda nesta data.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-xs">#</TableHead>
                            <TableHead className="text-xs">Produto</TableHead>
                            <TableHead className="text-xs">Total</TableHead>
                            <TableHead className="text-xs">Lucro</TableHead>
                            <TableHead className="text-xs">Pagto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {daily.sales.map((s) => (
                            <TableRow key={s.id}>
                              <TableCell className="text-muted-foreground">{s.number}</TableCell>
                              <TableCell className="font-medium max-w-40 truncate">
                                {s.productService}
                              </TableCell>
                              <TableCell className="tabular-nums">{formatCurrency(s.total)}</TableCell>
                              <TableCell
                                className={cn(
                                  "tabular-nums font-medium",
                                  s.profit >= 0 ? "text-emerald-500" : "text-rose-500"
                                )}
                              >
                                {formatCurrency(s.profit)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    s.paymentStatus === "pago"
                                      ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                  }
                                >
                                  {s.paymentStatus === "pago" ? "Pago" : "Pendente"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Despesas do dia</CardTitle>
                  <CardDescription>
                    {daily.expenses.length} registo{daily.expenses.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {daily.expenses.length === 0 ? (
                    <p className="px-6 pb-6 text-sm text-muted-foreground">Nenhuma despesa nesta data.</p>
                  ) : (
                    <div className="overflow-x-auto">
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
                              <TableCell className="font-medium max-w-48 truncate">
                                {e.description}
                              </TableCell>
                              <TableCell className="text-muted-foreground capitalize">
                                {e.category}
                              </TableCell>
                              <TableCell className="tabular-nums">
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
      </section>

      <div className="border-t border-border pt-8 space-y-6">
        <div>
          <h2 className="text-sm font-semibold">Visão geral</h2>
          <p className="text-xs text-muted-foreground">Totais acumulados da loja</p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-6">A carregar estatísticas...</p>
        ) : !stats || stats.months.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6">Sem dados mensais disponíveis.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiCard
                label="Faturamento"
                value={formatCurrency(stats.totalRevenue)}
                sub={`${stats.totalSales} vendas`}
              />
              <KpiCard
                label="Custo produtos"
                value={formatCurrency(stats.totalCost)}
                sub={`Margem ${marginRate}%`}
              />
              <KpiCard
                label="Lucro bruto"
                value={formatCurrency(stats.totalProfit)}
                sub={`Média ${formatCurrency(avgRevenuePerMonth)}/mês`}
              />
              <KpiCard
                label="Lucro líquido"
                value={formatCurrency(stats.netProfit)}
                sub={`Despesas ${formatCurrency(stats.totalExpenses)}`}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <KpiCard label="Unidades" value={String(stats.totalQuantity)} />
              <KpiCard
                label="Taxa pagamento"
                value={`${paymentRate}%`}
                sub={`${stats.totalPaid} pagas`}
              />
              <KpiCard label="Pagto. pendente" value={formatCurrency(stats.totalPendingPayment)} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Faturamento vs Lucro</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                      <XAxis dataKey="label" {...AXIS_PROPS} />
                      <YAxis {...AXIS_PROPS} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                      <Tooltip {...TOOLTIP_STYLE} formatter={(v) => formatCurrency(Number(v) || 0)} />
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
                        {p.sales} venda{p.sales !== 1 ? "s" : ""} · lucro {formatCurrency(p.profit)}
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
    </div>
  );
}
