"use client";

import { useEffect, useState } from "react";
import { getAllStats } from "@/app/api/actions";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
        <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function EstatisticasPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllStats().then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-sm text-muted-foreground">A carregar estatísticas...</p>
      </div>
    );
  }

  if (!stats || stats.months.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-sm text-muted-foreground">Sem dados disponíveis.</p>
      </div>
    );
  }

  const chartData = stats.months.map((m) => ({
    ...m,
    label: getMonthName(m.month).slice(0, 3),
  }));

  const paymentRate = stats.totalSales > 0
    ? Math.round((stats.totalPaid / stats.totalSales) * 100)
    : 0;
  const marginRate = stats.totalRevenue > 0
    ? Math.round((stats.totalProfit / stats.totalRevenue) * 100)
    : 0;
  const avgRevenuePerMonth = stats.months.length > 0
    ? stats.totalRevenue / stats.months.length
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold">Estatísticas</h1>
        <p className="text-sm text-muted-foreground">Visão geral de faturamento, custos e lucros</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Faturamento" value={formatCurrency(stats.totalRevenue)} sub={`${stats.totalSales} vendas`} />
        <KpiCard label="Custo produtos" value={formatCurrency(stats.totalCost)} sub={`Margem ${marginRate}%`} />
        <KpiCard label="Lucro bruto" value={formatCurrency(stats.totalProfit)} sub={`Média ${formatCurrency(avgRevenuePerMonth)}/mês`} />
        <KpiCard
          label="Lucro líquido"
          value={formatCurrency(stats.netProfit)}
          sub={`Despesas ${formatCurrency(stats.totalExpenses)}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Unidades" value={String(stats.totalQuantity)} />
        <KpiCard label="Taxa pagamento" value={`${paymentRate}%`} sub={`${stats.totalPaid} pagas`} />
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
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(v) => formatCurrency(Number(v) || 0)}
                />
                <Area type="monotone" dataKey="revenue" name="Faturamento" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                <Area type="monotone" dataKey="profit" name="Lucro" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
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
                  <span className="tabular-nums font-medium shrink-0">{formatCurrency(p.revenue)}</span>
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
    </div>
  );
}
