import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const sales = sqliteTable("sales", {
  id: integer().primaryKey({ autoIncrement: true }),
  number: integer().notNull(),
  productService: text().notNull(), // Produto/serviço
  quantity: integer().notNull().default(1),
  unitPrice: real().notNull(), // Preço unitário
  total: real().notNull(), // qty * unitPrice
  unitCost: real().notNull().default(0), // Custo unitário
  cost: real().notNull().default(0), // qty * unitCost
  profit: real().notNull().default(0), // total - cost
  clientName: text(),
  clientPhone: text(),
  category: text().notNull().default("outros"), // telemovel, computador, acessorio, reparacao, servico, outros
  saleDate: text(), // ISO date
  paymentStatus: text().notNull().default("pendente"), // pendente, pago
  paymentMethod: text().notNull().default("dinheiro"), // dinheiro, transferencia, cartao, outros
  notes: text(),
  createdAt: text().notNull().default(sql`(datetime('now'))`),
  month: text().notNull(),
  year: integer().notNull().default(2026),
});

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;

export const expenses = sqliteTable("expenses", {
  id: integer().primaryKey({ autoIncrement: true }),
  description: text().notNull(),
  value: real().notNull(),
  date: text().notNull(),
  category: text().notNull().default("outros"), // stock, transporte, funcionario, aluguel, marketing, outros
  notes: text(),
  createdAt: text().notNull().default(sql`(datetime('now'))`),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export const users = sqliteTable("users", {
  id: integer().primaryKey({ autoIncrement: true }),
  username: text().notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text().notNull().default("user"), // admin | user
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export type User = typeof users.$inferSelect;

/** Compute line totals from qty, unit price and unit cost */
export function computeSaleAmounts(quantity: number, unitPrice: number, unitCost: number) {
  const qty = Math.max(1, quantity || 1);
  const price = Number(unitPrice) || 0;
  const costUnit = Number(unitCost) || 0;
  const total = qty * price;
  const cost = qty * costUnit;
  const profit = total - cost;
  return { quantity: qty, unitPrice: price, unitCost: costUnit, total, cost, profit };
}
