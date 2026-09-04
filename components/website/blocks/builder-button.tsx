import Link from "next/link";

import type { Locale } from "@/i18n/config";
import type { ButtonConfig } from "@/validators/website-blocks";
import { pickText } from "@/components/website/locale-text";
import { resolveLink, type LinkAgencyContact } from "@/components/website/link-target";
import { cn } from "@/lib/utils";

const STYLE_CLASS: Record<ButtonConfig["style"], string> = {
  primary:
    "sheen glow-primary bg-gradient-to-r from-primary to-[var(--gold)] text-primary-foreground hover:opacity-95",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
  outline: "border border-border bg-transparent hover:bg-foreground/5",
  ghost: "hover:bg-foreground/5",
};

/** Renders a builder-configured button, or nothing if it has no label/link
 * (an empty button slot in a Hero/CTA block simply doesn't render). */
export function BuilderButton({
  button,
  agency,
  locale,
  className,
}: {
  button: ButtonConfig;
  agency: LinkAgencyContact;
  locale: Locale;
  className?: string;
}) {
  const label = pickText(button.label, locale);
  const href = resolveLink(button.link, agency);
  if (!label || !href) return null;

  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform duration-300 hover:scale-[1.03]",
    STYLE_CLASS[button.style],
    className,
  );

  const isInternal = href.startsWith("/") || href.startsWith("#");
  if (isInternal) {
    return (
      <Link href={href} className={classes}>
        {label}
      </Link>
    );
  }
  return (
    <a href={href} className={classes} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
      {label}
    </a>
  );
}
