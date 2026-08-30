"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-full">
        <AlertTriangle className="size-6" />
      </span>
      <div className="space-y-1">
        <h1 className="font-display text-lg font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          An unexpected error occurred. You can try again, or come back later.
        </p>
      </div>
      <Button onClick={() => reset()}>
        <RotateCw /> Try again
      </Button>
    </div>
  );
}
