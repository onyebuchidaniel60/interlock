import type { NextRequest } from "next/server";

import { auth } from "@/lib/auth/server";

const handler = auth.handler();

const configuredOrigins = [
  process.env.APP_BASE_URL,
  process.env.NEXT_PUBLIC_APP_BASE_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : undefined,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3127",
  "http://127.0.0.1:3127",
]
  .filter((value): value is string => Boolean(value))
  .map((value) => {
    try {
      return new URL(value).origin;
    } catch {
      return null;
    }
  })
  .filter((value): value is string => Boolean(value));

const allowedOrigins = new Set(configuredOrigins);

function isMutation(method: string) {
  return method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
}

function isTrustedRequest(request: NextRequest) {
  if (!isMutation(request.method)) return true;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return allowedOrigins.has(origin);
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, context: RouteContext) {
  if (!isTrustedRequest(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const headers = new Headers(request.headers);
  // Neon Auth validates the upstream Origin. The proxy validates the browser
  // Origin against the exact app allowlist first, then presents the auth
  // server's own origin to the managed service.
  headers.set("origin", new URL(process.env.NEON_AUTH_BASE_URL!).origin);
  headers.delete("host");

  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
  const rewritten = new Request(request.url, {
    method: request.method,
    headers,
    body,
    redirect: "manual",
  });

  switch (request.method) {
    case "GET":
      return handler.GET(rewritten, context);
    case "POST":
      return handler.POST(rewritten, context);
    case "PUT":
      return handler.PUT(rewritten, context);
    case "DELETE":
      return handler.DELETE(rewritten, context);
    case "PATCH":
      return handler.PATCH(rewritten, context);
    default:
      return Response.json({ error: "Method not allowed." }, { status: 405 });
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;
