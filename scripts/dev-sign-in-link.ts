// Prints a one-time sign-in link for local development without sending an
// email, so testing is not blocked by Supabase's hourly email limit.
//
//   pnpm auth:link you@example.com
//   pnpm auth:link you@example.com https://your-site.onrender.com
//
// Uses the service role key from .env.local, so it only runs on a machine
// that already holds that key. The link opens the local app unless a site
// origin is given, and works once.

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

  let origin = LOCAL_ORIGIN;
  const site = process.argv[3]?.trim();
  if (site !== undefined && site !== "") {
    try {
      origin = new URL(site).origin;
    } catch {
      console.error(`Not a site address: ${site}`);
      process.exitCode = 1;
      return;
    }
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

  const link = new URL("/auth/callback", origin);
  link.searchParams.set("token_hash", data.properties.hashed_token);
  link.searchParams.set("type", "magiclink");

  console.log("Open this link once, in the browser you want signed in:");
  console.log(link.toString());
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
