import { notFound } from "next/navigation";

import { getMarketingAgency } from "@/lib/public-agency";
import {
  getFeaturedVehicles,
  getLatestVehicles,
  getVehicleCategories,
} from "@/services/vehicles";
import { Hero } from "@/components/marketing/hero";
import { CategoriesSection } from "@/components/marketing/categories-section";
import { WhyChooseUs } from "@/components/marketing/why-choose-us";
import { StatsSection } from "@/components/marketing/stats-section";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { VehicleGridSection } from "@/components/marketing/vehicle-grid-section";
import { ReviewsSection } from "@/components/marketing/reviews-section";
import { CtaSection } from "@/components/marketing/cta-section";

export default async function HomePage() {
  const agency = await getMarketingAgency();
  if (!agency) notFound();

  const [featured, latest, categories] = await Promise.all([
    getFeaturedVehicles(agency.id),
    getLatestVehicles(agency.id),
    getVehicleCategories(agency.id),
  ]);

  const vehicleCount = categories.reduce((sum, c) => sum + c._count.vehicles, 0);

  return (
    <>
      <Hero />
      <VehicleGridSection
        title="Featured vehicles"
        description="Hand-picked from our fleet."
        vehicles={featured}
        viewAllHref="/vehicles"
      />
      <CategoriesSection categories={categories} />
      <WhyChooseUs />
      <StatsSection vehicleCount={vehicleCount} categoryCount={categories.length} />
      <HowItWorks />
      <VehicleGridSection
        title="Latest additions"
        description="Recently added to the fleet."
        vehicles={latest}
        viewAllHref="/vehicles"
      />
      <ReviewsSection agencyId={agency.id} />
      <CtaSection />
    </>
  );
}
