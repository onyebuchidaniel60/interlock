import fs from "node:fs";
import path from "node:path";

import { chromium } from "@playwright/test";

const baseURL = process.env.DEMO_BASE_URL ?? "http://127.0.0.1:3128";
const authState = process.env.E2E_AUTH_STATE ?? "/tmp/opencode/interlock-auth-state.json";
const timeline = JSON.parse(fs.readFileSync(path.join("demo", "timeline.json"), "utf8"));

const rejectPlan = "0e09d629-ab2d-493a-84eb-ce71f3c7052d";
const rejectDecision = "a172932a-3b60-45f2-8022-5de0ada190a2";
const approvedDecision = "061d75b7-3122-4154-bfc3-98c67c84f768";
const demoTarget = `/demo?planId=${rejectPlan}&decisionId=${rejectDecision}`;

const sceneUrls = {
  intro: "/dashboard",
  observations: "/observations",
  memory: "/memory",
  policy: "/settings",
  plan: "/plans/new",
  sentinel: `/plans/${rejectPlan}`,
  decision: `/decisions/${rejectDecision}`,
  demo: demoTarget,
  runner: `/decisions/${approvedDecision}`,
  close: "/dashboard",
};

const cursorScript = () => {
  const style = document.createElement("style");
  style.textContent = `
    #demo-cursor { position: fixed; z-index: 2147483647; width: 16px; height: 16px; margin: -8px 0 0 -8px; border-radius: 999px;
      border: 2px solid #e7eef2; background: rgba(52,211,153,.35); box-shadow: 0 0 0 6px rgba(52,211,153,.12);
      pointer-events: none; transition: transform 120ms ease-out; }
  `;
  document.documentElement.appendChild(style);
  const dot = document.createElement("div");
  dot.id = "demo-cursor";
  dot.style.transform = "translate(640px, 400px)";
  document.documentElement.appendChild(dot);
  document.addEventListener("mousemove", (event) => {
    dot.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
  });
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  storageState: authState,
  recordVideo: { dir: "demo/raw", size: { width: 1280, height: 800 } },
});
await context.addInitScript(cursorScript);
const page = await context.newPage();

await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;height:100%;background:#06080a;color:#e7eef2;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
  .wrap{height:100%;display:grid;place-items:center;background:radial-gradient(900px 420px at 50% 30%,rgba(52,211,153,.12),transparent 65%)}
  .inner{text-align:center}.mark{width:64px;height:64px;margin:0 auto 26px;border-radius:18px;border:1px solid rgba(52,211,153,.35);background:rgba(52,211,153,.08);display:grid;place-items:center;color:#34d399;font-size:30px}
  h1{font-size:56px;letter-spacing:.16em;margin:0;font-weight:600}p{margin:14px 0 0;color:#8c9aa4;font-size:15px;letter-spacing:.04em}.accent{color:#34d399}
</style></head><body><div class="wrap"><div class="inner"><div class="mark">⌁</div><h1>INTERLOCK</h1><p>Verified memory. <span class="accent">Enforced decisions.</span></p></div></div></body></html>`);
await page.waitForTimeout(timeline.titleDuration * 1000);

for (const scene of timeline.scenes) {
  const started = Date.now();
  const url = sceneUrls[scene.id];
  await page.goto(`${baseURL}${url}`, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => {});
  await page.mouse.move(680, 360, { steps: 18 });
  if (scene.id === "policy") {
    await page.getByText("Exposure policy").scrollIntoViewIfNeeded().catch(() => {});
    await page.mouse.move(520, 340, { steps: 18 });
  }
  if (scene.id === "decision") {
    await page.mouse.move(620, 470, { steps: 18 });
  }
  if (scene.id === "demo") {
    await page.mouse.move(880, 430, { steps: 18 });
  }
  if (scene.id === "runner") {
    await page.mouse.move(980, 360, { steps: 18 });
  }
  const elapsed = (Date.now() - started) / 1000;
  await page.waitForTimeout(Math.max(0, scene.duration - elapsed) * 1000);
}

const video = page.video();
await context.close();
const videoPath = await video?.path();
await browser.close();

if (!videoPath) throw new Error("Playwright did not produce a video.");
const target = path.join("demo", "raw", "interlock-walkthrough.webm");
fs.copyFileSync(videoPath, target);
console.log(target);
