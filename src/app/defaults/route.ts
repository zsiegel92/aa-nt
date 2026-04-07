import { NextRequest, NextResponse } from "next/server";

import { fetchDefaults } from "@/lib/api/server-client";
import { getAuthenticatedUserFromRequest } from "@/lib/auth/request";

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const defaults = await fetchDefaults();
  return NextResponse.json(defaults);
}
