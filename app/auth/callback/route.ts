import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth/next-path";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const EMAIL_OTP_TYPES = new Set([
  "email",
  "magiclink",
  "signup",
  "invite",
  "recovery",
  "email_change",
]);

type EmailOtpType = "email" | "magiclink" | "signup" | "invite" | "recovery" | "email_change";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = request.nextUrl.origin;
  const next = safeNextPath(searchParams.get("next"));
  const destination = new URL(next, origin);
  const supabase = await createServerSupabaseClient();

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(destination);
    }
    console.error(error);
    return redirectWithError(origin, otpErrorCode(error.message));
  }

  const tokenHash = searchParams.get("token_hash");
  const type = parseOtpType(searchParams.get("type"));
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(destination);
    }
    console.error(error);
    return redirectWithError(origin, otpErrorCode(error.message));
  }

  const providerError = searchParams.get("error_code") ?? searchParams.get("error");
  if (providerError) {
    return redirectWithError(origin, otpErrorCode(providerError));
  }

  return redirectWithError(origin, "invalid");
}

function redirectWithError(origin: string, code: "expired" | "invalid"): NextResponse {
  const url = new URL("/sign-in", origin);
  url.searchParams.set("error", code);
  return NextResponse.redirect(url);
}

function parseOtpType(value: string | null): EmailOtpType | null {
  if (value === null || !EMAIL_OTP_TYPES.has(value)) {
    return null;
  }
  return value as EmailOtpType;
}

function otpErrorCode(message: string): "expired" | "invalid" {
  if (/expired|otp_expired/i.test(message)) {
    return "expired";
  }
  return "invalid";
}
