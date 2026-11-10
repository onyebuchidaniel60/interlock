import { NextResponse } from "next/server";

import { apiError, requireApiActor, sameOrigin } from "@/lib/api";
import { ServiceError, simulateDecision } from "@/lib/services/interlock";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return apiError("INVALID_ORIGIN", "Invalid request origin.", 403);
  const auth = await requireApiActor();
  if (auth.response) return auth.response;
  const { id } = await params;

  try {
    const result = await simulateDecision(auth.actor, id);
    return NextResponse.json({ data: result }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ServiceError) return apiError(error.code, error.message, error.status);
    return apiError("SIMULATION_FAILED", "The simulation could not be completed.", 502);
  }
}
