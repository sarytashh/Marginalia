"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

type UserMenuProps = {
  email: string;
};

export function UserMenu({ email }: UserMenuProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="text-muted-ink hover:text-ink inline-flex min-h-11 max-w-44 items-center truncate text-[13px] font-medium transition-colors duration-200 ease-out md:max-w-56"
        aria-label={`Account menu for ${email}`}
      >
        {email}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-rule min-w-56 rounded-sm">
        <DropdownMenuLabel className="text-muted-ink px-2 py-1.5 text-[11px] font-medium tracking-[0.08em] uppercase">
          Signed in as
        </DropdownMenuLabel>
        <p className="text-ink truncate px-2 pb-1.5 text-[13px]">{email}</p>
        <DropdownMenuSeparator className="bg-rule" />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="rounded-sm text-[14px]">
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="border-rule rounded-sm">
            {themeOptions.map(({ value, label, icon: OptionIcon }) => {
              const selected = theme === value;
              return (
                <DropdownMenuItem
                  key={value}
                  onSelect={() => setTheme(value)}
                  className="justify-between rounded-sm"
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
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator className="bg-rule" />
        <DropdownMenuItem
          variant="destructive"
          className="rounded-sm text-[14px]"
          onSelect={() => {
            void signOut();
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
