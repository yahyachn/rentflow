import { BadgeCheck, Clock, ShieldCheck, Wallet } from "lucide-react";

const REASONS = [
  {
    icon: BadgeCheck,
    title: "Verified fleet",
    description: "Every vehicle is inspected and insured before it's listed.",
  },
  {
    icon: Wallet,
    title: "Transparent pricing",
    description: "No hidden fees — daily, weekly, and monthly rates upfront.",
  },
  {
    icon: Clock,
    title: "Fast confirmation",
    description: "Reservation requests are reviewed and confirmed within hours.",
  },
  {
    icon: ShieldCheck,
    title: "Insurance included",
    description: "Every rental comes with baseline coverage, deposit clearly stated.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-semibold">Why rent with us</h2>
        <p className="text-muted-foreground mt-3">
          Built on RentFlow — the same platform trusted by rental agencies to run their
          fleet and bookings.
        </p>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {REASONS.map((reason) => (
          <div key={reason.title} className="rounded-xl border p-6">
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
              <reason.icon className="size-5" />
            </span>
            <h3 className="mt-4 font-medium">{reason.title}</h3>
            <p className="text-muted-foreground mt-1.5 text-sm">{reason.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
