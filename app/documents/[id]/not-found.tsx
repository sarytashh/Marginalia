import Link from "next/link";

import { PageShell } from "@/components/page-shell";

export default function DocumentNotFound() {
  return (
    <PageShell>
      <p className="label-editorial">Material</p>
      <h1 className="font-serif text-ink mt-4 text-[34px] leading-[1.12] font-normal md:text-[52px]">
        This material is not in your library.
      </h1>
      <p className="text-muted-ink mt-5 max-w-[34rem] text-[16px] leading-[1.65]">
        It may have been deleted, or the link may be from a different library.
      </p>
      <Link
        href="/"
        className="bg-burgundy text-paper hover:bg-burgundy-hover mt-8 inline-flex min-h-11 items-center rounded-sm px-4 text-[14px] font-medium transition-colors duration-200 ease-out"
      >
        Return to Library
      </Link>
    </PageShell>
  );
}
