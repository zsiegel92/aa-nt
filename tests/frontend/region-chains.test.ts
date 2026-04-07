import { describe, expect, it } from "vitest";

import type { RegionSpec } from "@/api/client";
import {
  getEligiblePredecessors,
  getRegionChains,
  sortRegionsByPredecessor,
  validateRegionChains,
} from "@/lib/aa-to-nt/region-chains";

const region = (
  name: string,
  predecessor: string | null = null,
): RegionSpec => ({
  name,
  length: 1,
  substitution: true,
  wild_type: "GCC",
  predecessor,
  start_tail: "",
  end_tail: "",
  reverse_complement: false,
  constant_nt: false,
  has_custom_upstream_tail_annotation_length: false,
  has_custom_downstream_tail_annotation_length: false,
  custom_upstream_tail_annotation_length: 0,
  custom_downstream_tail_annotation_length: 0,
});

describe("region chains", () => {
  it("sorts regions into predecessor order and keeps separate chains grouped", () => {
    const regions = [
      region("Tail", "Middle"),
      region("Head"),
      region("Solo"),
      region("Middle", "Head"),
    ];

    expect(
      sortRegionsByPredecessor(regions).map((entry) => entry.name),
    ).toEqual(["Head", "Middle", "Tail", "Solo"]);

    expect(
      getRegionChains(regions).map((chain) =>
        chain.regions.map((entry) => entry.name),
      ),
    ).toEqual([["Head", "Middle", "Tail"], ["Solo"]]);
  });

  it("only offers tail nodes as eligible predecessors", () => {
    const regions = [
      region("Head"),
      region("Middle", "Head"),
      region("Tail", "Middle"),
      region("Solo"),
    ];

    expect(
      getEligiblePredecessors(regions, "Solo").map((entry) => entry.name),
    ).toEqual(["Tail"]);
    expect(
      getEligiblePredecessors(regions, "Head").map((entry) => entry.name),
    ).toEqual(["Solo"]);
  });

  it("rejects forks and cycles", () => {
    expect(() =>
      validateRegionChains([
        region("Head"),
        region("BranchA", "Head"),
        region("BranchB", "Head"),
      ]),
    ).toThrow(/more than one successor/i);

    expect(() =>
      validateRegionChains([
        region("A", "C"),
        region("B", "A"),
        region("C", "B"),
      ]),
    ).toThrow(/cycle/i);
  });
});
