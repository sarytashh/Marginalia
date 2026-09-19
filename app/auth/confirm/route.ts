import type { NextRequest } from "next/server";

import { completeEmailLink } from "@/lib/auth/complete-link";

export async function GET(request: NextRequest) {
  return completeEmailLink(request);
}
