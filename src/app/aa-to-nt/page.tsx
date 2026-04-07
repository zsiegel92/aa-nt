import { SignOutButton } from "@/components/aa-to-nt/sign-out-button";
import { AaToNtWorkbench } from "@/components/aa-to-nt/workbench";
import { requireAuthenticatedUser } from "@/lib/auth/server";

export default async function AaToNtPage() {
  const user = await requireAuthenticatedUser("/aa-to-nt");

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
      <AaToNtWorkbench />
    </main>
  );
}
