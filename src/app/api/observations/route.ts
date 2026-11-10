import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, requireApiActor, sameOrigin } from "@/lib/api";
import { ServiceError, createObservation } from "@/lib/services/interlock";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z
  .object({
    address: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
    label: z.string().trim().max(80).optional(),
  })
  .strict();

export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError("INVALID_ORIGIN", "Invalid request origin.", 403);
  const auth = await requireApiActor();
  if (auth.response) return auth.response;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("INVALID_BODY", "A valid public Sui address is required.", 422);

  try {
    const result = await createObservation(auth.actor, parsed.data.address, parsed.data.label);
    return NextResponse.json({ data: result }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ServiceError) return apiError(error.code, error.message, error.status);
    return apiError("OBSERVATION_FAILED", "The observation could not be completed.", 502);
  }
}
