import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AaToNtWorkbench } from "@/components/aa-to-nt/workbench";
import { defaultInputTag } from "@/lib/aa-to-nt/defaults";

function renderWorkbench() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AaToNtWorkbench
        initialInputTag={defaultInputTag}
        initialShareError={null}
        loadedFromShareUrl={false}
      />
    </QueryClientProvider>,
  );
}

describe("AaToNtWorkbench", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps focus while editing a codon map name", () => {
    renderWorkbench();

    const codonMapNameInput = screen.getByDisplayValue(
      "Expression Optimization",
    );
    codonMapNameInput.focus();

    fireEvent.change(codonMapNameInput, {
      target: { value: "Expression Optimization v2" },
    });

    expect(
      screen.getByDisplayValue("Expression Optimization v2"),
    ).toHaveFocus();
  });

  it("keeps focus while editing a region column name", () => {
    renderWorkbench();

    fireEvent.click(screen.getByRole("button", { name: "Regions" }));

    const regionNameInput = screen.getByDisplayValue("AA452_7merSubs");
    regionNameInput.focus();

    fireEvent.change(regionNameInput, {
      target: { value: "AA452_Custom" },
    });

    expect(screen.getByDisplayValue("AA452_Custom")).toHaveFocus();
  });

  it("keeps focus while editing a design ID", () => {
    renderWorkbench();

    fireEvent.click(screen.getByRole("button", { name: "Designs" }));

    const designIdInput = screen.getByDisplayValue("ID1");
    designIdInput.focus();

    fireEvent.change(designIdInput, {
      target: { value: "ID1-custom" },
    });

    expect(screen.getByDisplayValue("ID1-custom")).toHaveFocus();
  });
});
