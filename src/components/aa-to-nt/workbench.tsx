"use client";

import "@/lib/api/browser-client";

import { useMutation } from "@tanstack/react-query";
import { Download, LoaderCircle, Sparkles } from "lucide-react";
import { type Dispatch, useMemo, useReducer, useState } from "react";

import { transformWorkbookEndpointTransformWorkbookPostMutation } from "@/api/client/@tanstack/react-query.gen";
import type { InputTag, RegionSpec } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  aminoAcidMetadata,
  codonFrequencyColors,
  translateWildTypeNucleotides,
  type AminoAcidCode,
} from "@/lib/aa-to-nt/codon-metadata";
import { downloadBase64File, fileToBase64 } from "@/lib/aa-to-nt/file";
import {
  countAncestors,
  countSuccessors,
  getEligiblePredecessors,
  getRegionChains,
  hasSuccessor,
  sortRegionsByPredecessor,
} from "@/lib/aa-to-nt/region-chains";
import { inputTagReducer } from "@/lib/aa-to-nt/state";
import { validateInputTagState } from "@/lib/aa-to-nt/validation";
import type { TransformWorkbookRequest } from "@/lib/api/short-types";
import { buildShareUrl } from "@/lib/input-tag/share";
import { cn } from "@/lib/utils";

import { TagTools } from "./tag-tools";

type InputTagAction = Parameters<typeof inputTagReducer>[1];

type AaToNtWorkbenchProps = {
  initialInputTag: InputTag;
  initialShareError: string | null;
  loadedFromShareUrl: boolean;
};

const chainAccentClasses = [
  "border-l-4 border-l-emerald-500",
  "border-l-4 border-l-sky-500",
  "border-l-4 border-l-amber-500",
  "border-l-4 border-l-rose-500",
  "border-l-4 border-l-violet-500",
] as const;

