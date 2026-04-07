import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { InputTag } from "@/api/client";
import { TagTools } from "@/components/aa-to-nt/tag-tools";

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

describe("TagTools", () => {
  it("only generates JSON when the user clicks the button", () => {
    const onApplyInputTag = vi.fn();

    render(<TagTools inputTag={inputTag} onApplyInputTag={onApplyInputTag} />);

    expect(screen.getAllByPlaceholderText("Nothing generated yet.")).toHaveLength(
      2
    );

    fireEvent.click(screen.getByRole("button", { name: /generate json/i }));

    expect(screen.getByDisplayValue(/"codon_maps"/)).toBeInTheDocument();
    expect(onApplyInputTag).not.toHaveBeenCalled();
  });

  it("opens the paste modal on demand", () => {
    const onApplyInputTag = vi.fn();

    render(<TagTools inputTag={inputTag} onApplyInputTag={onApplyInputTag} />);

    const [pasteJsonButton] = screen.getAllByRole("button", {
      name: /paste json/i,
    });
    if (!pasteJsonButton) {
      throw new Error("Paste JSON button was not rendered.");
    }
    fireEvent.click(pasteJsonButton);

    expect(screen.getByPlaceholderText('{"codon_maps":[...]}')).toBeInTheDocument();
    expect(onApplyInputTag).not.toHaveBeenCalled();
  });
});
