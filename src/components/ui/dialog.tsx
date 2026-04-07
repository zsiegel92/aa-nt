"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = ({
  className,
  ...props
}: DialogPrimitive.DialogOverlayProps) => (
  <DialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-[rgba(20,32,24,0.45)] backdrop-blur-[2px]",
      className
    )}
    {...props}
  />
);

export const DialogContent = ({
  className,
  children,
  ...props
}: DialogPrimitive.DialogContentProps) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-[min(92vw,44rem)] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_40px_120px_rgba(22,32,18,0.18)]",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-2 text-[var(--muted-foreground)] transition hover:bg-[var(--panel-muted)] hover:text-[var(--foreground)]">
        <X className="size-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
);

export const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-2", className)} {...props} />
);

export const DialogTitle = ({
  className,
  ...props
}: DialogPrimitive.DialogTitleProps) => (
  <DialogPrimitive.Title
    className={cn("text-2xl font-semibold tracking-tight", className)}
    {...props}
  />
);

export const DialogDescription = ({
  className,
  ...props
}: DialogPrimitive.DialogDescriptionProps) => (
  <DialogPrimitive.Description
    className={cn("text-sm text-[var(--muted-foreground)]", className)}
    {...props}
  />
);
