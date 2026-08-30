import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";

import { getMarketingAgency } from "@/lib/public-agency";
import { ContactForm } from "@/features/marketing/contact-form";
import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with our team.",
};

export default async function ContactPage() {
  const agency = await getMarketingAgency();
  if (!agency) notFound();

  const t = await getTranslations("contact");

  const rows = [
    agency.phone && { icon: Phone, label: t("phone"), value: agency.phone },
    agency.email && { icon: Mail, label: t("email"), value: agency.email },
    agency.address && {
      icon: MapPin,
      label: t("address"),
      value: `${agency.address}${agency.city ? `, ${agency.city}` : ""}`,
    },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string }[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-20 lg:px-6">
      <Reveal>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          <span className="text-gradient">{t("title")}</span>
        </h1>
        <p className="text-muted-foreground mt-3 max-w-xl">{t("subtitle")}</p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <Reveal className="space-y-4">
          {rows.map((r) => (
            <div key={r.label} className="glass flex items-start gap-3 rounded-2xl p-5">
              <span className="text-primary-foreground flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[var(--gold)]">
                <r.icon className="size-5" />
              </span>
              <div>
                <p className="font-medium">{r.label}</p>
                <p className="text-muted-foreground text-sm">{r.value}</p>
              </div>
            </div>
          ))}
        </Reveal>

        <Reveal delay={0.1} className="glass-strong rounded-2xl p-6">
          <ContactForm />
        </Reveal>
      </div>
    </div>
  );
}
