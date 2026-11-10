import { expect, test } from "@playwright/test";

const authState = process.env.E2E_AUTH_STATE;
const enabled = process.env.E2E_LIVE_DEMO === "1";

test.use(authState ? { storageState: authState } : {});
test.skip(!authState || !enabled, "Set E2E_AUTH_STATE and E2E_LIVE_DEMO=1 to run the live comparison.");

test("Memory OFF passes while Memory ON rejects the same plan with verified citations", async ({ page }) => {
  test.skip(test.info().project.name !== "chromium", "Live comparison coverage runs on desktop Chromium.");
  test.setTimeout(240_000);
  await page.goto("/demo", { waitUntil: "domcontentloaded", timeout: 45_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Memory OFF / ON comparison" })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Run comparison" }).click();

  await expect(page.getByRole("heading", { name: "Memory ON protected path" })).toBeVisible({ timeout: 180_000 });
  await expect(page.getByText("WOULD PASS")).toBeVisible();
  await expect(page.getByText("REJECT").first()).toBeVisible();
  await expect(page.getByText("Same plan hash")).toBeVisible();

  await page.getByRole("link", { name: "Open evidence panel" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Decision detail" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Cited evidence" })).toBeVisible();
  await expect(page.getByText("VERIFIED").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Simulate once/ })).toHaveCount(0);
});
