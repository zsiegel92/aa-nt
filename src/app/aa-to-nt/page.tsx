import { SignOutButton } from "@/components/aa-to-nt/sign-out-button";
import { AaToNtWorkbench } from "@/components/aa-to-nt/workbench";
import { defaultInputTag } from "@/lib/aa-to-nt/defaults";
import { validateInputTagState } from "@/lib/aa-to-nt/validation";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { decodeInputTagFromUrlValue } from "@/lib/input-tag/share";

type AaToNtPageProps = {
  searchParams: Promise<{ inputTag?: string }>;
};

export default async function AaToNtPage({ searchParams }: AaToNtPageProps) {
  const user = await requireAuthenticatedUser("/aa-to-nt");
  const { inputTag } = await searchParams;

  let initialInputTag = defaultInputTag;
  let initialShareError: string | null = null;
  let loadedFromShareUrl = false;

  if (inputTag) {
    try {
      initialInputTag = validateInputTagState(
        decodeInputTagFromUrlValue(inputTag),
      );
      loadedFromShareUrl = true;
    } catch (error) {
      initialShareError =
        error instanceof Error
          ? error.message
          : "Could not decode the shared URL.";
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[94rem] px-6 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Authenticated as {user.username}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            AA→NT Codon Design
          </h1>
        </div>
        <SignOutButton />
      </header>
      <AaToNtWorkbench
        initialInputTag={initialInputTag}
        initialShareError={initialShareError}
        loadedFromShareUrl={loadedFromShareUrl}
      />
    </main>
  );
}
