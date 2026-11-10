import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const memberEmail = process.env.E2E_MEMBER_EMAIL;
const memberPassword = process.env.E2E_MEMBER_PASSWORD;

test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD for session tests.");

test.describe("session persistence and redirects", () => {
  test.describe.configure({ mode: "serial" });

  test("fresh login survives reload and logout/login works again", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: "Operations console" })).toBeVisible({
      timeout: 20_000,
    });

    if (await page.getByRole("button", { name: "Open navigation" }).isVisible()) {
      await page.getByRole("button", { name: "Open navigation" }).click();
    }
    await page.getByRole("button", { name: "Sign out" }).first().click();
    await expect(page).toHaveURL(/\/login$/, { timeout: 20_000 });

    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  });

  test("expired session redirects to login and login restores access", async ({ page }) => {
    await page.goto("/plans");
    await page.waitForTimeout(500);
    await page.context().clearCookies();
    await page.goto("/plans");
    await expect(page).toHaveURL(/\/login(?:\?|$)/, { timeout: 20_000 });
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/(dashboard|plans)$/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1, name: /Operations console|Action plans/ })).toBeVisible();
  });
});

test.describe("invited member access", () => {
  test.skip(!memberEmail || !memberPassword, "Set E2E_MEMBER_EMAIL and E2E_MEMBER_PASSWORD to test an invited account.");

  test("invited member signs in and reaches the workspace as OPERATOR", async ({ page }) => {
    test.skip(test.info().project.name !== "chromium", "Desktop invited-member coverage.");
    await page.goto("/login");
    await page.getByLabel("Email").fill(memberEmail!);
    await page.getByLabel("Password").fill(memberPassword!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
    if (await page.getByRole("button", { name: "Open navigation" }).isVisible()) {
      await page.getByRole("button", { name: "Open navigation" }).click();
    }
    await expect(page.getByText("Role: OPERATOR")).toBeVisible();
  });
});
