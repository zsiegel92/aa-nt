import "server-only";

import {
  defaultsDefaultsGet,
  transformWorkbookEndpointTransformWorkbookPost,
  type InputTag,
  type TransformWorkbookRequest,
  type TransformWorkbookResponse,
} from "@/api/client";
import { createClient } from "@/api/client/client";

const apiUrl = process.env.AA_TO_NT_API_URL;
const apiKey = process.env.AA_TO_NT_API_KEY;

if (!apiUrl || !apiKey) {
  throw new Error("AA_TO_NT_API_URL and AA_TO_NT_API_KEY must be set");
}

const serverApiClient = createClient({
  baseUrl: apiUrl,
  headers: {
    Authorization: `Bearer ${apiKey}`,
  },
});

export async function fetchDefaults(): Promise<InputTag> {
  const { data } = await defaultsDefaultsGet({
    client: serverApiClient,
    throwOnError: true,
  });
  return data;
}

export async function proxyTransformWorkbook(
  request: TransformWorkbookRequest
): Promise<TransformWorkbookResponse> {
  const { data } = await transformWorkbookEndpointTransformWorkbookPost({
    client: serverApiClient,
    body: request,
    throwOnError: true,
  });
  return data;
}
