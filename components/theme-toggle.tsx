"use client";

import { useTheme } from "next-themes";
import { Check, Moon, Monitor, Sun } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      {/* The icon swaps on the `dark` class rather than on client state, so the
          server and client render the same markup and the masthead never shifts. */}
      <DropdownMenuTrigger
        className="text-muted-ink hover:bg-selection hover:text-burgundy-hover inline-flex size-11 items-center justify-center rounded-sm transition-colors duration-200 ease-out"
        aria-label="Change theme"
      >
        <Sun className="size-[18px] dark:hidden" aria-hidden />
        <Moon className="hidden size-[18px] dark:block" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {options.map(({ value, label, icon: OptionIcon }) => {
          const selected = theme === value;
          return (
            <DropdownMenuItem
              key={value}
              onSelect={() => setTheme(value)}
              className="justify-between"
            >
              <span className="flex items-center gap-2">
                <OptionIcon className="size-4" aria-hidden />
                {label}
              </span>
              {selected ? (
                <>
                  <Check className="text-burgundy size-4" aria-hidden />
                  <span className="sr-only">(current)</span>
                </>
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
