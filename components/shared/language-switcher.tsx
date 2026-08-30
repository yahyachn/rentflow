"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLocaleAction } from "@/actions/locale";
import { locales, localeNames, localeLabels, isLocale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const active = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(locale: string) {
    if (locale === active) return;
    startTransition(async () => {
      await setLocaleAction(locale);
      router.refresh();
    });
  }

  const label = isLocale(active) ? localeLabels[active] : "FR";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        className={cn(
          "border-border bg-muted/50 text-foreground/80 hover:bg-muted focus-visible:ring-ring/50 inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium backdrop-blur transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60",
          className,
        )}
        aria-label="Change language"
      >
        <Globe className="size-4" />
        <span className="tabular-nums">{label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onSelect={() => choose(locale)}
            className="flex items-center justify-between gap-3"
          >
            <span>{localeNames[locale]}</span>
            {locale === active && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
