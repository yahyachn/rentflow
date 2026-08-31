import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    // `dark` enables dark: variants; `marketing-shell` forces the luxury
    // palette + layered background regardless of the site theme toggle.
    <div className="dark marketing-shell relative flex min-h-svh flex-col">
      <div className="grid-overlay pointer-events-none absolute inset-0 -z-10" />
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
