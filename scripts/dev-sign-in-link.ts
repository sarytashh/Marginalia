// Prints a one-time sign-in link for local development without sending an
// email, so testing is not blocked by Supabase's hourly email limit.
//
//   pnpm auth:link you@example.com
//
// Uses the service role key from .env.local, so it only runs on a machine
// that already holds that key. The link is for the local app only and
// works once.

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/database.types";
import {
  getSupabasePublicEnv,
  getSupabaseServiceRoleKey,
} from "../lib/supabase/env";

const LOCAL_ORIGIN = "http://localhost:4317";

async function main() {
  const email = process.argv[2]?.trim();
  if (email === undefined || email === "" || !email.includes("@")) {
    console.error("Usage: pnpm auth:link you@example.com");
    process.exitCode = 1;
    return;
  }

  const { url } = getSupabasePublicEnv();
  const admin = createClient<Database>(url, getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error !== null) {
    console.error(`Could not create a sign-in link: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const link = new URL("/auth/callback", LOCAL_ORIGIN);
  link.searchParams.set("token_hash", data.properties.hashed_token);
  link.searchParams.set("type", "magiclink");

  console.log("Open this link once, in the browser you want signed in:");
  console.log(link.toString());
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
