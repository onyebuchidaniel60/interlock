import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import pg from "pg";

const migrationsDir = path.resolve(process.cwd(), "db/migrations");
const url = process.env.DATABASE_URL_UNPOOLED;

if (!url) {
  console.error("DATABASE_URL_UNPOOLED is required for migrations.");
  process.exit(2);
}

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: true },
});

try {
  await client.connect();

  const identity = await client.query(
    "select current_user, session_user, current_database() as database, rolbypassrls from pg_roles where rolname = current_user",
  );
  const row = identity.rows[0];
  if (row.current_user !== "neondb_owner") {
    throw new Error(`Migrations must run as neondb_owner, got ${row.current_user}`);
  }

  await client.query(`
    create table if not exists public.schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const applied = await client.query("select 1 from public.schema_migrations where version = $1", [file]);
    if (applied.rowCount) {
      console.log(`skip ${file}`);
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into public.schema_migrations (version) values ($1)", [file]);
      await client.query("commit");
      console.log(`applied ${file}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }

  console.log(`migrations complete as ${row.current_user} on ${row.database}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
