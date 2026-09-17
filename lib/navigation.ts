import { ChartLine, Library, PenLine, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Library", icon: Library },
  { href: "/study", label: "Study", icon: PenLine },
  { href: "/progress", label: "Progress", icon: ChartLine },
];

export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
