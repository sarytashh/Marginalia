import { afterEach, describe, expect, it } from "vitest";

import { getSupabasePublicEnv, getSupabaseServiceRoleKey } from "@/lib/supabase/env";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
});

describe("getSupabasePublicEnv", () => {
  it("returns the public URL and anon key when both are set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    expect(getSupabasePublicEnv()).toEqual({
      url: "https://example.supabase.co",
      anonKey: "anon-key",
    });
  });

  it("throws a named error when the URL is missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    expect(() => getSupabasePublicEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("throws a named error when the anon key is empty", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";

    expect(() => getSupabasePublicEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });
});

describe("getSupabaseServiceRoleKey", () => {
  it("returns the service-role key when it is set", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    expect(getSupabaseServiceRoleKey()).toBe("service-role-key");
  });

  it("throws a named error when the service-role key is missing", () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => getSupabaseServiceRoleKey()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });
});
