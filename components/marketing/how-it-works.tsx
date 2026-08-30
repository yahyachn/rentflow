import { CalendarCheck, CarFront, Search } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Search & compare",
    description: "Filter by type, dates, and city to find the right vehicle.",
  },
  {
    icon: CalendarCheck,
    title: "Request a reservation",
    description: "Submit your dates and details — we confirm within hours.",
  },
  {
    icon: CarFront,
    title: "Pick up & go",
    description: "Show up at the agreed time and city, sign the paperwork, drive off.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-semibold">How it works</h2>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="relative text-center">
            <div className="border-primary/30 text-primary mx-auto flex size-14 items-center justify-center rounded-full border-2">
              <step.icon className="size-6" />
            </div>
            <p className="text-muted-foreground mt-3 text-xs font-medium">STEP {i + 1}</p>
            <h3 className="mt-1 font-medium">{step.title}</h3>
            <p className="text-muted-foreground mt-1.5 text-sm">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
