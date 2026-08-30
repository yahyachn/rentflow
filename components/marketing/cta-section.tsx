import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 lg:px-6">
      <div className="bg-primary text-primary-foreground relative overflow-hidden rounded-2xl px-6 py-14 text-center sm:px-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative">
          <h2 className="font-display text-3xl font-semibold text-balance sm:text-4xl">
            Ready to hit the road?
          </h2>
          <p className="text-primary-foreground/80 mx-auto mt-3 max-w-md">
            Browse the full fleet and send a reservation request in minutes.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <Link href="/vehicles">
              Browse vehicles <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
