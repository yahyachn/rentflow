import type { PublicVehicle } from "@/services/vehicles";
import type { VehicleGridBlock } from "@/validators/website-blocks";

/**
 * Pure filter/sort/limit for a `vehicleGrid` block's config, given a
 * candidate list of the agency's available vehicles. Shared by:
 *   - the public renderer (components/website/blocks/vehicle-grid-block.tsx),
 *     which fetches the candidate list from the DB, agency-scoped;
 *   - the dashboard editor's live preview (features/website/editor-preview.tsx),
 *     which reuses the same pre-loaded list client-side so the preview
 *     matches the public output without a second data-fetching code path.
 */
export function selectVehicles(vehicles: PublicVehicle[], block: VehicleGridBlock): PublicVehicle[] {
  let result = vehicles;

  if (block.vehicleType !== "ALL") {
    result = result.filter((v) => v.type === block.vehicleType);
  }
  if (block.categoryIds.length > 0) {
    result = result.filter((v) => v.categoryId && block.categoryIds.includes(v.categoryId));
  }
  if (block.source === "featured") {
    result = result.filter((v) => v.featured);
  }

  const dailyAmount = (v: PublicVehicle) => {
    const daily = v.pricing.find((p) => p.period === "DAILY");
    return daily ? Number(daily.amount) : Number.POSITIVE_INFINITY;
  };

  result = [...result].sort((a, b) => {
    switch (block.sort) {
      case "price_asc":
        return dailyAmount(a) - dailyAmount(b);
      case "price_desc":
        return dailyAmount(b) - dailyAmount(a);
      case "newest":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return result.slice(0, block.limit);
}
