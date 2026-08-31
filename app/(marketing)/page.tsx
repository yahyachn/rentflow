import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

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

  const [featured, latest, categories, t] = await Promise.all([
    getFeaturedVehicles(agency.id),
    getLatestVehicles(agency.id),
    getVehicleCategories(agency.id),
    getTranslations("grid"),
  ]);

  const vehicleCount = categories.reduce((sum, c) => sum + c._count.vehicles, 0);

  return (
    <>
      <Hero />
      <VehicleGridSection
        title={t("featuredTitle")}
        description={t("featuredDesc")}
        vehicles={featured}
        viewAllHref="/vehicles"
      />
      <CategoriesSection categories={categories} />
      <WhyChooseUs />
      <StatsSection vehicleCount={vehicleCount} categoryCount={categories.length} />
      <HowItWorks />
      <VehicleGridSection
        title={t("latestTitle")}
        description={t("latestDesc")}
        vehicles={latest}
        viewAllHref="/vehicles"
      />
      <ReviewsSection agencyId={agency.id} />
      <CtaSection />
    </>
  );
}
