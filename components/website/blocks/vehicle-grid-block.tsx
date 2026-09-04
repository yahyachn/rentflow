import type { Locale } from "@/i18n/config";
import type { PublicVehicle } from "@/services/vehicles";
import type { VehicleGridBlock } from "@/validators/website-blocks";
import { pickText } from "@/components/website/locale-text";
import { selectVehicles } from "@/components/website/blocks/select-vehicles";
import { VehicleGridSection } from "@/components/marketing/vehicle-grid-section";

/** Pure view — takes the agency's candidate vehicle list as a prop so it can
 * be shared between the public (server-fetched) renderer and the dashboard
 * editor's (pre-loaded) live preview. Vehicles are always real business
 * data, scoped by whoever fetched `vehicles`; this component never queries
 * the DB itself. */
export function VehicleGridBlockView({
  block,
  vehicles,
  locale,
}: {
  block: VehicleGridBlock;
  vehicles: PublicVehicle[];
  locale: Locale;
}) {
  const selected = selectVehicles(vehicles, block);
  return (
    <VehicleGridSection
      title={pickText(block.title, locale) || undefined}
      description={pickText(block.subtitle, locale) || undefined}
      vehicles={selected}
      viewAllHref={block.showViewAllButton ? "/vehicles" : undefined}
    />
  );
}
