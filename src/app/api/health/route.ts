import { NextResponse } from "next/server";

import { readRuntimeConfig } from "@/lib/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  let config;
  try {
    config = readRuntimeConfig();
  } catch {
    return NextResponse.json(
      { status: "unsafe_config" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      status: "ok",
      service: "interlock",
      phase: "9",
      mode: config.INTERLOCK_EXECUTION_MODE,
      environment: config.INTERLOCK_ENVIRONMENT,
      baselineEnabled: config.INTERLOCK_DEMO_BASELINE_ENABLED,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
