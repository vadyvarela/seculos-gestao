import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const url = process.env.TURSO_DATABASE_URL!;
const isLocalFile = url.startsWith("file:");

const client = createClient({
  url,
  ...(isLocalFile ? {} : { authToken: process.env.TURSO_AUTH_TOKEN }),
});

async function main() {
  console.log("Creating tables...");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER NOT NULL,
      productService TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unitPrice REAL NOT NULL,
      total REAL NOT NULL,
      unitCost REAL NOT NULL DEFAULT 0,
      cost REAL NOT NULL DEFAULT 0,
      profit REAL NOT NULL DEFAULT 0,
      clientName TEXT,
      clientPhone TEXT,
      category TEXT NOT NULL DEFAULT 'outros',
      saleDate TEXT,
      paymentStatus TEXT NOT NULL DEFAULT 'pendente',
      paymentMethod TEXT NOT NULL DEFAULT 'dinheiro',
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      month TEXT NOT NULL,
      year INTEGER NOT NULL DEFAULT 2026
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      value REAL NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'outros',
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const passwordHash = await bcrypt.hash("admin123", 12);
  await client.execute({
    sql: `INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)`,
    args: ["admin", passwordHash, "admin"],
  });

  console.log("Migration done.");
  console.log("  username: admin");
  console.log("  password: admin123");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
