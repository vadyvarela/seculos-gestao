import { config } from "dotenv";
import path from "path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

config({ path: path.resolve(process.cwd(), ".env.local") });

const dbUrl = process.env.TURSO_DATABASE_URL || process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl) {
  throw new Error("TURSO_DATABASE_URL or TURSO_CONNECTION_URL is not defined");
}

const isLocalFile = dbUrl.startsWith("file:");

const client = createClient({
  url: dbUrl,
  ...(isLocalFile ? {} : { authToken }),
});

export const db = drizzle(client);
