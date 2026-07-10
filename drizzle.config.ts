import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

const dbUrl = process.env.TURSO_DATABASE_URL || process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl) {
  throw new Error("TURSO_DATABASE_URL or TURSO_CONNECTION_URL is not defined");
}

const isLocalFile = dbUrl.startsWith("file:");

export default defineConfig({
  dialect: isLocalFile ? "sqlite" : "turso",
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dbCredentials: isLocalFile
    ? { url: dbUrl }
    : { url: dbUrl, authToken: authToken! },
});
