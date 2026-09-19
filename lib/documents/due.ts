import "server-only";

import { getDocumentOwnerId } from "@/lib/documents/owner";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function countDueQuestions(): Promise<number> {
  const ownerId = await getDocumentOwnerId();
  const supabase = createServiceRoleClient();
  const { count, error } = await supabase
    .from("review_state")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ownerId)
    .lte("due_at", new Date().toISOString());

  if (error) {
    console.error(error);
    return 0;
  }

  return count ?? 0;
}
