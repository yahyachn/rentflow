import Link from "next/link";
import { Car, Home, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-full">
        <Car className="size-7" />
      </span>
      <div className="space-y-2">
        <p className="text-muted-foreground font-display text-6xl font-semibold">404</p>
        <h1 className="font-display text-xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/vehicles">
            <Search /> Browse vehicles
          </Link>
        </Button>
        <Button asChild>
          <Link href="/">
            <Home /> Go home
          </Link>
        </Button>
      </div>
    </div>
  );
}
