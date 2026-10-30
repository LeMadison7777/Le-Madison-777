import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";

const authUrl = import.meta.env.VITE_NEON_AUTH_URL || "https://ep-delicate-field-bawa02pg.neonauth.c-8.eu-central-1.aws.neon.tech/neondb/auth";

export const authClient = createAuthClient(authUrl, { adapter: BetterAuthReactAdapter() });
export const auth = authClient;

let accessToken: string | null = null;

export function setAccessToken(value: unknown) {
  // The Neon Better Auth adapter puts its signed JWT on session.token.
  // Never send Better Auth's opaque session id as a bearer token.
  accessToken = typeof value === "string" && value.split(".").length === 3 ? value : null;
}

export async function getAccessToken() {
  // Reuse the token from useSession instead of issuing another auth fetch for
  // every API call. The extra SDK request was failing with a Promise method.
  return accessToken;
}

export async function resetPasswordWithEmailOTP(input: { email: string; otp: string; password: string }) {
  const response = await fetch(`${authUrl}/email-otp/reset-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const result = await response.json().catch(() => null) as { message?: string; success?: boolean } | null;
  if (!response.ok || result?.success === false) {
    throw new Error(result?.message || "Le code de réinitialisation est invalide ou expiré.");
  }
}