export function AaToNtWorkbench({
  initialInputTag,
  initialShareError,
  loadedFromShareUrl,
}: AaToNtWorkbenchProps) {
  const [inputTag, dispatch] = useReducer(
    (
      state: InputTag,
      action: InputTagAction | { type: "bootstrap"; value: InputTag },
    ) => {
      if (action.type === "bootstrap") {
        return action.value;
      }
      return inputTagReducer(state, action);
    },
    initialInputTag,
  );
  const [activeTab, setActiveTab] = useState<"codon" | "regions" | "designs">(
    "codon",
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transformMutation = useMutation(
    transformWorkbookEndpointTransformWorkbookPostMutation(),
  );

  const submitWorkbook = async () => {
    if (!selectedFile) {
      setError("Choose a CSV or XLSX input file first.");
      return;
    }
    try {
      const validatedInputTag = validateInputTagState(inputTag);
      const body: TransformWorkbookRequest = {
        input_file_name: selectedFile.name,
        input_file_media_type:
          selectedFile.type ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        input_file_base64: await fileToBase64(selectedFile),
        input_tag: validatedInputTag,
        input_share_url: buildShareUrl(
          `${window.location.origin}/aa-to-nt`,
          validatedInputTag,
        ),
      };
      const response = await transformMutation.mutateAsync({ body });
      downloadBase64File(
        response.output_file_base64,
        response.output_file_name,
        response.output_file_media_type,
      );
      setMessage("Workbook generated successfully.");
      setError(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The workbook request failed.",
      );
    }
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-5 lg:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-7 shadow-[var(--panel-shadow)]">
          <div className="flex items-center gap-3 text-[var(--accent)]">
            <Sparkles className="size-5" />
            <span className="text-sm font-semibold uppercase tracking-[0.2em]">
              Codon Design Studio
            </span>
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Build typed AA→NT design workbooks without the old UI baggage.
          </h1>
          <p className="mt-4 max-w-3xl text-base text-[var(--muted-foreground)]">
            Edit codon maps, region chains, and design variants in the tabs
            below. Upload an amino-acid workbook, then generate an output XLSX
            that preserves the legacy sheet contract while running through a
            typed Next→FastAPI→Modal pipeline.
          </p>
        </div>

        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--panel-shadow)]">
          <h2 className="text-xl font-semibold">Workbook Run</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Upload a `.csv`, `.txt`, or `.xlsx` file whose columns match your
            defined regions.
          </p>
          <div className="mt-5 space-y-4">
            <Input
              type="file"
              accept=".csv,.txt,.xlsx"
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] ?? null);
              }}
            />
            <Button
              className="w-full"
              onClick={() => void submitWorkbook()}
              disabled={transformMutation.isPending}
            >
              {transformMutation.isPending ? (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              Generate Workbook
            </Button>
            {message ? (
              <p className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--foreground)]">
                {message}
              </p>
            ) : null}
            {loadedFromShareUrl ? (
              <p className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--foreground)]">
                Loaded configuration from the share URL.
              </p>
            ) : null}
            {error ? (
              <p className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-strong)]">
                {error}
              </p>
            ) : null}
            {!error && initialShareError ? (
              <p className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-strong)]">
                {initialShareError}
              </p>
            ) : null}
          </div>
        </section>
      </section>

      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--panel-shadow)]">
        <div className="flex flex-wrap gap-3">
          <TabButton
            label="Codon Maps"
            active={activeTab === "codon"}
            onClick={() => setActiveTab("codon")}
          />
          <TabButton
            label="Regions"
            active={activeTab === "regions"}
            onClick={() => setActiveTab("regions")}
          />
          <TabButton
            label="Designs"
            active={activeTab === "designs"}
            onClick={() => setActiveTab("designs")}
          />
        </div>

        {activeTab === "codon" ? (
          <CodonMapsPanel inputTag={inputTag} dispatch={dispatch} />
        ) : null}
        {activeTab === "regions" ? (
          <RegionsPanel inputTag={inputTag} dispatch={dispatch} />
        ) : null}
        {activeTab === "designs" ? (
          <DesignsPanel inputTag={inputTag} dispatch={dispatch} />
        ) : null}
      </section>

      <TagTools
        inputTag={inputTag}
        onApplyInputTag={(nextInputTag) =>
          dispatch({ type: "bootstrap", value: nextInputTag })
        }
      />
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
          : "bg-[var(--panel-muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function CodonMapsPanel({
  inputTag,
  dispatch,
}: {
  inputTag: InputTag;
  dispatch: Dispatch<InputTagAction | { type: "bootstrap"; value: InputTag }>;
}) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-4">
        <thead>
          <tr className="text-left text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            <th className="min-w-60 px-3 pb-4">AA</th>
            {inputTag.codon_maps.map((codonMap, index) => (
              <th className="min-w-96 px-3 pb-4 align-top" key={codonMap.name}>
                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-muted)] p-4">
                  <Input
                    value={codonMap.name}
                    onChange={(event) =>
                      dispatch({
                        type: "updateCodonMap",
                        index,
                        field: "name",
                        value: event.target.value,
                      })
                    }
                  />
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        dispatch({ type: "duplicateCodonMap", index })
                      }
                    >
                      Duplicate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        dispatch({ type: "deleteCodonMap", index })
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {aminoAcidMetadata.map((aminoAcid) => (
            <tr key={aminoAcid.code}>
              <th className="px-3 py-2 align-top">
                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-muted)] p-4 text-left">
                  <p className="text-lg font-semibold">{aminoAcid.code}</p>
                  <p className="mt-1 text-sm text-[var(--foreground)]">
                    {aminoAcid.name}
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    {aminoAcid.abbreviation}
                  </p>
                </div>
              </th>
              {inputTag.codon_maps.map((codonMap, index) => (
                <td
                  className="px-3 py-2 align-top"
                  key={`${codonMap.name}-${aminoAcid.code}`}
                >
                  <div className="flex flex-wrap gap-2 rounded-[1.5rem] border border-[var(--border)] bg-white p-4">
                    {aminoAcid.codons.map((codonOption, codonOptionIndex) => {
                      const isSelected =
                        codonMap[aminoAcid.code] === codonOption;
                      return (
                        <button
                          className={cn(
                            "min-w-18 cursor-pointer rounded-full border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed",
                            isSelected
                              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--foreground)] shadow-sm"
                              : "border-[var(--border)] bg-[var(--panel-muted)] text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--foreground)]",
                          )}
                          key={`${codonMap.name}-${aminoAcid.code}-${codonOption}`}
                          onClick={() =>
                            dispatch({
                              type: "updateCodonMap",
                              index,
                              field: aminoAcid.code,
                              value: codonOption,
                            })
                          }
                          type="button"
                        >
                          <span
                            className="inline-block border-b-2 px-1"
                            style={{
                              borderBottomColor:
                                codonFrequencyColors[codonOptionIndex] ??
                                codonFrequencyColors[
                                  codonFrequencyColors.length - 1
                                ],
                            }}
                          >
                            {codonOption}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-right text-sm text-[var(--muted-foreground)]">
        Codons stay ordered from more to less frequent for each amino acid.
      </p>
    </div>
  );
}

function RegionsPanel({
  inputTag,
  dispatch,
}: {
  inputTag: InputTag;
  dispatch: Dispatch<InputTagAction | { type: "bootstrap"; value: InputTag }>;
}) {
  const regionIndexByName = useMemo(
    () =>
      new Map(inputTag.regions.map((region, index) => [region.name, index])),
    [inputTag.regions],
  );
  const regionChains = useMemo(
    () => getRegionChains(inputTag.regions),
    [inputTag.regions],
  );

  return (
    <div className="mt-6 space-y-5">
      {regionChains.map((chain, chainIndex) => {
        const accentClass =
          chainAccentClasses[chainIndex % chainAccentClasses.length] ??
          chainAccentClasses[0];

        return (
          <section
            className={cn(
              "rounded-[1.8rem] border border-[var(--border)] bg-[var(--panel-muted)] p-5",
              accentClass,
            )}
            key={`${chain.head.name}-${chainIndex}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  Chain {chainIndex + 1}
                </p>
                <h3 className="mt-1 text-lg font-semibold">
                  {chain.regions.map((region) => region.name).join(" → ")}
                </h3>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                {chain.regions.length} region
                {chain.regions.length === 1 ? "" : "s"} linked by
                predecessor/successor rules
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {chain.regions.map((region) => {
                const regionIndex = regionIndexByName.get(region.name);
                if (regionIndex === undefined) {
                  return null;
                }
                return (
                  <RegionEditorCard
                    accentClass={accentClass}
                    dispatch={dispatch}
                    key={region.name}
                    region={region}
                    regionIndex={regionIndex}
                    regions={inputTag.regions}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function RegionEditorCard({
  accentClass,
  dispatch,
  region,
  regionIndex,
  regions,
}: {
  accentClass: string;
  dispatch: Dispatch<InputTagAction | { type: "bootstrap"; value: InputTag }>;
  region: RegionSpec;
  regionIndex: number;
  regions: readonly RegionSpec[];
}) {
  const eligiblePredecessors = getEligiblePredecessors(regions, region.name);
  const successorPresent = hasSuccessor(regions, region.name);
  const ancestorCount = countAncestors(regions, region.name);
  const successorCount = countSuccessors(regions, region.name);
  const upstreamTailRegionCount = successorCount + 1;
  const downstreamTailRegionCount = ancestorCount + 1;
  const encodingMode = region.constant_nt
    ? "constant"
    : region.substitution
      ? "substitution"
      : "no-wt";

  return (
    <article className="rounded-[1.6rem] border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <LabeledInput
                label="Region / Column Name"
                value={region.name}
                onChange={(value) =>
                  dispatch({
                    type: "updateRegion",
                    index: regionIndex,
                    field: "name",
                    value,
                  })
                }
              />
            </div>
            <div className="flex gap-3 pt-7">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  dispatch({ type: "duplicateRegion", index: regionIndex })
                }
              >
                Duplicate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  dispatch({ type: "deleteRegion", index: regionIndex })
                }
              >
                Delete
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <LabeledInput
              className={
                region.length <= 0 ? "border-[var(--danger)]" : undefined
              }
              disabled={Boolean(region.constant_nt)}
              label="AA Length"
              type="number"
              value={`${region.length}`}
              onChange={(value) =>
                dispatch({
                  type: "updateRegion",
                  index: regionIndex,
                  field: "length",
                  value: Number(value),
                })
              }
            />
            <label className="space-y-2 text-sm font-medium">
              <span className="text-[var(--muted-foreground)]">
                Predecessor
              </span>
              <select
                className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                value={region.predecessor ?? ""}
                onChange={(event) =>
                  dispatch({
                    type: "setRegionPredecessor",
                    index: regionIndex,
                    predecessor: event.target.value || null,
                  })
                }
              >
                <option value="">
                  {eligiblePredecessors.length > 0 ? "None" : "---"}
                </option>
                {eligiblePredecessors.map((candidate) => (
                  <option key={candidate.name} value={candidate.name}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--panel-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Chain Placement
              </p>
              <p className="mt-2 text-lg font-semibold">
                {describeChainPlacement(region.predecessor, successorPresent)}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {region.predecessor
                  ? `Follows ${region.predecessor}`
                  : "Starts a new chain"}
              </p>
            </div>
          </div>

          <fieldset className="rounded-[1.3rem] border border-[var(--border)] bg-[var(--panel-muted)] p-4">
            <legend className="px-2 text-sm font-semibold text-[var(--foreground)]">
              Wild-Type Behavior
            </legend>
            <div className="mt-2 flex flex-wrap gap-3">
              <RegionModeChip
                checked={encodingMode === "substitution"}
                label="Substitution"
                onChange={() => {
                  dispatch({
                    type: "updateRegion",
                    index: regionIndex,
                    field: "substitution",
                    value: true,
                  });
                  dispatch({
                    type: "updateRegion",
                    index: regionIndex,
                    field: "constant_nt",
                    value: false,
                  });
                }}
              />
              <RegionModeChip
                checked={encodingMode === "no-wt"}
                label="No WT"
                onChange={() => {
                  dispatch({
                    type: "updateRegion",
                    index: regionIndex,
                    field: "substitution",
                    value: false,
                  });
                  dispatch({
                    type: "updateRegion",
                    index: regionIndex,
                    field: "constant_nt",
                    value: false,
                  });
                  dispatch({
                    type: "updateRegion",
                    index: regionIndex,
                    field: "wild_type",
                    value: "",
                  });
                }}
              />
              <RegionModeChip
                checked={encodingMode === "constant"}
                label="Constant nt"
                onChange={() => {
                  dispatch({
                    type: "updateRegion",
                    index: regionIndex,
                    field: "substitution",
                    value: false,
                  });
                  dispatch({
                    type: "updateRegion",
                    index: regionIndex,
                    field: "constant_nt",
                    value: true,
                  });
                }}
              />
            </div>
            {encodingMode !== "no-wt" ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(10rem,0.55fr)] lg:items-center">
                <LabeledInput
                  className={
                    (region.wild_type ?? "").length !== region.length * 3
                      ? "border-[var(--danger)]"
                      : undefined
                  }
                  label="Wild-Type Nucleotides"
                  value={region.wild_type ?? ""}
                  onChange={(value) =>
                    dispatch({
                      type: "updateRegion",
                      index: regionIndex,
                      field: "wild_type",
                      value,
                    })
                  }
                />
                <span className="pt-7 text-center text-2xl text-[var(--muted-foreground)]">
                  ←
                </span>
                <div className="pt-7">
                  <div className="rounded-[1.2rem] border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm tracking-[0.22em] text-[var(--foreground)]">
                    {translateWildTypeNucleotides(
                      region.wild_type ?? "",
                      region.length,
                    ) || "?"}
                  </div>
                </div>
              </div>
            ) : null}
          </fieldset>

          <div className="grid gap-4 lg:grid-cols-2">
            {region.predecessor ? (
              <InheritedTailNotice
                label="Nucleotide Upstream Tail"
                message="Inherited from the chain head. Only the first region in a chain owns the upstream tail."
              />
            ) : (
              <TailEditor
                annotationEnabled={Boolean(
                  region.has_custom_upstream_tail_annotation_length,
                )}
                annotationLength={
                  region.custom_upstream_tail_annotation_length ?? 0
                }
                annotationLengthLabel="Upstream Annotation Length"
                dispatch={dispatch}
                field="start_tail"
                hasCustomField="has_custom_upstream_tail_annotation_length"
                inputLabel={`Nucleotide Upstream Tail (${upstreamTailRegionCount} region${upstreamTailRegionCount === 1 ? "" : "s"})`}
                lengthField="custom_upstream_tail_annotation_length"
                region={region}
                regionIndex={regionIndex}
              />
            )}

            {successorPresent ? (
              <InheritedTailNotice
                label="Nucleotide Downstream Tail"
                message="Inherited by the chain tail. Only the last region in a chain owns the downstream tail."
              />
            ) : (
              <TailEditor
                annotationEnabled={Boolean(
                  region.has_custom_downstream_tail_annotation_length,
                )}
                annotationLength={
                  region.custom_downstream_tail_annotation_length ?? 0
                }
                annotationLengthLabel="Downstream Annotation Length"
                dispatch={dispatch}
                field="end_tail"
                hasCustomField="has_custom_downstream_tail_annotation_length"
                inputLabel={`Nucleotide Downstream Tail (${downstreamTailRegionCount} region${downstreamTailRegionCount === 1 ? "" : "s"})`}
                lengthField="custom_downstream_tail_annotation_length"
                region={region}
                regionIndex={regionIndex}
              />
            )}
          </div>
        </div>

        <aside
          className={cn(
            "rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-muted)] p-5",
            accentClass,
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            Chain Wiring
          </p>
          <div className="mt-4 flex items-start gap-4">
            <div className="flex min-h-16 w-12 items-center justify-center text-4xl text-[var(--accent)]">
              {renderChainGlyph(region.predecessor, successorPresent)}
            </div>
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-[var(--foreground)]">
                {describeChainPlacement(region.predecessor, successorPresent)}
              </p>
              <p className="text-[var(--muted-foreground)]">
                {region.predecessor
                  ? `This region is linked after ${region.predecessor}.`
                  : "This region is a chain head and controls upstream-tail and reverse-complement settings."}
              </p>
              <p className="text-[var(--muted-foreground)]">
                {successorPresent
                  ? "Another region follows this one, so downstream-tail editing is inherited further down the chain."
                  : "No successor is attached, so this region owns the downstream tail."}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.2rem] border border-[var(--border)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Reverse Complement
            </p>
            {region.predecessor ? (
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Inherited from the chain head. Rewire the chain head to change
                this.
              </p>
            ) : (
              <Toggle
                checked={Boolean(region.reverse_complement)}
                label="Apply to this full chain"
                onChange={(checked) =>
                  dispatch({
                    type: "updateRegion",
                    index: regionIndex,
                    field: "reverse_complement",
                    value: checked,
                  })
                }
              />
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}

function TailEditor({
  annotationEnabled,
  annotationLength,
  annotationLengthLabel,
  dispatch,
  field,
  hasCustomField,
  inputLabel,
  lengthField,
  region,
  regionIndex,
}: {
  annotationEnabled: boolean;
  annotationLength: number;
  annotationLengthLabel: string;
  dispatch: Dispatch<InputTagAction | { type: "bootstrap"; value: InputTag }>;
  field: "start_tail" | "end_tail";
  hasCustomField:
    | "has_custom_upstream_tail_annotation_length"
    | "has_custom_downstream_tail_annotation_length";
  inputLabel: string;
  lengthField:
    | "custom_upstream_tail_annotation_length"
    | "custom_downstream_tail_annotation_length";
  region: RegionSpec;
  regionIndex: number;
}) {
  const currentTail = region[field] ?? "";
  const lengthError =
    annotationEnabled && annotationLength > currentTail.length;

  return (
    <div className="rounded-[1.3rem] border border-[var(--border)] bg-[var(--panel-muted)] p-4">
      <LabeledInput
        label={inputLabel}
        value={currentTail}
        onChange={(value) =>
          dispatch({
            type: "updateRegion",
            index: regionIndex,
            field,
            value,
          })
        }
      />
      <div className="mt-4 space-y-3">
        <Toggle
          checked={annotationEnabled}
          label="Custom annotation length"
          onChange={(checked) =>
            dispatch({
              type: "updateRegion",
              index: regionIndex,
              field: hasCustomField,
              value: checked,
            })
          }
        />
        {annotationEnabled ? (
          <LabeledInput
            className={lengthError ? "border-[var(--danger)]" : undefined}
            label={annotationLengthLabel}
            type="number"
            value={`${annotationLength}`}
            onChange={(value) =>
              dispatch({
                type: "updateRegion",
                index: regionIndex,
                field: lengthField,
                value: Number(value),
              })
            }
          />
        ) : null}
        {lengthError ? (
          <p className="text-sm text-[var(--danger-strong)]">
            Annotation length cannot exceed the tail length.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function InheritedTailNotice({
  label,
  message,
}: {
  label: string;
  message: string;
}) {
  return (
    <div className="rounded-[1.3rem] border border-[var(--border)] bg-[var(--panel-muted)] p-4">
      <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">{message}</p>
    </div>
  );
}

function DesignsPanel({
  inputTag,
  dispatch,
}: {
  inputTag: InputTag;
  dispatch: Dispatch<InputTagAction | { type: "bootstrap"; value: InputTag }>;
}) {
  const orderedRegions = useMemo(
    () => sortRegionsByPredecessor(inputTag.regions),
    [inputTag.regions],
  );

  return (
    <div className="mt-6 space-y-5">
      <LabeledInput
        label="Selective Design Column Name"
        value={inputTag.design_column_name ?? ""}
        onChange={(value) => dispatch({ type: "setDesignColumnName", value })}
      />
      {inputTag.designs.map((design, designIndex) => (
        <div
          key={`${design.id}-${design.version}-${designIndex}`}
          className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--panel-muted)] p-5"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="w-full max-w-sm">
              <LabeledInput
                label={`Design ID · v${design.version}`}
                value={design.id}
                onChange={(value) =>
                  dispatch({
                    type: "updateDesign",
                    index: designIndex,
                    field: "id",
                    value,
                  })
                }
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  dispatch({ type: "duplicateDesign", index: designIndex })
                }
              >
                Duplicate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  dispatch({ type: "deleteDesign", index: designIndex })
                }
              >
                Delete
              </Button>
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {orderedRegions.map((region) => (
              <label
                key={`${design.id}-${region.name}`}
                className="space-y-2 text-sm font-medium"
              >
                <span className="text-[var(--muted-foreground)]">
                  {region.name}
                </span>
                <select
                  className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white px-4 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  value={design.region_designs[region.name] ?? ""}
                  onChange={(event) =>
                    dispatch({
                      type: "updateDesignRegionMap",
                      designIndex,
                      regionName: region.name,
                      codonMapName: event.target.value,
                    })
                  }
                  disabled={region.constant_nt}
                >
                  {region.constant_nt ? (
                    <option value="">constant_nt - not mapped</option>
                  ) : null}
                  {inputTag.codon_maps.map((codonMap) => (
                    <option key={codonMap.name} value={codonMap.name}>
                      {codonMap.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LabeledInput({
  className,
  disabled,
  label,
  value,
  onChange,
  type = "text",
}: {
  className?: string;
  disabled?: boolean;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="space-y-2 text-sm font-medium">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <Input
        className={className}
        disabled={disabled}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium">
      <input
        className="cursor-pointer"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function RegionModeChip({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      className={cn(
        "cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition",
        checked
          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--foreground)]"
          : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--foreground)]",
      )}
      onClick={onChange}
      type="button"
    >
      {label}
    </button>
  );
}

function renderChainGlyph(
  predecessor: string | null | undefined,
  successorPresent: boolean,
) {
  if (!predecessor && successorPresent) {
    return "↳";
  }
  if (predecessor && successorPresent) {
    return "⋮";
  }
  if (predecessor) {
    return "↘";
  }
  return "→";
}

function describeChainPlacement(
  predecessor: string | null | undefined,
  successorPresent: boolean,
) {
  if (!predecessor && successorPresent) {
    return "Chain head";
  }
  if (predecessor && successorPresent) {
    return "Middle region";
  }
  if (predecessor) {
    return "Chain tail";
  }
  return "Standalone region";
}
