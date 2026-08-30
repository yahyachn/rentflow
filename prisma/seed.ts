/**
 * Seeds:
 *   1. The global Permission catalog (idempotent upsert).
 *   2. A demo agency ("Atlas Car Rental") with its Owner/Manager/Employee
 *      roles, an Owner login, vehicle categories, and a handful of vehicles
 *      with images/pricing — enough for the marketing site and dashboard to
 *      render real data end to end.
 *
 * Run with: npm run db:seed
 */
import { hashPassword } from "better-auth/crypto";

import { prisma } from "../lib/prisma";
import { PERMISSIONS } from "../lib/permissions";
import { provisionAgency } from "../services/agency";
import { slugify } from "../lib/utils";

const DEMO_OWNER_EMAIL = "owner@atlascarrental.com";
const DEMO_OWNER_PASSWORD = "RentFlow2026!";

async function seedPermissions() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { label: permission.label, group: permission.group, description: permission.description },
      create: permission,
    });
  }
  console.log(`Seeded ${PERMISSIONS.length} permissions.`);
}

const CAR_CATEGORIES = [
  { name: "Economy", slug: "economy", icon: "Car" },
  { name: "SUV", slug: "suv", icon: "Truck" },
  { name: "Luxury", slug: "luxury", icon: "Sparkles" },
  { name: "Van", slug: "van", icon: "Bus" },
] as const;

const MOTO_CATEGORIES = [
  { name: "Scooter", slug: "scooter", icon: "Bike" },
  { name: "Touring", slug: "touring", icon: "Bike" },
] as const;

const CAR_FLEET = [
  {
    category: "economy",
    brand: "Dacia",
    model: "Sandero",
    year: 2024,
    transmission: "MANUAL" as const,
    fuel: "PETROL" as const,
    seats: 5,
    doors: 5,
    horsepower: 90,
    engineSize: "1.0L",
    dailyPrice: 250,
    color: "White",
    featured: true,
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=80",
  },
  {
    category: "economy",
    brand: "Renault",
    model: "Clio",
    year: 2023,
    transmission: "AUTOMATIC" as const,
    fuel: "PETROL" as const,
    seats: 5,
    doors: 5,
    horsepower: 100,
    engineSize: "1.2L",
    dailyPrice: 280,
    color: "Blue",
    featured: false,
    image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1200&q=80",
  },
  {
    category: "suv",
    brand: "Dacia",
    model: "Duster",
    year: 2024,
    transmission: "AUTOMATIC" as const,
    fuel: "DIESEL" as const,
    seats: 5,
    doors: 5,
    horsepower: 115,
    engineSize: "1.5L dCi",
    dailyPrice: 420,
    color: "Grey",
    featured: true,
    image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1200&q=80",
  },
  {
    category: "suv",
    brand: "Volkswagen",
    model: "Tiguan",
    year: 2023,
    transmission: "AUTOMATIC" as const,
    fuel: "DIESEL" as const,
    seats: 5,
    doors: 5,
    horsepower: 150,
    engineSize: "2.0L TDI",
    dailyPrice: 550,
    color: "Black",
    featured: true,
    image: "https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=1200&q=80",
  },
  {
    category: "luxury",
    brand: "Mercedes-Benz",
    model: "C-Class",
    year: 2024,
    transmission: "AUTOMATIC" as const,
    fuel: "DIESEL" as const,
    seats: 5,
    doors: 4,
    horsepower: 194,
    engineSize: "2.0L",
    dailyPrice: 950,
    color: "Black",
    featured: true,
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=80",
  },
  {
    category: "van",
    brand: "Mercedes-Benz",
    model: "Vito",
    year: 2022,
    transmission: "MANUAL" as const,
    fuel: "DIESEL" as const,
    seats: 9,
    doors: 4,
    horsepower: 136,
    engineSize: "2.0L CDI",
    dailyPrice: 700,
    color: "White",
    featured: false,
    image: "https://images.unsplash.com/photo-1746985094087-e703bf52c71b?w=1200&q=80",
  },
];

