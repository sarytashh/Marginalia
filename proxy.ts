import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isApiPath, isPublicAuthPath } from "@/lib/auth/paths";
import { safeNextPath, signInHref } from "@/lib/auth/next-path";
import type { Database } from "@/lib/database.types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, anonKey } = getSupabasePublicEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) {
          supabaseResponse.headers.set(key, value);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, searchParams } = request.nextUrl;
  const isPublic = isPublicAuthPath(pathname);
  const authLink =
    searchParams.has("code") || searchParams.has("token_hash");

  if (
    authLink &&
    pathname !== "/auth/callback" &&
    pathname !== "/auth/confirm"
  ) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    const redirectResponse = NextResponse.redirect(callbackUrl);
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (user === null && !isPublic) {
    if (isApiPath(pathname)) {
      const unauthorized = NextResponse.json(
        { error: "Sign in to continue." },
        { status: 401 },
      );
      copyCookies(supabaseResponse, unauthorized);
      return unauthorized;
    }

    const nextPath = `${pathname}${request.nextUrl.search}`;
    const redirectResponse = NextResponse.redirect(
      new URL(signInHref(nextPath), request.url),
    );
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (user !== null && pathname === "/sign-in") {
    const destination = safeNextPath(request.nextUrl.searchParams.get("next"));
    const redirectResponse = NextResponse.redirect(new URL(destination, request.url));
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  return supabaseResponse;
}

function copyCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.headers.getSetCookie()) {
    to.headers.append("Set-Cookie", cookie);
  }
  for (const header of ["cache-control", "expires", "pragma"] as const) {
    const value = from.headers.get(header);
    if (value) {
      to.headers.set(header, value);
    }
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
