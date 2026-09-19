"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActiveRoute, navItems } from "@/lib/navigation";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      data-app-mobile-nav
      className="border-rule bg-canvas fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex items-stretch">
        {navItems.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-14 flex-col items-center justify-center gap-1 transition-colors duration-200 ease-out ${
                  active ? "text-burgundy" : "text-muted-ink"
                }`}
              >
                {active ? (
                  <span
                    aria-hidden
                    className="bg-burgundy absolute top-0 left-1/2 h-px w-8 -translate-x-1/2"
                  />
                ) : null}
                <Icon className="size-[18px]" aria-hidden />
                <span className="text-[11px] font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
