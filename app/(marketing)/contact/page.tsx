import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";

import { getMarketingAgency } from "@/lib/public-agency";
import { ContactForm } from "@/features/marketing/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with our team.",
};

export default async function ContactPage() {
  const agency = await getMarketingAgency();
  if (!agency) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 lg:px-6">
      <h1 className="font-display text-3xl font-semibold">Contact us</h1>
      <p className="text-muted-foreground mt-2 max-w-xl">
        Questions about a reservation or your rental? Reach out — we usually respond within a
        few hours.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          {agency.phone && (
            <div className="flex items-start gap-3">
              <Phone className="text-primary mt-0.5 size-5" />
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-muted-foreground text-sm">{agency.phone}</p>
              </div>
            </div>
          )}
          {agency.email && (
            <div className="flex items-start gap-3">
              <Mail className="text-primary mt-0.5 size-5" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-muted-foreground text-sm">{agency.email}</p>
              </div>
            </div>
          )}
          {agency.address && (
            <div className="flex items-start gap-3">
              <MapPin className="text-primary mt-0.5 size-5" />
              <div>
                <p className="font-medium">Address</p>
                <p className="text-muted-foreground text-sm">
                  {agency.address}
                  {agency.city ? `, ${agency.city}` : ""}
                </p>
              </div>
            </div>
          )}
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
