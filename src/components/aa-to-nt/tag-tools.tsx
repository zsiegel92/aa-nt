"use client";

import { Copy, FileJson2, Link2, Upload } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { validateInputTagState } from "@/lib/aa-to-nt/validation";
import type { InputTag } from "@/lib/api/short-types";
import {
  buildShareUrl,
  parseInputTagJson,
  serializeInputTagToJson,
} from "@/lib/input-tag/share";

type TagToolsProps = {
  inputTag: InputTag;
  onApplyInputTag: (inputTag: InputTag) => void;
};

export function TagTools({ inputTag, onApplyInputTag }: TagToolsProps) {
  const [jsonOutput, setJsonOutput] = useState<string>("");
  const [shareUrlOutput, setShareUrlOutput] = useState<string>("");
  const [pasteValue, setPasteValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);

  const copyToClipboard = async (value: string) => {
    await navigator.clipboard.writeText(value);
  };

  return (
    <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--panel-shadow)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Tag Tools</h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">
            Generate JSON or a share URL on demand, then paste JSON back through
            a modal when you want to restore a configuration.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              try {
                const validatedInputTag = validateInputTagState(inputTag);
                setJsonOutput(serializeInputTagToJson(validatedInputTag));
                setError(null);
              } catch (caughtError) {
                setError(
                  caughtError instanceof Error
                    ? caughtError.message
                    : "Could not generate the JSON export.",
                );
              }
            }}
          >
            <FileJson2 className="mr-2 size-4" />
            Generate JSON
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              try {
                const validatedInputTag = validateInputTagState(inputTag);
                const currentUrl = `${window.location.origin}/aa-to-nt`;
                setShareUrlOutput(buildShareUrl(currentUrl, validatedInputTag));
                setError(null);
              } catch (caughtError) {
                setError(
                  caughtError instanceof Error
                    ? caughtError.message
                    : "Could not generate the share URL.",
                );
              }
            }}
          >
            <Link2 className="mr-2 size-4" />
            Generate Share URL
          </Button>
          <Button variant="secondary" onClick={() => setIsPasteModalOpen(true)}>
            <Upload className="mr-2 size-4" />
            Paste JSON
          </Button>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-strong)]">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <OutputCard
          title="Generated JSON"
          value={jsonOutput}
          onCopy={() => copyToClipboard(jsonOutput)}
        />
        <OutputCard
          title="Generated Share URL"
          value={shareUrlOutput}
          onCopy={() => copyToClipboard(shareUrlOutput)}
        />
      </div>

      <Dialog open={isPasteModalOpen} onOpenChange={setIsPasteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paste Input Tag JSON</DialogTitle>
            <DialogDescription>
              Paste a previously generated JSON payload. The form will only
              update when you click apply.
            </DialogDescription>
          </DialogHeader>
          <textarea
            className="mt-5 min-h-72 w-full rounded-[1.5rem] border border-[var(--border)] bg-white p-4 font-mono text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            placeholder='{"codon_maps":[...]}'
            value={pasteValue}
            onChange={(event) => setPasteValue(event.target.value)}
          />
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsPasteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                try {
                  const parsed = validateInputTagState(
                    parseInputTagJson(pasteValue),
                  );
                  onApplyInputTag(parsed);
                  setPasteValue("");
                  setError(null);
                  setIsPasteModalOpen(false);
                } catch (caughtError) {
                  setError(
                    caughtError instanceof Error
                      ? caughtError.message
                      : "Could not parse the pasted JSON.",
                  );
                }
              }}
            >
              Apply JSON
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

type OutputCardProps = {
  title: string;
  value: string;
  onCopy: () => Promise<void>;
};

function OutputCard({ title, value, onCopy }: OutputCardProps) {
  return (
    <div className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--panel-muted)] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          {title}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (!value) {
              return;
            }
            void onCopy();
          }}
        >
          <Copy className="mr-2 size-4" />
          Copy
        </Button>
      </div>
      <textarea
        readOnly
        value={value}
        className="mt-3 min-h-48 w-full rounded-[1.3rem] border border-[var(--border)] bg-white p-4 font-mono text-xs outline-none"
        placeholder="Nothing generated yet."
      />
    </div>
  );
}
