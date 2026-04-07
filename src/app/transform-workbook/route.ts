import { NextRequest, NextResponse } from "next/server";

import { zTransformWorkbookRequest } from "@/lib/api/short-types";
import { proxyTransformWorkbook } from "@/lib/api/server-client";
import { getAuthenticatedUserFromRequest } from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const parsedBody = await zTransformWorkbookRequest.parseAsync(body);
  const response = await proxyTransformWorkbook(parsedBody);
  return NextResponse.json(response);
}
