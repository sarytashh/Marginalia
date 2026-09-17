import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import {
  getSupabasePublicEnv,
  getSupabaseServiceRoleKey,
} from "@/lib/supabase/env";

export function createServiceRoleClient() {
  const { url } = getSupabasePublicEnv();

  return createClient<Database>(url, getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
