import { expect, test } from "@playwright/test";

const routes = [
  { path: "/dashboard", heading: "Operations console" },
  { path: "/observations", heading: "Chain observations" },
  { path: "/memory", heading: "Memory ledger" },
  { path: "/plans", heading: "Action plans" },
  { path: "/plans/new", heading: "Create a plan" },
  { path: "/plans/plan-demo", heading: "Plan detail" },
  { path: "/decisions/decision-demo", heading: "Decision detail" },
  { path: "/audit", heading: "Audit trail" },
  { path: "/agents", heading: "Agent modules" },
  { path: "/settings", heading: "Workspace settings" },
  { path: "/demo", heading: "Memory OFF / ON comparison" },
];

test.describe("route shell", () => {
  for (const route of routes) {
    test(`${route.path} renders its heading`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
      await expect(page.locator('a[href="#"]')).toHaveCount(0);
    });
  }

  test("login and setup render accessible auth shells", async ({ page }) => {
    for (const [path, heading] of [
      ["/login", "Sign in"],
      ["/setup", "Accept an invite"],
    ] as const) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expect(
        page.getByRole("link", { name: /preview shell|Continue to preview shell/ }),
      ).toBeVisible();
    }
  });

  test("health endpoint returns a safe status payload", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ status: "ok", service: "interlock", mode: "simulation" });
    expect(JSON.stringify(body)).not.toMatch(/secret|token|database_url/i);
  });

  test("primary navigation moves between sections", async ({ page }) => {
    await page.goto("/dashboard");
    if (await page.getByRole("button", { name: "Open navigation" }).isVisible()) {
      await page.getByRole("button", { name: "Open navigation" }).click();
    }
    const navigation = page.locator('nav[aria-label="Primary navigation"]:visible').first();
    await navigation.getByRole("link", { name: "Memory ledger" }).click();
    await expect(page).toHaveURL(/\/memory$/);
    await expect(page.getByRole("heading", { level: 1, name: "Memory ledger" })).toBeVisible();
    if (await page.getByRole("button", { name: "Open navigation" }).isVisible()) {
      await page.getByRole("button", { name: "Open navigation" }).click();
    }
    const activeNavigation = page.locator('nav[aria-label="Primary navigation"]:visible').first();
    await expect(activeNavigation.getByRole("link", { name: "Memory ledger" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("footer exposes only real approved destinations", async ({ page }) => {
    await page.goto("/dashboard");
    const documentation = page.getByRole("link", { name: /Documentation/ });
    const github = page.getByRole("link", { name: "GitHub" });
    await expect(documentation).toHaveAttribute(
      "href",
      "https://github.com/onyebuchidaniel60/interlock#readme",
    );
    await expect(github).toHaveAttribute("href", "https://github.com/onyebuchidaniel60/interlock");
  });
});

test.describe("mobile shell", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens, navigates and closes the mobile drawer", async ({ page }) => {
    await page.goto("/dashboard");
    test.skip(
      !(await page.getByRole("button", { name: "Open navigation" }).isVisible()),
      "mobile-only",
    );
    await page.getByRole("button", { name: "Open navigation" }).click();
    const drawer = page.locator("#mobile-navigation");
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: "Plans" }).click();
    await expect(page).toHaveURL(/\/plans$/);
    await expect(drawer).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: "Action plans" })).toBeVisible();
  });

  test("does not overflow horizontally on primary routes", async ({ page }) => {
    for (const route of routes) {
      await page.goto(route.path);
      const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        return root.scrollWidth - root.clientWidth;
      });
      expect(overflow, `${route.path} horizontal overflow`).toBeLessThanOrEqual(1);
    }
  });
});
