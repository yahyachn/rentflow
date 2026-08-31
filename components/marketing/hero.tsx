"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarIcon, Gauge, MapPin, Search, Sparkles, Star } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TiltCard } from "@/components/marketing/tilt-card";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function Hero() {
  const router = useRouter();
  const t = useTranslations("hero");
  const [city, setCity] = useState("");
  const [type, setType] = useState<string>("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (city) params.set("city", city);
    router.push(`/vehicles${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <section className="relative overflow-hidden">
      {/* Floating aurora orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-float-slow absolute -top-24 end-[-6rem] size-[26rem] rounded-full bg-primary/25 blur-3xl" />
        <div className="animate-float absolute top-40 start-[-8rem] size-[22rem] rounded-full bg-[var(--gold)]/15 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-16 lg:grid-cols-[1.05fr_.95fr] lg:px-6 lg:pt-24 lg:pb-24">
        {/* Left — copy + search */}
        <motion.div
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.09 }}
          className="text-center lg:text-start"
        >
          <motion.span
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-foreground/90"
          >
            <Sparkles className="size-3.5 text-[var(--gold)]" />
            {t("badge")}
          </motion.span>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.55 }}
            className="font-display mt-5 text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            {t("titleLine1")}{" "}
            <span className="text-gradient-shimmer">{t("titleHighlight")}</span>
            <br className="hidden sm:block" /> {t("titleLine2")}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.55 }}
            className="text-muted-foreground mx-auto mt-5 max-w-xl text-base text-balance lg:mx-0 lg:text-lg"
          >
            {t("subtitle")}
          </motion.p>

          {/* Search bar */}
          <motion.form
            variants={fadeUp}
            transition={{ duration: 0.55 }}
            onSubmit={handleSearch}
            className="glass-strong mx-auto mt-8 flex max-w-xl flex-col gap-2 rounded-2xl p-2 lg:mx-0 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <MapPin className="text-muted-foreground pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2" />
              <Input
                placeholder={t("cityPlaceholder")}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="border-0 bg-transparent ps-9 shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="bg-border hidden h-8 w-px sm:block" />
            <div className="flex-1">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full border-0 bg-transparent shadow-none focus-visible:ring-0">
                  <CalendarIcon className="text-muted-foreground size-4" />
                  <SelectValue placeholder={t("typePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAR">{t("cars")}</SelectItem>
                  <SelectItem value="MOTORCYCLE">{t("motorcycles")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              size="lg"
              className="sheen glow-primary rounded-xl bg-gradient-to-r from-primary to-[var(--gold)] font-semibold text-primary-foreground hover:opacity-95 sm:w-auto"
            >
              <Search /> {t("searchCta")}
            </Button>
          </motion.form>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.55 }}
            className="text-muted-foreground/80 mt-4 text-xs"
          >
            {t("trustNote")}
          </motion.p>
        </motion.div>

        {/* Right — 3D showcase card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto w-full max-w-sm lg:max-w-none"
        >
          <TiltCard className="relative">
            <div className="glass-strong relative overflow-hidden rounded-3xl p-6">
              <div className="absolute -top-16 end-[-4rem] size-56 rounded-full bg-primary/30 blur-3xl" />
              <div className="relative flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gold)]/15 px-3 py-1 text-xs font-medium text-[var(--gold-soft)]">
                  <Star className="size-3.5 fill-current" /> {t("cardTitle")}
                </span>
                <span className="text-muted-foreground text-xs">{t("cardSubtitle")}</span>
              </div>

              {/* Stylized vehicle silhouette */}
              <div
                className="relative mt-6 flex h-40 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-transparent"
                style={{ transform: "translateZ(40px)" }}
              >
                <Gauge className="size-20 text-primary/80" strokeWidth={1.25} />
                <div className="animate-pulse-glow absolute inset-0 -z-10 rounded-2xl bg-primary/20 blur-2xl" />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3" style={{ transform: "translateZ(28px)" }}>
                {[
                  { v: "150+", k: t("statVehicles") },
                  { v: "24/7", k: t("statSupport") },
                  { v: "100%", k: t("statBooking") },
                ].map((s) => (
                  <div key={s.k} className="glass rounded-xl p-3 text-center">
                    <p className="font-display text-lg font-semibold text-foreground">{s.v}</p>
                    <p className="text-muted-foreground mt-0.5 text-[11px] leading-tight">{s.k}</p>
                  </div>
                ))}
              </div>
            </div>
          </TiltCard>
        </motion.div>
      </div>
    </section>
  );
}
