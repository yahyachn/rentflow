import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";
import { FloatingWhatsapp } from "@/components/marketing/floating-whatsapp";
import { getMarketingAgency } from "@/lib/public-agency";
import { agencyThemeStyle } from "@/lib/theme-agency";
import { listPublishedPagesForNav } from "@/services/website";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  // Cached per request (React `cache()`), so this doesn't add a DB round
  // trip on top of what each page already does. An agency's primary/accent
  // brand color (Website > Theme in the dashboard) overrides the shared
  // default palette here — an agency that never touched it renders with the
  // exact same colors as before this existed (see lib/theme-agency.ts).
  const agency = await getMarketingAgency();
  const customPages = agency ? await listPublishedPagesForNav(agency.id) : [];

  return (
    // `marketing-shell` applies the public site's own luxury palette
    // (light by default, dark when the theme toggle sets `.dark` on <html>).
    <div
      className="marketing-shell relative flex min-h-svh flex-col"
      style={agency ? agencyThemeStyle(agency) : undefined}
    >
      <div className="grid-overlay pointer-events-none absolute inset-0 -z-10" />
      <MarketingNavbar customPages={customPages} />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
      <FloatingWhatsapp number={agency?.whatsapp ?? null} />
    </div>
  );
}
