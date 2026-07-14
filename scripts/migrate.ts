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

async function tableExists(name: string) {
  const r = await client.execute({
    sql: `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    args: [name],
  });
  return r.rows.length > 0;
}

async function columnExists(table: string, column: string) {
  const r = await client.execute(`PRAGMA table_info(${table})`);
  return r.rows.some((row) => row.name === column);
}

async function main() {
  console.log("Migrating multi-loja...");

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
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS store_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      store_id INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  try {
    await client.execute(
      `CREATE UNIQUE INDEX IF NOT EXISTS store_members_user_id_unique ON store_members(user_id)`
    );
  } catch {
    // ignore
  }

  if (!(await columnExists("sales", "store_id"))) {
    await client.execute(`ALTER TABLE sales ADD COLUMN store_id INTEGER`);
  }
  if (!(await columnExists("sales", "created_by"))) {
    await client.execute(`ALTER TABLE sales ADD COLUMN created_by INTEGER`);
  }
  if (!(await columnExists("expenses", "store_id"))) {
    await client.execute(`ALTER TABLE expenses ADD COLUMN store_id INTEGER`);
  }

  let storeId: number | null = null;
  const existingStores = await client.execute(`SELECT id FROM stores ORDER BY id LIMIT 1`);
  if (existingStores.rows[0]) {
    storeId = Number(existingStores.rows[0].id);
  } else {
    const inserted = await client.execute({
      sql: `INSERT INTO stores (name) VALUES (?) RETURNING id`,
      args: ["Loja principal"],
    });
    storeId = Number(inserted.rows[0].id);
    console.log('Created store "Loja principal" id=', storeId);
  }

  await client.execute({
    sql: `UPDATE sales SET store_id = ? WHERE store_id IS NULL`,
    args: [storeId],
  });
  await client.execute({
    sql: `UPDATE expenses SET store_id = ? WHERE store_id IS NULL`,
    args: [storeId],
  });

  // Seed default owner if no users
  const userCount = await client.execute(`SELECT COUNT(*) as c FROM users`);
  if (Number(userCount.rows[0].c) === 0) {
    const passwordHash = await bcrypt.hash("admin123", 12);
    await client.execute({
      sql: `INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)`,
      args: ["admin", passwordHash, "owner"],
    });
    console.log("  username: admin");
    console.log("  password: admin123");
  }

  // Promote legacy global admins to owner (first one keeps owner; others become store admins)
  const legacyAdmins = await client.execute(
    `SELECT id, username, role FROM users WHERE role = 'admin' ORDER BY id`
  );
  if (legacyAdmins.rows.length > 0) {
    const first = legacyAdmins.rows[0];
    await client.execute({
      sql: `UPDATE users SET role = 'owner' WHERE id = ?`,
      args: [first.id],
    });
    for (const row of legacyAdmins.rows.slice(1)) {
      await client.execute({
        sql: `UPDATE users SET role = 'member' WHERE id = ?`,
        args: [row.id],
      });
      await client.execute({
        sql: `INSERT OR IGNORE INTO store_members (user_id, store_id, role) VALUES (?, ?, ?)`,
        args: [row.id, storeId, "admin"],
      });
    }
    console.log("Promoted", first.username, "to owner");
  }

  // Legacy global "user" → member + store membership
  const legacyUsers = await client.execute(
    `SELECT id FROM users WHERE role = 'user'`
  );
  for (const row of legacyUsers.rows) {
    await client.execute({
      sql: `UPDATE users SET role = 'member' WHERE id = ?`,
      args: [row.id],
    });
    await client.execute({
      sql: `INSERT OR IGNORE INTO store_members (user_id, store_id, role) VALUES (?, ?, ?)`,
      args: [row.id, storeId, "user"],
    });
  }

  // Members without membership → attach to default store as user
  const orphans = await client.execute(`
    SELECT u.id FROM users u
    WHERE u.role = 'member'
      AND NOT EXISTS (SELECT 1 FROM store_members m WHERE m.user_id = u.id)
  `);
  for (const row of orphans.rows) {
    await client.execute({
      sql: `INSERT INTO store_members (user_id, store_id, role) VALUES (?, ?, ?)`,
      args: [row.id, storeId, "user"],
    });
  }

  // Ensure at least one owner exists
  const owners = await client.execute(`SELECT id FROM users WHERE role = 'owner' LIMIT 1`);
  if (owners.rows.length === 0) {
    const firstUser = await client.execute(`SELECT id FROM users ORDER BY id LIMIT 1`);
    if (firstUser.rows[0]) {
      await client.execute({
        sql: `UPDATE users SET role = 'owner' WHERE id = ?`,
        args: [firstUser.rows[0].id],
      });
      await client.execute({
        sql: `DELETE FROM store_members WHERE user_id = ?`,
        args: [firstUser.rows[0].id],
      });
      console.log("Assigned owner to first user id=", firstUser.rows[0].id);
    }
  }

  void tableExists;

  console.log("Migration done. Default store id=", storeId);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
