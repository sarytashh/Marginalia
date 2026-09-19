import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { DocumentError } from "@/lib/documents/http";

const LOCAL_DEV_EMAIL = "local-dev@marginalia.invalid";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let cachedOwnerId: string | undefined;

export async function getDocumentOwnerId(): Promise<string> {
  const sessionUserId = await getSessionUserId();
  if (sessionUserId) {
    return sessionUserId;
  }

  if (cachedOwnerId) {
    return cachedOwnerId;
  }

  const fromEnv = process.env.DEV_USER_ID?.trim();
  if (fromEnv) {
    if (!UUID_PATTERN.test(fromEnv)) {
      throw new DocumentError(
        "DEV_USER_ID must be a UUID from Supabase Auth. Add it to .env.local or remove it to use the local-dev user.",
        500,
      );
    }
    cachedOwnerId = fromEnv;
    return fromEnv;
  }

  cachedOwnerId = await findOrCreateLocalDevUser();
  return cachedOwnerId;
}

async function getSessionUserId(): Promise<string | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

async function findOrCreateLocalDevUser(): Promise<string> {
  const admin = createServiceRoleClient();
  const existing = await findUserByEmail(admin, LOCAL_DEV_EMAIL);
  if (existing) {
    return existing;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: LOCAL_DEV_EMAIL,
    email_confirm: true,
  });

  if (error || data.user === null) {
    const alreadyExists = error?.message.toLowerCase().includes("already");
    if (alreadyExists) {
      const retry = await findUserByEmail(admin, LOCAL_DEV_EMAIL);
      if (retry) {
        return retry;
      }
    }

    console.error(error);
    throw new DocumentError(
      "Marginalia could not create a local owner for uploads. Set DEV_USER_ID in .env.local to a user from Supabase Auth.",
      500,
    );
  }

  console.info(`Created local-dev owner ${data.user.id} (${LOCAL_DEV_EMAIL}).`);
  return data.user.id;
}

async function findUserByEmail(
  admin: ReturnType<typeof createServiceRoleClient>,
  email: string,
): Promise<string | null> {
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    console.error(error);
    throw new DocumentError(
      "Marginalia could not look up a local owner for uploads. Set DEV_USER_ID in .env.local.",
      500,
    );
  }

  const match = data.users.find((user) => user.email === email);
  return match?.id ?? null;
}
