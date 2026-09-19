"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { UserMenu } from "@/components/auth/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatDueNavLabel } from "@/lib/library/heading";
import { isActiveRoute, navItems } from "@/lib/navigation";

type SiteHeaderProps = {
  dueCount: number;
  email: string;
};

export function SiteHeader({ dueCount, email }: SiteHeaderProps) {
  const pathname = usePathname();
  const dueLabel = formatDueNavLabel(dueCount);

  return (
    <header data-app-header className="border-rule bg-canvas/95 supports-[backdrop-filter]:bg-canvas/80 sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="max-w-app mx-auto flex h-16 w-full items-center gap-5 px-5 md:h-[4.5rem] md:gap-8 md:px-8 lg:px-12">
        <Link
          href="/"
          className="font-serif text-ink hover:text-burgundy text-[26px] leading-none transition-colors duration-200 ease-out md:text-[28px]"
        >
          Marginalia
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {navItems.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative inline-flex h-18 items-center text-[15px] font-medium transition-colors duration-200 ease-out ${
                      active
                        ? "text-burgundy"
                        : "text-muted-ink hover:text-ink"
                    }`}
                  >
                    {item.label}
                    {active ? (
                      <span
                        aria-hidden
                        className="bg-burgundy absolute bottom-0 left-1/2 h-px w-5 -translate-x-1/2"
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          {dueLabel ? (
            <Link
              href="/study"
              className="text-muted-ink hover:text-ink inline-flex min-h-11 items-center text-[13px] font-medium tabular-nums"
            >
              {dueLabel}
            </Link>
          ) : null}
          <ThemeToggle />
          <UserMenu email={email} />
        </div>
      </div>
    </header>
  );
}
