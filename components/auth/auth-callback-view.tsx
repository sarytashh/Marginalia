"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { safeNextPath } from "@/lib/auth/next-path";
import { otpTypesToTry } from "@/lib/auth/otp";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function AuthCallbackView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    const nextPath = safeNextPath(searchParams.get("next"));
    const supabase = createBrowserSupabaseClient();

    async function completeSignIn() {
      const fail = (code: "expired" | "invalid") => {
        setMessage("That sign-in link could not be used.");
        router.replace(`/sign-in?error=${code}`);
      };

      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          fail(/expired|otp_expired/i.test(error.message) ? "expired" : "invalid");
          return;
        }
        router.replace(nextPath);
        router.refresh();
        return;
      }

      const tokenHash = searchParams.get("token_hash");
      if (tokenHash) {
        for (const type of otpTypesToTry(searchParams.get("type"))) {
          const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash: tokenHash,
          });
          if (!error) {
            router.replace(nextPath);
            router.refresh();
            return;
          }
        }
        fail("invalid");
        return;
      }

      const hash = window.location.hash.replace(/^#/, "");
      if (hash.includes("access_token")) {
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (accessToken !== null && refreshToken !== null) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          window.history.replaceState(
            null,
            "",
            `${window.location.pathname}${window.location.search}`,
          );
          if (error) {
            fail("invalid");
            return;
          }
          router.replace(nextPath);
          router.refresh();
          return;
        }
      }

      fail("invalid");
    }

    void completeSignIn();
  }, [router, searchParams]);

  return (
    <div
      data-auth-frame
      className="mx-auto flex min-h-[70vh] w-full max-w-[26rem] flex-col justify-center px-5 py-16"
    >
      <p className="font-serif text-ink text-[22px] leading-none">Marginalia</p>
      <h1 className="font-serif text-ink mt-10 text-[34px] leading-[1.12] font-normal md:text-[46px]">
        {message}
      </h1>
      <p className="text-muted-ink mt-5 text-[16px] leading-[1.65]">
        This only takes a moment. Keep this tab open.
      </p>
    </div>
  );
}
