"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        startTransition(async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.replace("/login");
          router.refresh();
        });
      }}
      disabled={isPending}
    >
      <LogOut className="mr-2 size-4" />
      Sign Out
    </Button>
  );
}
