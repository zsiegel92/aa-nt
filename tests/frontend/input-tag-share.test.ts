import { describe, expect, it } from "vitest";

import type { InputTag } from "@/api/client";
import {
  buildShareUrl,
  decodeInputTagFromUrlValue,
  encodeInputTagToUrlValue,
  parseInputTagJson,
  serializeInputTagToJson,
} from "@/lib/input-tag/share";

const inputTag: InputTag = {
  codon_maps: [
    {
      name: "Expression Optimization",
      A: "GCC",
      C: "TGC",
      D: "GAC",
      E: "GAA",
      F: "TTC",
      G: "GGC",
      H: "CAC",
      I: "ATC",
      K: "AAA",
      L: "CTC",
      M: "ATG",
      N: "AAC",
      P: "CCC",
      Q: "CAA",
      R: "AGA",
      S: "AGC",
      T: "ACC",
      V: "GTC",
      W: "TGG",
      Y: "TAC",
    },
  ],
  regions: [
    {
      name: "RegionA",
      length: 2,
      substitution: true,
      wild_type: "GCCCAA",
      predecessor: null,
      start_tail: "",
      end_tail: "",
      reverse_complement: false,
      constant_nt: false,
      has_custom_upstream_tail_annotation_length: false,
      has_custom_downstream_tail_annotation_length: false,
      custom_upstream_tail_annotation_length: 0,
      custom_downstream_tail_annotation_length: 0,
    },
  ],
  designs: [
    {
      id: "ID1",
      version: 0,
      region_designs: {
        RegionA: "Expression Optimization",
      },
    },
  ],
  design_column_name: "",
};

describe("input tag sharing", () => {
  it("round-trips through JSON and the compressed URL value", () => {
    const json = serializeInputTagToJson(inputTag);
    expect(parseInputTagJson(json)).toEqual(inputTag);

    const encoded = encodeInputTagToUrlValue(inputTag);
    expect(decodeInputTagFromUrlValue(encoded)).toEqual(inputTag);
  });

  it("builds a share URL rooted at the AA-to-NT page", () => {
    const url = buildShareUrl("https://example.com/aa-to-nt", inputTag);

    expect(url).toContain("https://example.com/aa-to-nt?inputTag=");
  });

  it("throws on malformed compressed data", () => {
    expect(() => decodeInputTagFromUrlValue("%%%")).toThrow(
      "Could not decode the shared input tag"
    );
  });
});
