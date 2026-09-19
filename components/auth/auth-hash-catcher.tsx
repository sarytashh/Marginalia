"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function AuthHashCatcher() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash.includes("access_token")) {
      return;
    }

    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (accessToken === null || refreshToken === null) {
      return;
    }

    const nextPath = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", nextPath);

    void (async () => {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        router.replace("/sign-in?error=invalid");
        return;
      }
      router.replace(nextPath === "/sign-in" ? "/" : nextPath);
      router.refresh();
    })();
  }, [router]);

  return null;
}
