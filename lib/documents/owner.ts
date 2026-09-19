import "server-only";

import { requireSessionUser } from "@/lib/auth/session";

export async function getDocumentOwnerId(): Promise<string> {
  const user = await requireSessionUser();
  return user.id;
}
