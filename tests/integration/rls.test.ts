import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

loadEnv({ path: ".env.local", quiet: true });

const connectionString = process.env.DATABASE_URL_APP;

describe.skipIf(!connectionString)("Neon RLS integration", () => {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: true },
  });

  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it("connects as app_user without BYPASSRLS", async () => {
    const result = await client.query<{ current_user: string; bypassrls: boolean }>(
      "select current_user, (select rolbypassrls from pg_roles where rolname = current_user) as bypassrls",
    );
    expect(result.rows[0]).toEqual({ current_user: "app_user", bypassrls: false });
  });

  it("bootstraps workspaces and confines reads and writes to the active tenant", async () => {
    const userA = randomUUID();
    const userB = randomUUID();
    const suffix = randomUUID().slice(0, 8);

    await client.query("begin");
    try {
      await client.query("select set_config('app.user_id', $1, true)", [userA]);
      const createdA = await client.query<{ id: string }>(
        "select public.app_create_workspace($1, $2, $3) as id",
        ["RLS Test A", `rls-a-${suffix}`, userA],
      );
      const workspaceA = createdA.rows[0]?.id;
      expect(workspaceA).toBeTruthy();

      const ownMembers = await client.query<{ count: number }>(
        "select count(*)::int as count from public.workspace_members",
      );
      const ownAgents = await client.query<{ count: number }>(
        "select count(*)::int as count from public.agent_identities",
      );
      expect(ownMembers.rows[0]?.count).toBe(1);
      expect(ownAgents.rows[0]?.count).toBe(4);

      const role = await client.query<{ role: string }>(
        "select public.app_workspace_role($1) as role",
        [workspaceA],
      );
      expect(role.rows[0]?.role).toBe("OWNER");

      await client.query("savepoint direct_insert");
      await expect(
        client.query("insert into public.workspaces (name, slug, created_by) values ($1, $2, $3)", [
          "Bypass",
          `bypass-${suffix}`,
          userA,
        ]),
      ).rejects.toMatchObject({ code: "42501" });
      await client.query("rollback to savepoint direct_insert");

      await client.query("select set_config('app.user_id', $1, true)", [userB]);
      const createdB = await client.query<{ id: string }>(
        "select public.app_create_workspace($1, $2, $3) as id",
        ["RLS Test B", `rls-b-${suffix}`, userB],
      );
      const workspaceB = createdB.rows[0]?.id;
      expect(workspaceB).toBeTruthy();

      const visibleA = await client.query<{ count: number }>(
        "select count(*)::int as count from public.workspaces where id = $1",
        [workspaceA],
      );
      const visibleB = await client.query<{ count: number }>(
        "select count(*)::int as count from public.workspaces where id = $1",
        [workspaceB],
      );
      expect(visibleA.rows[0]?.count).toBe(0);
      expect(visibleB.rows[0]?.count).toBe(1);

      await client.query("savepoint cross_tenant_insert");
      await expect(
        client.query(
          `insert into public.wallet_sources (workspace_id, address, created_by)
           values ($1, $2, $3)`,
          [workspaceA, "0x" + "1".repeat(64), userB],
        ),
      ).rejects.toMatchObject({ code: "42501" });
      await client.query("rollback to savepoint cross_tenant_insert");
    } finally {
      await client.query("rollback");
    }
  });

  it("denies workspace reads when no request identity is set", async () => {
    await client.query("begin");
    try {
      const result = await client.query<{ count: number }>("select count(*)::int as count from public.workspaces");
      expect(result.rows[0]?.count).toBe(0);
    } finally {
      await client.query("rollback");
    }
  });
});
