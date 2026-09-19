import "server-only";

import type { User } from "@supabase/supabase-js";

import { DocumentError } from "@/lib/documents/http";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const UNAUTHENTICATED_MESSAGE = "Sign in to continue.";

export type SessionUser = {
  email: string | null;
  id: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || user === null) {
      return null;
    }

    return toSessionUser(user);
  } catch {
    return null;
  }
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (user === null) {
    throw new DocumentError(UNAUTHENTICATED_MESSAGE, 401);
  }
  return user;
}

function toSessionUser(user: User): SessionUser {
  const email = user.email?.trim();
  return {
    id: user.id,
    email: email === undefined || email === "" ? null : email,
  };
}
