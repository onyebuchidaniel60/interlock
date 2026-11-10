import { expect, test } from "@playwright/test";

const authState = process.env.E2E_AUTH_STATE;

test.use(authState ? { storageState: authState } : {});

test.describe("authenticated workspace", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!authState, "Set E2E_AUTH_STATE to a Playwright storage-state file for authenticated tests.");

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Desktop auth coverage; mobile shell is covered separately.");
    await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 45_000 });
    await expect(page.getByText("Interlock · Phase 2 auth").first()).toBeVisible({ timeout: 20_000 });
  });

  test("dashboard renders the real workspace and role", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: "Operations console" })).toBeVisible();
    await expect(page.getByText("Role: OWNER").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" }).first()).toBeVisible();
  });

  test("settings shows members and owner-only invitation controls", async ({ page }) => {
    await page.goto("/settings", { waitUntil: "domcontentloaded", timeout: 45_000 });
    await expect(page.getByRole("heading", { level: 1, name: "Workspace settings" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create one-time invite link" })).toBeVisible();
    await expect(page.getByText("Enforced")).toBeVisible();
  });

  test("primary navigation works with a real session", async ({ page }) => {
    await page.getByRole("link", { name: "Open memory ledger" }).click();
    await expect(page).toHaveURL(/\/memory$/);
    await expect(page.getByRole("heading", { level: 1, name: "Memory ledger" })).toBeVisible();
  });

  test("readiness proves session, membership and app_user RLS", async ({ request }) => {
    const response = await request.get("/api/readiness");
    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "ok",
      auth: "session_verified",
      database: "app_user_rls",
      workspace: "verified_membership",
    });
  });
});
