import { NextResponse } from "next/server";

import { apiError, requireApiActor, sameOrigin } from "@/lib/api";
import { PlanInputSchema } from "@/lib/domain/schemas";
import { ServiceError, createPlan } from "@/lib/services/interlock";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError("INVALID_ORIGIN", "Invalid request origin.", 403);
  const auth = await requireApiActor();
  if (auth.response) return auth.response;
  const parsed = PlanInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("INVALID_BODY", "Invalid plan input.", 422);

  try {
    const result = await createPlan(auth.actor, parsed.data);
    return NextResponse.json({ data: result }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ServiceError) return apiError(error.code, error.message, error.status);
    return apiError("PLAN_FAILED", "The plan could not be created.", 502);
  }
}
