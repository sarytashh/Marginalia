import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCallbackView } from "@/components/auth/auth-callback-view";

export const metadata: Metadata = {
  title: "Signing in",
};

export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackView />
    </Suspense>
  );
}

function AuthCallbackFallback() {
  return (
    <div
      data-auth-frame
      className="mx-auto flex min-h-[70vh] w-full max-w-[26rem] flex-col justify-center px-5 py-16"
    >
      <p className="font-serif text-ink text-[22px] leading-none">Marginalia</p>
      <h1 className="font-serif text-ink mt-10 text-[34px] leading-[1.12] font-normal md:text-[46px]">
        Signing you in…
      </h1>
    </div>
  );
}
