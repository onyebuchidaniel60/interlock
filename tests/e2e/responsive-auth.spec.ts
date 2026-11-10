import { expect, test } from "@playwright/test";

const authState = process.env.E2E_AUTH_STATE;
test.use(authState ? { storageState: authState } : {});

const paths = ["/dashboard", "/observations", "/memory", "/plans", "/settings", "/audit", "/demo"];

test.describe("responsive verified pages", () => {
  test.skip(!authState, "Set E2E_AUTH_STATE for authenticated responsive coverage.");

  for (const width of [390, 768, 1280]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width, height: 900 });
      for (const path of paths) {
        await page.goto(path, { waitUntil: "domcontentloaded", timeout: 45_000 });
        await page.waitForTimeout(400);
        const overflow = await page.evaluate(() => {
          const root = document.documentElement;
          return root.scrollWidth - root.clientWidth;
        });
        expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(1);
      }
    });
  }
});
