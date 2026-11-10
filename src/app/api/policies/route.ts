import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, requireApiActor, sameOrigin } from "@/lib/api";
import { ConstraintInputSchema } from "@/lib/domain/schemas";
import { ServiceError, createConstraint } from "@/lib/services/interlock";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = ConstraintInputSchema.extend({
  address: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError("INVALID_ORIGIN", "Invalid request origin.", 403);
  const auth = await requireApiActor();
  if (auth.response) return auth.response;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("INVALID_BODY", "Invalid policy input.", 422);

  try {
    const result = await createConstraint(auth.actor, parsed.data);
    return NextResponse.json({ data: result }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ServiceError) return apiError(error.code, error.message, error.status);
    return apiError("POLICY_FAILED", "The policy could not be recorded.", 502);
  }
}
