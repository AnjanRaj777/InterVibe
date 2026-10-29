import { Pool } from "pg";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let pool: Pool | null = null;

/** Lazy singleton so tests never open a real connection. */
export function getPool(databaseUrl: string): Pool {
  pool ??= new Pool({ connectionString: databaseUrl, max: 10 });
  return pool;
}

/** Applies every *.sql file in db/migrations in filename order. */
export async function migrate(databaseUrl: string): Promise<string[]> {
  const here = dirname(fileURLToPath(import.meta.url));
  const dir = join(here, "..", "..", "..", "..", "db", "migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const p = getPool(databaseUrl);
  for (const f of files) {
    const sql = await readFile(join(dir, f), "utf8");
    await p.query(sql);
  }
  await p.end();
  pool = null;
  return files;
}
