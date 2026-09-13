import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.local", ".env"] });

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  // Same default and env hook as src/db/index.ts, so migrations and the app
  // never end up pointed at different files.
  dbCredentials: { url: process.env.DB_FILE_NAME ?? "./src/db/dictionarium.db" },
});
