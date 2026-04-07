"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center rounded-full text-sm font-semibold transition disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent)] px-4 py-2 text-[var(--accent-foreground)] shadow-sm hover:bg-[var(--accent-strong)] focus-visible:ring-[var(--accent)]",
        secondary:
          "border border-[var(--border-strong)] bg-white px-4 py-2 text-[var(--foreground)] hover:bg-[var(--panel-muted)] focus-visible:ring-[var(--accent)]",
        ghost:
          "px-3 py-2 text-[var(--muted-foreground)] hover:bg-[var(--panel-muted)] hover:text-[var(--foreground)] focus-visible:ring-[var(--accent)]",
        danger:
          "bg-[var(--danger)] px-4 py-2 text-white hover:bg-[var(--danger-strong)] focus-visible:ring-[var(--danger)]",
      },
      size: {
        default: "h-10",
        sm: "h-9 px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);

Button.displayName = "Button";
