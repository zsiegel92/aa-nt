import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

import { zInputTag, type InputTag } from "@/lib/api/short-types";

export function serializeInputTagToJson(inputTag: InputTag): string {
  return JSON.stringify(inputTag, null, 2);
}

export function parseInputTagJson(json: string): InputTag {
  const parsed = JSON.parse(json) as unknown;
  return zInputTag.parse(parsed);
}

export function encodeInputTagToUrlValue(inputTag: InputTag): string {
  return compressToEncodedURIComponent(JSON.stringify(inputTag));
}

export function decodeInputTagFromUrlValue(inputTagValue: string): InputTag {
  const decompressed = decompressFromEncodedURIComponent(inputTagValue);
  if (!decompressed) {
    throw new Error("Could not decode the shared input tag");
  }
  return parseInputTagJson(decompressed);
}

export function buildShareUrl(baseUrl: string, inputTag: InputTag): string {
  const url = new URL(baseUrl);
  url.searchParams.set("inputTag", encodeInputTagToUrlValue(inputTag));
  return url.toString();
}
