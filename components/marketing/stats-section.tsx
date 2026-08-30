/**
 * Deliberately shows only numbers we can actually back with real data
 * (fleet size, categories) plus non-numeric policy statements — no
 * fabricated "500+ happy customers"-style claims. Swap/extend once
 * Phase 3 reservation data exists to compute real booking-derived stats.
 */
export function StatsSection({
  vehicleCount,
  categoryCount,
}: {
  vehicleCount: number;
  categoryCount: number;
}) {
  const stats = [
    { value: String(vehicleCount), label: "Vehicles in fleet" },
    { value: String(categoryCount), label: "Categories available" },
    { value: "Insured", label: "Every rental, by default" },
    { value: "Same-day", label: "Reservation confirmation" },
  ];

  return (
    <section className="bg-secondary text-secondary-foreground">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-14 lg:grid-cols-4 lg:px-6">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="font-display text-3xl font-semibold sm:text-4xl">{stat.value}</p>
            <p className="text-secondary-foreground/60 mt-1 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
