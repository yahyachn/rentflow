"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Car, Menu } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", key: "home" },
  { href: "/vehicles", key: "vehicles" },
  { href: "/about", key: "about" },
  { href: "/faq", key: "faq" },
  { href: "/contact", key: "contact" },
] as const;

export function MarketingNavbar({
  customPages = [],
}: {
  /** Published Website Builder pages (other than Home) — appended after the
   * fixed links so every published page automatically shows up in the nav,
   * with no separate "add to menu" step. See app/(marketing)/layout.tsx. */
  customPages?: { slug: string; title: string }[];
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navLinks = [
    ...LINKS.map((link) => ({ href: link.href, label: t(link.key) })),
    ...customPages.map((page) => ({ href: `/${page.slug}`, label: page.title })),
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[padding] duration-300",
        scrolled ? "py-2" : "py-3",
      )}
    >
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <div
          className={cn(
            "glass-strong flex h-14 items-center justify-between rounded-2xl px-3 shadow-lg transition-shadow duration-300 sm:px-4",
            scrolled && "shadow-xl",
          )}
        >
          <Link
            href="/"
            className="group flex items-center gap-2.5 font-display text-[15px] font-semibold"
          >
            <span className="glow-primary flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[var(--gold)] text-primary-foreground transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Car className="size-4" />
            </span>
            <span className="tracking-tight">RentFlow</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute inset-x-3 -bottom-0.5 h-px origin-center scale-x-0 bg-gradient-to-r from-primary to-[var(--gold)] transition-transform duration-300 group-hover:scale-x-100",
                      active && "scale-x-100",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <Button
              asChild
              size="sm"
              className="sheen glow-primary hidden rounded-full bg-gradient-to-r from-primary to-[var(--gold)] font-semibold text-primary-foreground hover:opacity-95 sm:inline-flex"
            >
              <Link href="/vehicles">{tc("bookNow")}</Link>
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label={t("menu")}>
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="marketing-shell w-72 border-border">
                <VisuallyHidden>
                  <SheetTitle>{t("menu")}</SheetTitle>
                </VisuallyHidden>
                <nav className="mt-10 flex flex-col gap-1 px-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:bg-foreground/10"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="mt-4 flex items-center justify-between px-3">
                    <ThemeToggle />
                    <LanguageSwitcher />
                  </div>
                  <div className="mt-2 flex flex-col gap-2 px-3">
                    <Button
                      asChild
                      className="bg-gradient-to-r from-primary to-[var(--gold)] font-semibold"
                    >
                      <Link href="/vehicles" onClick={() => setOpen(false)}>
                        {tc("bookNow")}
                      </Link>
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
