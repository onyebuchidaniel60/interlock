import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/lib/auth/server";

const middleware = auth.middleware({
  loginUrl: "/login",
  publicRoutes: ["/", "/login", "/setup", "/demo", "/api/health"],
});

export default async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/demo" || request.nextUrl.pathname.startsWith("/demo/")) {
    const demoEnabled =
      process.env.INTERLOCK_ENVIRONMENT !== "production" &&
      process.env.INTERLOCK_DEMO_BASELINE_ENABLED === "true";
    if (!demoEnabled) {
      return new NextResponse("Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
      });
    }
  }

  return middleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)"],
};
