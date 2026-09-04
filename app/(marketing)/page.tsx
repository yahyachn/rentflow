import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";

import { getMarketingAgency } from "@/lib/public-agency";
import { getPublishedHomeBlocks } from "@/services/website";
import { isLocale } from "@/i18n/config";
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
import { PublicPageRenderer } from "@/components/website/public-page-renderer";

export default async function HomePage() {
  const agency = await getMarketingAgency();
  if (!agency) notFound();

  // An agency only gets the Website Builder's rendering once it has actually
  // published a Home page (see services/website.ts#getPublishedHomeBlocks) —
  // every other agency (which is every agency that existed before this
  // feature) keeps rendering the original hardcoded homepage below, so
  // nothing changes for them.
  const publishedBlocks = await getPublishedHomeBlocks(agency.id);
  if (publishedBlocks && publishedBlocks.length > 0) {
    const rawLocale = await getLocale();
    const locale = isLocale(rawLocale) ? rawLocale : "fr";
    return <PublicPageRenderer blocks={publishedBlocks} agency={agency} locale={locale} />;
  }

  return (
    <DefaultHomePage
      agencyId={agency.id}
      agency={{ whatsapp: agency.whatsapp, coverImageUrl: agency.coverImageUrl }}
    />
  );
}

/** RentFlow's default homepage — the fallback for every agency that hasn't
 * published a customized Home page via the Website Builder. */
async function DefaultHomePage({
  agencyId,
  agency,
}: {
  agencyId: string;
  agency: { whatsapp: string | null; coverImageUrl: string | null };
}) {
  const [featured, latest, categories, t] = await Promise.all([
    getFeaturedVehicles(agencyId),
    getLatestVehicles(agencyId),
    getVehicleCategories(agencyId),
    getTranslations("grid"),
  ]);

  const vehicleCount = categories.reduce((sum, c) => sum + c._count.vehicles, 0);

  return (
    <>
      <Hero agency={agency} />
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
      <ReviewsSection agencyId={agencyId} />
      <CtaSection />
    </>
  );
}
