import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

const globalForDb = globalThis as unknown as {
  interlockPool?: Pool;
};

function createPool() {
  const connectionString = process.env.DATABASE_URL_APP;
  if (!connectionString) {
    throw new Error("DATABASE_URL_APP is not configured.");
  }

  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: true },
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });
}

export function getPool() {
  if (!globalForDb.interlockPool) {
    globalForDb.interlockPool = createPool();
  }
  return globalForDb.interlockPool;
}

async function assertApplicationRole(client: PoolClient) {
  const result = await client.query<{ current_user: string; bypassrls: boolean }>(
    "select current_user, (select rolbypassrls from pg_roles where rolname = current_user) as bypassrls",
  );
  const row = result.rows[0];
  if (!row || row.current_user !== "app_user" || row.bypassrls) {
    throw new Error("Unsafe database role: application queries must run as app_user without BYPASSRLS.");
  }
}

/**
 * Runs a transaction as the application role with request-scoped RLS identity.
 * The setting is transaction-local, so a pooled connection cannot leak identity.
 */
export async function withUser<T>(userId: string, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  if (!userId) {
    throw new Error("A verified user id is required for database access.");
  }

  const client = await getPool().connect();
  try {
    await assertApplicationRole(client);
    await client.query("begin");
    await client.query("select set_config('app.user_id', $1, true)", [userId]);
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Runs a single application-role query without user context. Only safe,
 * explicit security-definer functions (for example invitation lookup by a
 * high-entropy token hash) may be called this way.
 */
export async function queryAsApp<T extends QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  const client = await getPool().connect();
  try {
    await assertApplicationRole(client);
    return await client.query<T>(sql, params);
  } finally {
    client.release();
  }
}
