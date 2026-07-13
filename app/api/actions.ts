"use server";

import { db } from "@/lib/db";
import {
  sales,
  type Sale,
  type NewSale,
  expenses,
  type Expense,
  type NewExpense,
  computeSaleAmounts,
} from "@/lib/schema";
import { eq, desc, and, like, or } from "drizzle-orm";
import { requireAuth, requireStoreAdmin } from "@/lib/auth";

type SaleInput = Omit<
  NewSale,
  "total" | "cost" | "profit" | "unitPrice" | "unitCost" | "quantity" | "storeId"
> & {
  quantity: number;
  unitPrice: number;
  unitCost: number;
};

function withAmounts(data: SaleInput & { storeId: number }) {
  const amounts = computeSaleAmounts(data.quantity, data.unitPrice, data.unitCost);
  return { ...data, ...amounts };
}

async function assertSaleInStore(id: number, storeId: number) {
  const [existing] = await db.select().from(sales).where(eq(sales.id, id)).limit(1);
  if (!existing || existing.storeId !== storeId) throw new Error("Venda não encontrada.");
  return existing;
}

async function assertExpenseInStore(id: number, storeId: number) {
  const [existing] = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  if (!existing || existing.storeId !== storeId) throw new Error("Despesa não encontrada.");
  return existing;
}

export async function createSale(data: SaleInput): Promise<Sale> {
  const user = await requireAuth();
  const payload = {
    ...data,
    storeId: user.storeId,
    unitCost: user.isStoreAdmin ? data.unitCost : 0,
  };
  const [sale] = await db.insert(sales).values(withAmounts(payload)).returning();
  return sale;
}

export async function getSalesByMonth(month: string, year: number): Promise<Sale[]> {
  const user = await requireAuth();
  return db
    .select()
    .from(sales)
    .where(and(eq(sales.storeId, user.storeId), eq(sales.month, month), eq(sales.year, year)))
    .orderBy(desc(sales.number));
}

export async function searchSales(query: string): Promise<Sale[]> {
  const user = await requireAuth();
  return db
    .select()
    .from(sales)
    .where(
      and(
        eq(sales.storeId, user.storeId),
        or(like(sales.productService, `%${query}%`), like(sales.clientName, `%${query}%`))
      )
    )
    .orderBy(desc(sales.createdAt));
}

export async function updateSale(id: number, data: Partial<SaleInput>): Promise<Sale> {
  const user = await requireAuth();
  const existing = await assertSaleInStore(id, user.storeId);

  const { unitCost: _ignored, ...rest } = data;
  const safeData = user.isStoreAdmin ? data : rest;

  const merged = {
    quantity: safeData.quantity ?? existing.quantity,
    unitPrice: safeData.unitPrice ?? existing.unitPrice,
    unitCost: user.isStoreAdmin ? (data.unitCost ?? existing.unitCost) : existing.unitCost,
  };
  const amounts = computeSaleAmounts(merged.quantity, merged.unitPrice, merged.unitCost);

  const [sale] = await db
    .update(sales)
    .set({ ...safeData, ...amounts })
    .where(and(eq(sales.id, id), eq(sales.storeId, user.storeId)))
    .returning();
  return sale;
}

export async function updateSaleCost(id: number, unitCost: number): Promise<Sale> {
  const user = await requireStoreAdmin();
  const existing = await assertSaleInStore(id, user.storeId);

  const cost = Math.max(0, Number(unitCost) || 0);
  const amounts = computeSaleAmounts(existing.quantity, existing.unitPrice, cost);

  const [sale] = await db
    .update(sales)
    .set(amounts)
    .where(and(eq(sales.id, id), eq(sales.storeId, user.storeId)))
    .returning();
  return sale;
}

export async function deleteSale(id: number): Promise<void> {
  const user = await requireStoreAdmin();
  await assertSaleInStore(id, user.storeId);
  await db.delete(sales).where(and(eq(sales.id, id), eq(sales.storeId, user.storeId)));
}

export async function getMonthlyStats(month: string, year: number) {
  await requireAuth();
  const monthSales = await getSalesByMonth(month, year);

  const totalSales = monthSales.length;
  const totalRevenue = monthSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const totalCost = monthSales.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
  const totalProfit = monthSales.reduce((sum, s) => sum + (Number(s.profit) || 0), 0);
  const totalQuantity = monthSales.reduce((sum, s) => sum + (s.quantity ?? 1), 0);
  const paidCount = monthSales.filter((s) => s.paymentStatus === "pago").length;
  const pendingPaymentValue = monthSales
    .filter((s) => s.paymentStatus === "pendente")
    .reduce((sum, s) => sum + (Number(s.total) || 0), 0);

  return {
    totalSales,
    totalRevenue,
    totalCost,
    totalProfit,
    totalQuantity,
    paidCount,
    pendingCount: totalSales - paidCount,
    pendingPaymentValue,
  };
}

