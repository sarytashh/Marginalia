import "server-only";

import { DocumentError } from "@/lib/documents/http";
import { getDocumentOwnerId } from "@/lib/documents/owner";
import { parseProgressDashboard } from "@/lib/progress/schema";
import type { ProgressDashboard } from "@/lib/progress/types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const TIME_ZONE_PATTERN = /^[A-Za-z0-9_+\-]+(?:\/[A-Za-z0-9_+\-]+)*$/;

export async function loadProgressDashboard(): Promise<ProgressDashboard> {
  const ownerId = await getDocumentOwnerId();
  const timeZone = resolveTimeZone();
  const now = new Date().toISOString();

  try {
    return await fetchDashboard(ownerId, now, timeZone);
  } catch (error) {
    if (timeZone !== "UTC") {
      try {
        return await fetchDashboard(ownerId, now, "UTC");
      } catch (retryError) {
        throw toProgressError(retryError);
      }
    }
    throw toProgressError(error);
  }
}

async function fetchDashboard(
  userId: string,
  now: string,
  timeZone: string,
): Promise<ProgressDashboard> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("progress_dashboard", {
    p_user_id: userId,
    p_now: now,
    p_time_zone: timeZone,
  });

  if (error) {
    console.error(error);
    const missingFunction =
      error.code === "PGRST202" ||
      error.code === "42883" ||
      /progress_dashboard/i.test(error.message);
    throw new DocumentError(
      missingFunction
        ? "Marginalia needs a database update before Progress can load. Run supabase/migrations/20260920120000_progress_dashboard.sql in the Supabase SQL Editor, then refresh."
        : "Marginalia could not load your progress. Try again.",
      500,
    );
  }

  try {
    return parseProgressDashboard(data);
  } catch (caught) {
    console.error(caught);
    throw new DocumentError(
      "Marginalia could not load your progress. Try again.",
      500,
    );
  }
}

function resolveTimeZone(): string {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone && TIME_ZONE_PATTERN.test(timeZone)) {
      return timeZone;
    }
  } catch {
    return "UTC";
  }
  return "UTC";
}

function toProgressError(error: unknown): DocumentError {
  if (error instanceof DocumentError) {
    return error;
  }
  console.error(error);
  return new DocumentError(
    "Marginalia could not load your progress. Try again.",
    500,
  );
}
