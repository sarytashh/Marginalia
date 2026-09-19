import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth/next-path";
import { parseOtpType } from "@/lib/auth/otp";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function completeEmailLink(request: NextRequest): Promise<NextResponse> {
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
  if (tokenHash) {
    const type = parseOtpType(searchParams.get("type")) ?? "email";
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

function otpErrorCode(message: string): "expired" | "invalid" {
  if (/expired|otp_expired/i.test(message)) {
    return "expired";
  }
  return "invalid";
}
