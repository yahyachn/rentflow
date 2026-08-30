/**
 * OPT-IN DEMO DATA — not part of the normal seed, never for production.
 *
 * Generates a few months of realistic historical reservations (spread across
 * customers, vehicles, sources, and statuses) so the analytics dashboard and
 * booking calendar have something to show. Everything it creates is tagged
 * with the notes sentinel "DEMO_DATA" so it can be removed cleanly.
 *
 *   npm run db:seed:demo         add demo data (refuses if already present)
 *   npm run db:seed:demo:clear   remove all demo data
 *
 * It targets the demo agency ("atlas") created by the main seed.
 */
import { prisma } from "../lib/prisma";

const SENTINEL = "DEMO_DATA";
const DAY_MS = 24 * 60 * 60 * 1000;

const FIRST_NAMES = [
  "Youssef", "Salma", "Mehdi", "Imane", "Anas", "Hajar", "Reda", "Nawal",
  "Bilal", "Sara", "Hamza", "Aya", "Zakaria", "Meryem", "Ayoub", "Ines",
];
const LAST_NAMES = [
  "Alaoui", "Bennani", "Cherkaoui", "Fassi", "Haddadi", "Kabbaj", "Lahlou",
  "Mansouri", "Naciri", "Ouazzani", "Sabri", "Tahiri",
];
const CITIES = ["Casablanca", "Rabat", "Marrakech", "Tangier", "Fès", "Agadir"];
const SOURCES = [
  "WEBSITE", "WEBSITE", "WEBSITE", "WHATSAPP", "WHATSAPP", "INSTAGRAM",
  "PHONE", "WALK_IN", "GOOGLE", "FACEBOOK",
] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * DAY_MS);
}

async function getAgency() {
  const agency = await prisma.agency.findFirst({ where: { slug: "atlas", deletedAt: null } });
  if (!agency) {
    throw new Error('Demo agency "atlas" not found — run `npm run db:seed` first.');
  }
  return agency;
}

async function clearDemo() {
  const agency = await getAgency();
  const demoReservations = await prisma.reservation.findMany({
    where: { agencyId: agency.id, notes: SENTINEL },
    select: { id: true },
  });
  const ids = demoReservations.map((r) => r.id);

  // Availability blocks are SetNull (not cascade) on reservation delete, and
  // status logs cascade — remove both explicitly to be safe, then the rows.
  await prisma.vehicleAvailability.deleteMany({ where: { reservationId: { in: ids } } });
  await prisma.reservationStatusLog.deleteMany({ where: { reservationId: { in: ids } } });
  await prisma.reservation.deleteMany({ where: { id: { in: ids } } });
  const customers = await prisma.customer.deleteMany({
    where: { agencyId: agency.id, notes: SENTINEL },
  });

  console.log(`Removed ${ids.length} demo reservations and ${customers.count} demo customers.`);
}