const MOTO_FLEET = [
  {
    category: "scooter",
    brand: "Yamaha",
    model: "NMAX 125",
    year: 2024,
    transmission: "AUTOMATIC" as const,
    fuel: "PETROL" as const,
    seats: 2,
    horsepower: 12,
    engineSize: "125cc",
    dailyPrice: 180,
    color: "Grey",
    featured: true,
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&q=80",
  },
  {
    category: "touring",
    brand: "BMW",
    model: "R 1250 GS",
    year: 2023,
    transmission: "MANUAL" as const,
    fuel: "PETROL" as const,
    seats: 2,
    horsepower: 136,
    engineSize: "1254cc",
    dailyPrice: 890,
    color: "Blue/White",
    featured: true,
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&q=80",
  },
];

async function seedDemoAgency() {
  const existing = await prisma.agency.findUnique({ where: { slug: "atlas" } });
  if (existing) {
    console.log("Demo agency already seeded, skipping.");
    return existing;
  }

  const { agency, ownerRoleId } = await prisma.$transaction((tx) =>
    provisionAgency(tx, { name: "Atlas Car Rental", email: DEMO_OWNER_EMAIL }),
  );
  // provisionAgency slugifies the name to something like "atlas-car-rental";
  // force the short "atlas" slug for a nicer demo subdomain (atlas.rentflow.ma).
  await prisma.agency.update({ where: { id: agency.id }, data: { slug: "atlas" } });

  const passwordHash = await hashPassword(DEMO_OWNER_PASSWORD);
  const owner = await prisma.user.create({
    data: {
      agencyId: agency.id,
      roleId: ownerRoleId,
      name: "Yasmine Laaroussi",
      email: DEMO_OWNER_EMAIL,
      emailVerified: true,
    },
  });
  await prisma.account.create({
    data: {
      userId: owner.id,
      accountId: owner.id,
      providerId: "credential",
      issuer: "local:credential",
      password: passwordHash,
    },
  });

  const categoryIds: Record<string, string> = {};
  for (const c of CAR_CATEGORIES) {
    const cat = await prisma.vehicleCategory.create({
      data: { agencyId: agency.id, name: c.name, slug: c.slug, type: "CAR", icon: c.icon },
    });
    categoryIds[c.slug] = cat.id;
  }
  for (const c of MOTO_CATEGORIES) {
    const cat = await prisma.vehicleCategory.create({
      data: { agencyId: agency.id, name: c.name, slug: c.slug, type: "MOTORCYCLE", icon: c.icon },
    });
    categoryIds[c.slug] = cat.id;
  }

  for (const v of [...CAR_FLEET.map((v) => ({ ...v, type: "CAR" as const })), ...MOTO_FLEET.map((v) => ({ ...v, type: "MOTORCYCLE" as const, doors: undefined }))]) {
    const slug = slugify(`${v.brand}-${v.model}-${v.year}`);
    const vehicle = await prisma.vehicle.create({
      data: {
        agencyId: agency.id,
        categoryId: categoryIds[v.category],
        type: v.type,
        brand: v.brand,
        model: v.model,
        year: v.year,
        slug,
        transmission: v.transmission,
        fuel: v.fuel,
        horsepower: v.horsepower,
        engineSize: v.engineSize,
        seats: v.seats,
        doors: "doors" in v ? v.doors : undefined,
        color: v.color,
        hasAC: true,
        hasBluetooth: true,
        hasGPS: v.type === "CAR",
        unlimitedKm: true,
        insuranceIncluded: true,
        depositAmount: v.type === "CAR" ? 5000 : 2000,
        description: `A well-maintained ${v.year} ${v.brand} ${v.model}, serviced regularly and ready for your next trip.`,
        status: "AVAILABLE",
        featured: v.featured,
        mileage: Math.floor(Math.random() * 30000) + 5000,
      },
    });

    await prisma.vehicleImage.create({
      data: { vehicleId: vehicle.id, url: v.image, isCover: true, position: 0, alt: `${v.brand} ${v.model}` },
    });

    await prisma.vehiclePricing.createMany({
      data: [
        { vehicleId: vehicle.id, period: "DAILY", amount: v.dailyPrice },
        { vehicleId: vehicle.id, period: "WEEKLY", amount: v.dailyPrice * 6, discountPercent: 14 },
        { vehicleId: vehicle.id, period: "MONTHLY", amount: v.dailyPrice * 22, discountPercent: 27 },
      ],
    });
  }

  console.log(`Seeded demo agency "Atlas Car Rental" (slug: atlas).`);
  console.log(`Owner login -> email: ${DEMO_OWNER_EMAIL}  password: ${DEMO_OWNER_PASSWORD}`);

  return agency;
}

async function main() {
  await seedPermissions();
  await seedDemoAgency();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
