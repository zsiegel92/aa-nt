"use client";

import "@/lib/api/browser-client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, LoaderCircle, Sparkles } from "lucide-react";
import {
  type Dispatch,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import {
  defaultsDefaultsGetOptions,
  transformWorkbookEndpointTransformWorkbookPostMutation,
} from "@/api/client/@tanstack/react-query.gen";
import type { CodonMapSpec, InputTag, RegionSpec } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadBase64File, fileToBase64 } from "@/lib/aa-to-nt/file";
import { inputTagReducer } from "@/lib/aa-to-nt/state";
import { validateInputTagState } from "@/lib/aa-to-nt/validation";
import type { TransformWorkbookRequest } from "@/lib/api/short-types";
import {
  buildShareUrl,
  decodeInputTagFromUrlValue,
} from "@/lib/input-tag/share";

import { TagTools } from "./tag-tools";

type InputTagAction = Parameters<typeof inputTagReducer>[1];

export function AaToNtWorkbench() {
  const searchParams = useSearchParams();
  const defaultsQuery = useQuery(defaultsDefaultsGetOptions());
  const [inputTag, dispatch] = useReducer(
    (
      state: InputTag | null,
      action: InputTagAction | { type: "bootstrap"; value: InputTag },
    ) => {
      if (action.type === "bootstrap") {
        return action.value;
      }
      if (!state) {
        return state;
      }
      return inputTagReducer(state, action);
    },
    null,
  );
  const [activeTab, setActiveTab] = useState<"codon" | "regions" | "designs">(
    "codon",
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const didBootstrapRef = useRef(false);
  const inputTagValue = searchParams.get("inputTag");

  const bootstrapResult = useMemo(() => {
    if (!defaultsQuery.data) {
      return null;
    }
    if (!inputTagValue) {
      return {
        value: defaultsQuery.data,
        loadedFromShareUrl: false,
        error: null,
      };
    }
    try {
      return {
        value: validateInputTagState(decodeInputTagFromUrlValue(inputTagValue)),
        loadedFromShareUrl: true,
        error: null,
      };
    } catch (caughtError) {
      return {
        value: defaultsQuery.data,
        loadedFromShareUrl: false,
        error:
          caughtError instanceof Error
            ? caughtError.message
            : "Could not decode the shared URL.",
      };
    }
  }, [defaultsQuery.data, inputTagValue]);

  const transformMutation = useMutation(
    transformWorkbookEndpointTransformWorkbookPostMutation(),
  );

  useEffect(() => {
    if (!bootstrapResult || didBootstrapRef.current) {
      return;
    }
    dispatch({ type: "bootstrap", value: bootstrapResult.value });
    didBootstrapRef.current = true;
  }, [bootstrapResult]);

  if (defaultsQuery.isLoading || !inputTag) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoaderCircle className="size-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

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
            {bootstrapResult?.loadedFromShareUrl ? (
              <p className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--foreground)]">
                Loaded configuration from the share URL.
              </p>
            ) : null}
            {error ? (
              <p className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-strong)]">
                {error}
              </p>
            ) : null}
            {!error && bootstrapResult?.error ? (
              <p className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-strong)]">
                {bootstrapResult.error}
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
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
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
  const aminoAcids = Object.keys(inputTag.codon_maps[0] ?? {}).filter(
    (field): field is keyof CodonMapSpec => field !== "name",
  );

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-3">
        <thead>
          <tr className="text-left text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            <th className="px-3">Amino Acid</th>
            {inputTag.codon_maps.map((codonMap, index) => (
              <th className="px-3" key={`${codonMap.name}-${index}`}>
                <div className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--panel-muted)] p-3">
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
          {aminoAcids.map((aminoAcid) => (
            <tr key={aminoAcid}>
              <th className="px-3 py-2 text-sm font-semibold">{aminoAcid}</th>
              {inputTag.codon_maps.map((codonMap, index) => (
                <td className="px-3" key={`${codonMap.name}-${aminoAcid}`}>
                  <Input
                    value={codonMap[aminoAcid]}
                    onChange={(event) =>
                      dispatch({
                        type: "updateCodonMap",
                        index,
                        field: aminoAcid,
                        value: event.target.value.toUpperCase(),
                      })
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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
  const regionNames = inputTag.regions.map((region) => region.name);
  return (
    <div className="mt-6 space-y-4">
      {inputTag.regions.map((region, index) => (
        <div
          key={`${region.name}-${index}`}
          className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--panel-muted)] p-5"
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <LabeledInput
              label="Region Name"
              value={region.name}
              onChange={(value) =>
                dispatch({
                  type: "updateRegion",
                  index,
                  field: "name",
                  value,
                })
              }
            />
            <LabeledInput
              label="Length (AAs)"
              type="number"
              value={`${region.length}`}
              onChange={(value) =>
                dispatch({
                  type: "updateRegion",
                  index,
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
                    type: "updateRegion",
                    index,
                    field: "predecessor",
                    value: event.target.value || null,
                  })
                }
              >
                <option value="">None</option>
                {regionNames
                  .filter((candidateName) => candidateName !== region.name)
                  .map((candidateName) => (
                    <option key={candidateName} value={candidateName}>
                      {candidateName}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <LabeledInput
              label="Start Tail"
              value={region.start_tail ?? ""}
              onChange={(value) =>
                dispatch({
                  type: "updateRegion",
                  index,
                  field: "start_tail",
                  value,
                })
              }
            />
            <LabeledInput
              label="End Tail"
              value={region.end_tail ?? ""}
              onChange={(value) =>
                dispatch({
                  type: "updateRegion",
                  index,
                  field: "end_tail",
                  value,
                })
              }
            />
            <LabeledInput
              label="Wild Type"
              value={region.wild_type ?? ""}
              onChange={(value) =>
                dispatch({
                  type: "updateRegion",
                  index,
                  field: "wild_type",
                  value,
                })
              }
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <Toggle
              label="Substitution"
              checked={Boolean(region.substitution)}
              onChange={(checked) =>
                dispatch({
                  type: "updateRegion",
                  index,
                  field: "substitution",
                  value: checked,
                })
              }
            />
            <Toggle
              label="Constant NT"
              checked={Boolean(region.constant_nt)}
              onChange={(checked) =>
                dispatch({
                  type: "updateRegion",
                  index,
                  field: "constant_nt",
                  value: checked,
                })
              }
            />
            <Toggle
              label="Reverse Complement Chain"
              checked={Boolean(region.reverse_complement)}
              onChange={(checked) =>
                dispatch({
                  type: "updateRegion",
                  index,
                  field: "reverse_complement",
                  value: checked,
                })
              }
            />
          </div>
          <div className="mt-5 flex gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => dispatch({ type: "duplicateRegion", index })}
            >
              Duplicate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch({ type: "deleteRegion", index })}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
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
            {inputTag.regions.map((region) => (
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
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="space-y-2 text-sm font-medium">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <Input
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
    <label className="inline-flex items-center gap-3 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
