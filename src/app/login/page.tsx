import { redirect } from "next/navigation";

import { LoginForm } from "@/components/aa-to-nt/login-form";
import { getAuthenticatedUser } from "@/lib/auth/server";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [{ callbackUrl }, user] = await Promise.all([
    searchParams,
    getAuthenticatedUser(),
  ]);
  if (user) {
    redirect(callbackUrl ?? "/aa-to-nt");
  }
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10">
      <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Single-team auth
          </p>
          <h1 className="max-w-2xl text-5xl font-semibold leading-tight tracking-tight">
            Protected Next.js shell, typed FastAPI backend, no exposed AA→NT app
            bundle before login.
          </h1>
          <p className="max-w-2xl text-lg text-[var(--muted-foreground)]">
            This app uses the minimal signed-cookie pattern you liked in the
            Modal app, but moved into the Next layer so both the page and the
            same-origin backend proxy stay gated.
          </p>
        </section>
        <LoginForm />
      </div>
    </main>
  );
}
