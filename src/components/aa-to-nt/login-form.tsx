"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/aa-to-nt";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-5 rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-[var(--panel-shadow)]"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
          });
          if (!response.ok) {
            const payload = (await response.json()) as { error?: string };
            setError(payload.error ?? "Login failed.");
            return;
          }
          router.replace(callbackUrl);
          router.refresh();
        });
      }}
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
          Secure Access
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Sign in to use the AA→NT designer
        </h1>
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
          The protected route only renders once this session cookie is valid.
        </p>
      </div>
      <div className="space-y-4">
        <label className="space-y-2 text-sm font-medium">
          <span className="text-[var(--muted-foreground)]">Username</span>
          <Input value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label className="space-y-2 text-sm font-medium">
          <span className="text-[var(--muted-foreground)]">Password</span>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
      </div>
      {error ? (
        <p className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-strong)]">
          {error}
        </p>
      ) : null}
      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