async function seedDemo() {
  const agency = await getAgency();

  const existing = await prisma.reservation.count({
    where: { agencyId: agency.id, notes: SENTINEL },
  });
  if (existing > 0) {
    console.log(
      `Demo data already present (${existing} reservations). Run \`npm run db:seed:demo:clear\` first to reset.`,
    );
    return;
  }

  const owner = await prisma.user.findFirst({
    where: { agencyId: agency.id },
    select: { id: true },
  });

  const vehicles = await prisma.vehicle.findMany({
    where: { agencyId: agency.id, deletedAt: null },
    select: {
      id: true,
      depositAmount: true,
      pricing: { where: { period: "DAILY" }, select: { amount: true } },
    },
  });
  const bookable = vehicles.filter((v) => v.pricing.length > 0);
  if (bookable.length === 0) {
    throw new Error("No vehicles with a daily price to book — seed the fleet first.");
  }

  // Demo customers, tagged for clean removal.
  const customerIds: string[] = [];
  for (let i = 0; i < 14; i += 1) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const c = await prisma.customer.create({
      data: {
        agencyId: agency.id,
        firstName,
        lastName,
        email: `${firstName}.${lastName}${i}@example.ma`.toLowerCase(),
        phone: `+2126${randInt(10, 99)}-${randInt(100000, 999999)}`,
        city: pick(CITIES),
        country: "Morocco",
        status: Math.random() < 0.15 ? "VIP" : "REGULAR",
        notes: SENTINEL,
      },
    });
    customerIds.push(c.id);
  }

  const today = startOfDay(new Date());
  const perCustomer = new Map<string, { bookings: number; revenue: number }>();
  const REVENUE_STATUSES = new Set(["CONFIRMED", "ONGOING", "COMPLETED"]);

  let created = 0;
  // ~90 days back to ~40 days ahead keeps pickups inside the analytics window.
  for (let attempt = 0; attempt < 70; attempt += 1) {
    const vehicle = pick(bookable);
    const customerId = pick(customerIds);
    const source = pick(SOURCES);
    const dailyRate = Number(vehicle.pricing[0].amount);

    const startOffset = randInt(-85, 40);
    const duration = randInt(1, 6);
    const pickupDate = addDays(today, startOffset);
    const returnDate = addDays(pickupDate, duration);

    // Determine a plausible status from where the booking sits in time.
    let status: string;
    if (returnDate < today) {
      const r = Math.random();
      status = r < 0.82 ? "COMPLETED" : r < 0.92 ? "CANCELLED" : "NO_SHOW";
    } else if (pickupDate <= today) {
      status = "ONGOING";
    } else {
      status = Math.random() < 0.6 ? "CONFIRMED" : "PENDING";
    }

    const occupies = status !== "CANCELLED" && status !== "NO_SHOW";

    // Skip anything that would double-book an occupied window (mirrors the
    // real service's guard, so demo data is internally consistent).
    if (occupies) {
      const conflict = await prisma.vehicleAvailability.findFirst({
        where: {
          vehicleId: vehicle.id,
          status: { in: ["BOOKED", "BLOCKED", "MAINTENANCE"] },
          startDate: { lt: returnDate },
          endDate: { gt: pickupDate },
        },
        select: { id: true },
      });
      if (conflict) continue;
    }

    const basePrice = dailyRate * duration;
    const reservationNumber = `RF-${pickupDate.getFullYear()}-${String(900001 + created).padStart(6, "0")}`;

    await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.create({
        data: {
          agencyId: agency.id,
          reservationNumber,
          vehicleId: vehicle.id,
          customerId,
          status: status as never,
          source,
          pickupDate,
          returnDate,
          durationDays: duration,
          basePrice,
          totalPrice: basePrice,
          depositAmount: Number(vehicle.depositAmount),
          paymentStatus: status === "COMPLETED" ? "PAID" : "UNPAID",
          createdById: source === "WEBSITE" ? null : (owner?.id ?? null),
          notes: SENTINEL,
          cancelledAt: occupies ? null : addDays(pickupDate, -1),
          cancelledReason: occupies ? null : "Demo cancellation",
        },
      });

      if (occupies) {
        await tx.vehicleAvailability.create({
          data: {
            vehicleId: vehicle.id,
            startDate: pickupDate,
            endDate: returnDate,
            status: "BOOKED",
            reason: `Reservation ${reservationNumber}`,
            reservationId: reservation.id,
          },
        });
      }

      await tx.reservationStatusLog.create({
        data: {
          reservationId: reservation.id,
          status: status as never,
          changedById: owner?.id ?? null,
          note: "Demo data",
        },
      });
    });

    const agg = perCustomer.get(customerId) ?? { bookings: 0, revenue: 0 };
    agg.bookings += 1;
    if (REVENUE_STATUSES.has(status)) agg.revenue += basePrice;
    perCustomer.set(customerId, agg);
    created += 1;
  }

  // Roll the aggregates onto the demo customers' counters.
  for (const [customerId, agg] of perCustomer) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { totalBookings: agg.bookings, totalRevenue: agg.revenue },
    });
  }

  console.log(`Seeded ${created} demo reservations across ${perCustomer.size} customers.`);
  console.log('Demo data is tagged "DEMO_DATA" — remove it with `npm run db:seed:demo:clear`.');
}

async function main() {
  const clear = process.argv.includes("--clear");
  console.log("⚠  DEMO DATA — do not run against production.");
  if (clear) {
    await clearDemo();
  } else {
    await seedDemo();
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
