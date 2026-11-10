import { expect, test } from "@playwright/test";

const protectedRoutes = [
  "/dashboard",
  "/observations",
  "/memory",
  "/plans",
  "/plans/new",
  "/plans/plan-demo",
  "/decisions/decision-demo",
  "/audit",
  "/agents",
  "/settings",
  "/demo",
];

test.describe("public shell", () => {
  test("login renders and exposes the real documentation destination", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.locator('a[href="#"]')).toHaveCount(0);
    const documentation = page.getByRole("link", { name: /Documentation/ });
    if (await documentation.count()) {
      await expect(documentation).toHaveAttribute(
        "href",
        "https://github.com/onyebuchidaniel60/interlock#readme",
      );
    }
  });

  test("setup renders account creation when signed out", async ({ page }) => {
    const response = await page.goto("/setup");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "Create your account" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  });

  test("health endpoint returns a safe status payload", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ status: "ok", service: "interlock", mode: "simulation" });
    expect(JSON.stringify(body)).not.toMatch(/secret|token|database_url/i);
  });

  test("protected routes redirect to sign-in when signed out", async ({ page }) => {
    for (const path of protectedRoutes) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login(?:\?|$)/);
      await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible({ timeout: 15_000 });
    }
  });

  test("login page does not overflow horizontally on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth - root.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
