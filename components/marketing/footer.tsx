import Link from "next/link";
import { useTranslations } from "next-intl";
import { Car } from "lucide-react";

export function MarketingFooter() {
  const t = useTranslations("footer");

  const sections = [
    {
      title: t("product"),
      links: [
        { href: "/vehicles", label: t("vehicles") },
        { href: "/vehicles?type=CAR", label: t("cars") },
        { href: "/vehicles?type=MOTORCYCLE", label: t("motorcycles") },
        { href: "/services", label: t("services") },
      ],
    },
    {
      title: t("company"),
      links: [
        { href: "/about", label: t("about") },
        { href: "/contact", label: t("contact") },
        { href: "/faq", label: t("faq") },
      ],
    },
    {
      title: t("legal"),
      links: [
        { href: "/privacy", label: t("privacy") },
        { href: "/terms", label: t("terms") },
      ],
    },
  ];

  return (
    <footer className="relative mt-8 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 font-display font-semibold">
              <span className="glow-primary flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[var(--gold)] text-primary-foreground">
                <Car className="size-4" />
              </span>
              RentFlow
            </Link>
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">{t("tagline")}</p>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <p className="text-sm font-semibold">{section.title}</p>
              <ul className="mt-4 space-y-2.5">
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

        <div className="text-muted-foreground mt-12 border-t border-border pt-6 text-xs">
          © {new Date().getFullYear()} RentFlow. {t("rights")}
        </div>
      </div>
    </footer>
  );
}
