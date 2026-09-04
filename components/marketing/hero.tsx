"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowDown, Check, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/utils";

const TRUST_KEYS = ["cancellation", "airportDelivery", "insurance", "noFees", "support"] as const;

/** Curated fallback for agencies that haven't set their own
 * `Agency.coverImageUrl` yet (verified to load, deliberately picked for a
 * rental-fleet mood — open road, golden hour, mountains — over an
 * exotic-supercar shot). Swapped out automatically the moment an agency
 * uploads its own hero photo. */
const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=2400&q=80";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

/**
 * The hero is a deliberate exception to the site's light/dark toggle: it's a
 * full-bleed photo-with-dark-overlay band so its white text stays legible
 * regardless of the site's light/dark toggle — the same pattern premium
 * sites use for a hero band inside an otherwise light page.
 */
export function Hero({ agency }: { agency: { whatsapp: string | null; coverImageUrl: string | null } }) {
  const t = useTranslations("hero");
  const waLink = whatsappLink(agency.whatsapp, t("whatsappPrefill"));

  return (
    <section className="relative isolate flex min-h-[88svh] items-center overflow-hidden text-white">
      <div className="absolute inset-0 -z-20 bg-[oklch(0.1_0.02_264)]">
        <Image
          src={agency.coverImageUrl || DEFAULT_HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.06_0.01_264)] via-[oklch(0.08_0.015_264)/78%] to-[oklch(0.1_0.02_264)/60%]" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 py-28 text-center sm:py-32 lg:px-6">
        <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.09, delayChildren: 0.05 }}>
          <motion.span
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-white/90 uppercase backdrop-blur-md"
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-red-500" />
            </span>
            {t("badge")}
          </motion.span>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="font-display mt-6 text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl"
          >
            {t("titleLine1")} <span className="text-[var(--gold)]">{t("titleHighlight")}</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto mt-6 max-w-xl text-base text-balance text-white/75 sm:text-lg"
          >
            {t("subtitle")}
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="sheen glow-primary w-full rounded-full bg-gradient-to-r from-primary to-[var(--gold)] px-8 font-semibold text-primary-foreground hover:opacity-95 sm:w-auto"
            >
              <Link href="/vehicles">{t("bookCta")}</Link>
            </Button>
            {waLink && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full rounded-full border-white/25 bg-white/5 px-8 font-semibold text-white backdrop-blur-md hover:bg-white/15 sm:w-auto"
              >
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle /> {t("whatsappCta")}
                </a>
              </Button>
            )}
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2.5 text-xs font-medium text-white/65 sm:text-[13px]"
          >
            {TRUST_KEYS.map((key) => (
              <span key={key} className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 shrink-0 text-[var(--gold)]" />
                {t(`trust.${key}`)}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.1 }}
        className="absolute inset-x-0 bottom-7 flex justify-center"
      >
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-1.5 text-white/50"
        >
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase">{t("scroll")}</span>
          <ArrowDown className="size-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}