export async function getAllMonths(): Promise<{ month: string; year: number }[]> {
  const user = await requireAuth();
  const result = await db
    .selectDistinct({ month: sales.month, year: sales.year })
    .from(sales)
    .where(eq(sales.storeId, user.storeId));
  return result.filter((r) => r.month) as { month: string; year: number }[];
}

const MONTH_ORDER = [
  "JANEIRO", "FEVEREIRO", "MARCO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];

export async function getAllStats() {
  const user = await requireStoreAdmin();
  const all = await db.select().from(sales).where(eq(sales.storeId, user.storeId));
  const allExpenses = await db.select().from(expenses).where(eq(expenses.storeId, user.storeId));

  const byMonth: Record<
    string,
    {
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
  > = {};

  for (const s of all) {
    if (!s.month) continue;
    const key = `${s.year ?? 2026}-${s.month}`;
    if (!byMonth[key]) {
      byMonth[key] = {
        month: s.month,
        year: s.year ?? 2026,
        revenue: 0,
        cost: 0,
        profit: 0,
        sales: 0,
        paid: 0,
        pendingPayment: 0,
        quantity: 0,
      };
    }
    const m = byMonth[key];
    m.revenue += Number(s.total) || 0;
    m.cost += Number(s.cost) || 0;
    m.profit += Number(s.profit) || 0;
    m.sales += 1;
    m.quantity += s.quantity ?? 1;
    if (s.paymentStatus === "pago") m.paid += 1;
    else m.pendingPayment += Number(s.total) || 0;
  }

  const months = Object.values(byMonth).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month);
  });

  const totalRevenue = all.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const totalCost = all.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
  const totalProfit = all.reduce((sum, s) => sum + (Number(s.profit) || 0), 0);
  const totalSales = all.length;
  const totalPaid = all.filter((s) => s.paymentStatus === "pago").length;
  const totalPendingPayment = all
    .filter((s) => s.paymentStatus === "pendente")
    .reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const totalQuantity = all.reduce((sum, s) => sum + (s.quantity ?? 1), 0);
  const totalExpenses = allExpenses.reduce((sum, e) => sum + (Number(e.value) || 0), 0);
  const netProfit = totalProfit - totalExpenses;

  const productMap: Record<string, { name: string; revenue: number; profit: number; sales: number }> =
    {};
  for (const s of all) {
    if (!s.productService) continue;
    const k = s.productService.trim().toUpperCase();
    if (!productMap[k]) productMap[k] = { name: s.productService.trim(), revenue: 0, profit: 0, sales: 0 };
    productMap[k].revenue += Number(s.total) || 0;
    productMap[k].profit += Number(s.profit) || 0;
    productMap[k].sales += 1;
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    months,
    totalRevenue,
    totalCost,
    totalProfit,
    totalExpenses,
    netProfit,
    totalSales,
    totalPaid,
    totalPendingPayment,
    totalQuantity,
    topProducts,
  };
}

export async function getExpenses(): Promise<Expense[]> {
  const user = await requireStoreAdmin();
  return db
    .select()
    .from(expenses)
    .where(eq(expenses.storeId, user.storeId))
    .orderBy(desc(expenses.date), desc(expenses.createdAt));
}

export async function createExpense(
  data: Omit<NewExpense, "storeId">
): Promise<Expense> {
  const user = await requireStoreAdmin();
  const [expense] = await db
    .insert(expenses)
    .values({ ...data, storeId: user.storeId })
    .returning();
  return expense;
}

export async function updateExpense(
  id: number,
  data: Partial<Omit<Expense, "id" | "storeId" | "createdAt">>
): Promise<Expense> {
  const user = await requireStoreAdmin();
  await assertExpenseInStore(id, user.storeId);
  const [expense] = await db
    .update(expenses)
    .set(data)
    .where(and(eq(expenses.id, id), eq(expenses.storeId, user.storeId)))
    .returning();
  return expense;
}

export async function deleteExpense(id: number): Promise<void> {
  const user = await requireStoreAdmin();
  await assertExpenseInStore(id, user.storeId);
  await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.storeId, user.storeId)));
}

export async function getNextSaleNumber(month: string, year: number): Promise<number> {
  const user = await requireAuth();
  const last = await db
    .select({ number: sales.number })
    .from(sales)
    .where(and(eq(sales.storeId, user.storeId), eq(sales.month, month), eq(sales.year, year)))
    .orderBy(desc(sales.number))
    .limit(1);

  return (last[0]?.number || 0) + 1;
}
