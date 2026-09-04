"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { whatsappLink } from "@/lib/utils";

/** Floating WhatsApp button shown on every public page — hidden entirely if
 * the agency hasn't set a WhatsApp number in Settings > Contact (no dead
 * CTA). The number is never hardcoded, see lib/utils.ts#whatsappLink. */
export function FloatingWhatsapp({ number }: { number: string | null }) {
  const t = useTranslations("common");
  const th = useTranslations("hero");
  const href = whatsappLink(number, th("whatsappPrefill"));
  if (!href) return null;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("whatsappUs")}
      initial={{ opacity: 0, scale: 0.7, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="group fixed end-5 bottom-5 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_28px_-6px_rgba(37,211,102,0.65)]"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/50 [animation-duration:2.5s] group-hover:hidden" />
      <MessageCircle className="relative size-6 fill-white text-[#25D366]" />
      <span className="bg-popover text-popover-foreground border-border pointer-events-none absolute end-full me-3 top-1/2 -translate-y-1/2 rounded-md border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
        {t("whatsappUs")}
      </span>
    </motion.a>
  );
}
