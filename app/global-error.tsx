"use client";

import { GeistSans } from "geist/font/sans";
import { useEffect } from "react";

import "@fontsource-variable/source-serif-4";
import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className={`${GeistSans.variable} h-full`}>
      <body className="bg-canvas text-ink min-h-full font-sans">
        <title>Marginalia</title>
        <div className="mx-auto flex min-h-full w-full max-w-[40rem] flex-col justify-center px-5 py-16">
          <p className="font-serif text-[22px] leading-none">Marginalia</p>
          <p className="label-editorial mt-10">Interrupted</p>
          <h1 className="font-serif mt-4 text-[34px] leading-[1.12] font-normal">
            This page could not be shown.
          </h1>
          <p className="text-muted-ink mt-5 max-w-[34rem] text-[16px] leading-[1.65]">
            Your materials and answers are still saved. Try again.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="bg-burgundy text-paper hover:bg-burgundy-hover mt-8 inline-flex min-h-11 w-fit items-center rounded-sm px-4 text-[14px] font-medium"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
