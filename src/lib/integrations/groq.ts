import OpenAI from "openai";

import { AnalystOutputSchema, type AnalystOutput } from "@/lib/domain/schemas";

const FALLBACK: AnalystOutput = {
  summary: "Deterministic fallback: the plan is validated against verified policy and observation evidence outside the model.",
  riskNotes: ["No model-generated explanation was used for this decision."],
};

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string", description: "A concise explanation of the plan and its evidence boundary." },
    riskNotes: {
      type: "array",
      maxItems: 5,
      items: { type: "string" },
      description: "Short risk or verification notes. These are explanatory text only.",
    },
  },
  required: ["summary", "riskNotes"],
} as const;

export async function draftAnalystExplanation(input: {
  planHash: string;
  amountMist: string;
  exposureBps: number;
  rationale?: string;
}): Promise<AnalystOutput> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return FALLBACK;

  const model = process.env.GROQ_MODEL ?? "qwen/qwen3.8-27b";
  const baseURL = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
  const client = new OpenAI({ apiKey, baseURL, timeout: 10_000, maxRetries: 0 });

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: Number(process.env.GROQ_MAX_OUTPUT_TOKENS ?? 500),
      messages: [
        {
          role: "system",
          content:
            "You are Analyst for Interlock. You only draft explanatory text. You have no policy authority, no tools, and must not propose changing any numeric plan field or verdict. Return JSON only.",
        },
        {
          role: "user",
          content: JSON.stringify({
            planHash: input.planHash,
            amountMist: input.amountMist,
            exposureBps: input.exposureBps,
            rationale: input.rationale ?? null,
          }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "interlock_analyst_output",
          strict: true,
          schema: responseSchema,
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return FALLBACK;
    const parsed = AnalystOutputSchema.safeParse(JSON.parse(content));
    return parsed.success ? parsed.data : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
