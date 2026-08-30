import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Wrench } from "lucide-react";

import { getMarketingAgency } from "@/lib/public-agency";

export const metadata: Metadata = {
  title: "About us",
  description: "Learn about our fleet, our team, and how we operate.",
};

export default async function AboutPage() {
  const agency = await getMarketingAgency();
  if (!agency) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-6">
      <h1 className="font-display text-3xl font-semibold">About {agency.name}</h1>
      <p className="text-muted-foreground mt-4 leading-relaxed">
        {agency.description ??
          `${agency.name} is a car and motorcycle rental agency based in ${agency.city ?? "Morocco"}, offering a well-maintained fleet with transparent pricing and straightforward booking.`}
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border p-6">
          <BadgeCheck className="text-primary size-5" />
          <h2 className="mt-3 font-medium">Verified fleet</h2>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Every vehicle is inspected and insured before it&apos;s listed for rent.
          </p>
        </div>
        <div className="rounded-xl border p-6">
          <Wrench className="text-primary size-5" />
          <h2 className="mt-3 font-medium">Regular maintenance</h2>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Scheduled servicing keeps every car and motorcycle road-ready.
          </p>
        </div>
        <div className="rounded-xl border p-6">
          <MapPin className="text-primary size-5" />
          <h2 className="mt-3 font-medium">Local expertise</h2>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Based in {agency.city ?? "Morocco"}, with pickup and return options nearby.
          </p>
        </div>
      </div>
    </div>
  );
}
