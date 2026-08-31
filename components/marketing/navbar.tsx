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
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", key: "home" },
  { href: "/vehicles", key: "vehicles" },
  { href: "/about", key: "about" },
  { href: "/faq", key: "faq" },
  { href: "/contact", key: "contact" },
] as const;

export function MarketingNavbar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "py-2" : "py-3",
      )}
    >
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <div
          className={cn(
            "flex h-14 items-center justify-between rounded-2xl px-3 transition-all duration-300 sm:px-4",
            scrolled ? "glass-strong shadow-lg" : "border border-transparent",
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
            {LINKS.map((link) => {
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
                  {t(link.key)}
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
            <LanguageSwitcher />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              <Link href="/login">{tc("signIn")}</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="sheen glow-primary hidden rounded-full bg-gradient-to-r from-primary to-[var(--gold)] font-semibold text-primary-foreground hover:opacity-95 sm:inline-flex"
            >
              <Link href="/register">{tc("startTrial")}</Link>
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label={t("menu")}>
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="dark marketing-shell w-72 border-white/10">
                <VisuallyHidden>
                  <SheetTitle>{t("menu")}</SheetTitle>
                </VisuallyHidden>
                <nav className="mt-10 flex flex-col gap-1 px-4">
                  {LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:bg-white/10"
                    >
                      {t(link.key)}
                    </Link>
                  ))}
                  <div className="mt-4 flex flex-col gap-2 px-3">
                    <Button asChild variant="outline">
                      <Link href="/login" onClick={() => setOpen(false)}>
                        {tc("signIn")}
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="bg-gradient-to-r from-primary to-[var(--gold)] font-semibold"
                    >
                      <Link href="/register" onClick={() => setOpen(false)}>
                        {tc("startTrial")}
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
