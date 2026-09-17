export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

function readRequiredEnv(name: "NEXT_PUBLIC_SUPABASE_URL"): string;
function readRequiredEnv(name: "NEXT_PUBLIC_SUPABASE_ANON_KEY"): string;
function readRequiredEnv(name: "SUPABASE_SERVICE_ROLE_KEY"): string;
function readRequiredEnv(
  name:
    | "NEXT_PUBLIC_SUPABASE_URL"
    | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    | "SUPABASE_SERVICE_ROLE_KEY",
): string {
  // Next.js only inlines NEXT_PUBLIC_* values when the name is a static member access.
  const value =
    name === "NEXT_PUBLIC_SUPABASE_URL"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : name === "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        : process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (value === undefined || value === "") {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill in your Supabase project values.`,
    );
  }

  return value;
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  return {
    url: readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: readRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getSupabaseServiceRoleKey(): string {
  return readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
}
