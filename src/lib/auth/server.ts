import { createNeonAuth } from "@neon/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

if (!baseUrl || !cookieSecret) {
  throw new Error("Neon Managed Better Auth configuration is missing.");
}

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
    sessionDataTtl: 60,
  },
  logLevel: "warn",
});

export async function getSessionUser() {
  const { data } = await auth.getSession();
  return data?.user ?? null;
}
