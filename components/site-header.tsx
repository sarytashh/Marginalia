"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActiveRoute, navItems } from "@/lib/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-rule bg-canvas/95 supports-[backdrop-filter]:bg-canvas/80 sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="max-w-app mx-auto flex h-16 w-full items-center gap-8 px-5 md:h-18 md:px-8 lg:px-12">
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

        <div className="ml-auto flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
