"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { PlanInputSchema, ConstraintInputSchema } from "@/lib/domain/schemas";
import {
  ServiceError,
  createConstraint,
  createObservation,
  createPlan,
  evaluatePlanById,
  simulateDecision,
} from "@/lib/services/interlock";
import { requireWorkspace } from "@/lib/workspace";

function fail(path: string, error: unknown): never {
  const code = error instanceof ServiceError ? error.code : "UNEXPECTED";
  redirect(`${path}?error=${encodeURIComponent(code)}`);
}

export async function runObservationAction(formData: FormData) {
  const { user, workspace } = await requireWorkspace();
  const address = String(formData.get("address") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const parsed = z.string().regex(/^0x[a-fA-F0-9]{64}$/).safeParse(address);
  if (!parsed.success) redirect("/observations?error=INVALID_ADDRESS");

  try {
    await createObservation(
      { userId: user.id, workspaceId: workspace.id, role: workspace.role },
      parsed.data,
      label || undefined,
    );
  } catch (error) {
    fail("/observations", error);
  }

  revalidatePath("/dashboard");
  revalidatePath("/observations");
  revalidatePath("/memory");
  redirect("/observations?ok=1");
}

export async function createPolicyAction(formData: FormData) {
  const { user, workspace } = await requireWorkspace();
  const parsed = ConstraintInputSchema.extend({
    address: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  }).safeParse({
    address: String(formData.get("address") ?? ""),
    maxExposureBps: Number(formData.get("maxExposureBps") ?? 0),
    description: String(formData.get("description") ?? ""),
  });

  if (!parsed.success) redirect("/settings?error=POLICY_INVALID");
  if (workspace.role !== "OWNER") redirect("/settings?error=FORBIDDEN");

  try {
    await createConstraint(
      { userId: user.id, workspaceId: workspace.id, role: workspace.role },
      parsed.data,
    );
  } catch (error) {
    fail("/settings", error);
  }

  revalidatePath("/settings");
  revalidatePath("/memory");
  revalidatePath("/dashboard");
  redirect("/settings?policy=created");
}

export async function createPlanAction(formData: FormData) {
  const { user, workspace } = await requireWorkspace();
  const parsed = PlanInputSchema.safeParse({
    observationId: String(formData.get("observationId") ?? ""),
    amountMist: String(formData.get("amountMist") ?? ""),
    exposureBps: Number(formData.get("exposureBps") ?? 0),
    rationale: String(formData.get("rationale") ?? "") || undefined,
  });
  if (!parsed.success) redirect("/plans/new?error=PLAN_INVALID");

  let planId: string;
  try {
    const result = await createPlan(
      { userId: user.id, workspaceId: workspace.id, role: workspace.role },
      parsed.data,
    );
    planId = result.planId;
  } catch (error) {
    fail("/plans/new", error);
  }

  revalidatePath("/plans");
  revalidatePath("/dashboard");
  redirect(`/plans/${planId}`);
}

export async function evaluatePlanAction(formData: FormData) {
  const { user, workspace } = await requireWorkspace();
  const planId = String(formData.get("planId") ?? "");
  if (!planId) redirect("/plans?error=PLAN_INVALID");

  let decisionId: string;
  try {
    const result = await evaluatePlanById(
      { userId: user.id, workspaceId: workspace.id, role: workspace.role },
      planId,
    );
    decisionId = result.decisionId;
  } catch (error) {
    fail(`/plans/${planId}`, error);
  }

  revalidatePath("/dashboard");
  revalidatePath("/plans");
  revalidatePath("/memory");
  revalidatePath("/audit");
  redirect(`/decisions/${decisionId}`);
}

export async function simulateDecisionAction(formData: FormData) {
  const { user, workspace } = await requireWorkspace();
  const decisionId = String(formData.get("decisionId") ?? "");
  if (!decisionId) redirect("/plans?error=DECISION_INVALID");

  try {
    await simulateDecision(
      { userId: user.id, workspaceId: workspace.id, role: workspace.role },
      decisionId,
    );
  } catch (error) {
    fail(`/decisions/${decisionId}`, error);
  }

  revalidatePath("/audit");
  revalidatePath("/dashboard");
  redirect(`/decisions/${decisionId}?simulated=1`);
}
