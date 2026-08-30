import Link from "next/link";
import { Car } from "lucide-react";

const FOOTER_LINKS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/vehicles", label: "Vehicles" },
      { href: "/vehicles?type=CAR", label: "Cars" },
      { href: "/vehicles?type=MOTORCYCLE", label: "Motorcycles" },
      { href: "/services", label: "Services" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/contact", label: "Contact" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 space-y-3 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-display font-semibold">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Car className="size-4" />
              </span>
              RentFlow
            </Link>
            <p className="text-muted-foreground max-w-xs text-sm">
              The rental management platform for car and motorcycle agencies.
            </p>
          </div>

          {FOOTER_LINKS.map((section) => (
            <div key={section.title}>
              <p className="text-sm font-medium">{section.title}</p>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-muted-foreground mt-10 border-t pt-6 text-xs">
          © {new Date().getFullYear()} RentFlow. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
