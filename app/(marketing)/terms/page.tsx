import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getMarketingAgency } from "@/lib/public-agency";

export const metadata: Metadata = { title: "Terms of service" };

export default async function TermsPage() {
  const agency = await getMarketingAgency();
  if (!agency) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-6">
      <h1 className="font-display text-3xl font-semibold">Terms of service</h1>
      <p className="text-muted-foreground mt-2 text-sm">Last updated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-semibold">Eligibility</h2>
          <p className="text-muted-foreground mt-2">
            To rent a vehicle from {agency.name}, you must hold a valid driver&apos;s license
            for the vehicle category, meet the minimum age requirement shown on the vehicle
            page, and provide valid identification.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold">Reservations</h2>
          <p className="text-muted-foreground mt-2">
            A reservation request is not confirmed until you receive confirmation from our
            team. We reserve the right to decline a reservation. No-shows and late
            cancellations may be subject to a fee.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold">Deposit &amp; payment</h2>
          <p className="text-muted-foreground mt-2">
            A security deposit is required at pickup, held on a valid card and released after
            the vehicle is returned in its original condition. Rental fees are due at pickup
            unless otherwise agreed.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold">Vehicle use</h2>
          <p className="text-muted-foreground mt-2">
            The vehicle must be used in accordance with local traffic law, must not be
            sublet or used for commercial transport of passengers/goods without agreement, and
            must be returned with the agreed fuel level and on time.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold">Liability</h2>
          <p className="text-muted-foreground mt-2">
            Insurance coverage and its limits are described on the vehicle page. The renter is
            responsible for damage or loss not covered by the included insurance, up to the
            deposit amount unless otherwise agreed in writing.
          </p>
        </section>
      </div>
    </div>
  );
}
