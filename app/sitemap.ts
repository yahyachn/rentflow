import type { MetadataRoute } from "next";

import { getMarketingAgency } from "@/lib/public-agency";
import { getVehicles } from "@/services/vehicles";

const STATIC_ROUTES = ["", "/vehicles", "/about", "/faq", "/contact", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://rentflow.ma";
  const agency = await getMarketingAgency();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  if (!agency) return staticEntries;

  const vehicles = await getVehicles(agency.id);
  const vehicleEntries: MetadataRoute.Sitemap = vehicles.map((v) => ({
    url: `${base}/vehicles/${v.slug}`,
    lastModified: v.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...vehicleEntries];
}
