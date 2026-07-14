import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";

export const stores = sqliteTable("stores", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;

export const storeMembers = sqliteTable(
  "store_members",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull(),
    storeId: integer("store_id").notNull(),
    role: text().notNull().default("user"), // admin | user
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (t) => [uniqueIndex("store_members_user_id_unique").on(t.userId)]
);

export type StoreMember = typeof storeMembers.$inferSelect;

export const sales = sqliteTable("sales", {
  id: integer().primaryKey({ autoIncrement: true }),
  storeId: integer("store_id").notNull(),
  createdBy: integer("created_by"),
  number: integer().notNull(),
  productService: text().notNull(),
  quantity: integer().notNull().default(1),
  unitPrice: real().notNull(),
  total: real().notNull(),
  unitCost: real().notNull().default(0),
  cost: real().notNull().default(0),
  profit: real().notNull().default(0),
  clientName: text(),
  clientPhone: text(),
  category: text().notNull().default("outros"),
  saleDate: text(),
  paymentStatus: text().notNull().default("pendente"),
  paymentMethod: text().notNull().default("dinheiro"),
  notes: text(),
  createdAt: text().notNull().default(sql`(datetime('now'))`),
  month: text().notNull(),
  year: integer().notNull().default(2026),
});

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;

export const expenses = sqliteTable("expenses", {
  id: integer().primaryKey({ autoIncrement: true }),
  storeId: integer("store_id").notNull(),
  description: text().notNull(),
  value: real().notNull(),
  date: text().notNull(),
  category: text().notNull().default("outros"),
  notes: text(),
  createdAt: text().notNull().default(sql`(datetime('now'))`),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export const users = sqliteTable("users", {
  id: integer().primaryKey({ autoIncrement: true }),
  username: text().notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  /** owner = dono da conta; member = ligado a uma loja via store_members */
  role: text().notNull().default("member"), // owner | member
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export type User = typeof users.$inferSelect;

export function computeSaleAmounts(quantity: number, unitPrice: number, unitCost: number) {
  const qty = Math.max(1, quantity || 1);
  const price = Number(unitPrice) || 0;
  const costUnit = Number(unitCost) || 0;
  const total = qty * price;
  const cost = qty * costUnit;
  const profit = total - cost;
  return { quantity: qty, unitPrice: price, unitCost: costUnit, total, cost, profit };
}
