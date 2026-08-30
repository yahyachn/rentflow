import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getMarketingAgency } from "@/lib/public-agency";

export const metadata: Metadata = { title: "Privacy policy" };

export default async function PrivacyPage() {
  const agency = await getMarketingAgency();
  if (!agency) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-6">
      <h1 className="font-display text-3xl font-semibold">Privacy policy</h1>
      <p className="text-muted-foreground mt-2 text-sm">Last updated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="prose-sm mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-semibold">Information we collect</h2>
          <p className="text-muted-foreground mt-2">
            When you submit a reservation request, we collect the information you provide:
            your name, contact details, driver&apos;s license and passport details, and rental
            preferences. We also collect basic technical data (browser, device type) to keep
            the site secure and working correctly.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold">How we use it</h2>
          <p className="text-muted-foreground mt-2">
            We use your information to process reservations, verify eligibility to drive,
            communicate about your booking, and — where you&apos;ve agreed — send you offers
            about {agency.name}&apos;s fleet.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold">Data retention</h2>
          <p className="text-muted-foreground mt-2">
            We keep reservation and customer records for as long as needed to comply with our
            legal, accounting, and insurance obligations, then remove or anonymize them.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-semibold">Your rights</h2>
          <p className="text-muted-foreground mt-2">
            You can request a copy of the data we hold about you, ask us to correct it, or ask
            us to delete it, subject to our legal retention obligations. Contact us using the
            details on our Contact page.
          </p>
        </section>
      </div>
    </div>
  );
}
