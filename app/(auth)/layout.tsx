import Link from "next/link";
import { Car } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-6 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-display font-semibold">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Car className="size-4" />
            </span>
            RentFlow
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
      <div className="bg-secondary relative hidden lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklch,var(--primary)_35%,transparent),transparent_60%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-secondary-foreground">
          <div />
          <div className="space-y-4">
            <p className="font-display text-3xl leading-tight font-semibold">
              Run your rental agency from one dashboard.
            </p>
            <p className="text-secondary-foreground/70 max-w-md">
              Fleet, bookings, customers, and analytics — built for car and
              motorcycle rental businesses, from a single owner-operator to a
              multi-branch fleet.
            </p>
          </div>
          <p className="text-secondary-foreground/50 text-sm">
            © {new Date().getFullYear()} RentFlow. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
