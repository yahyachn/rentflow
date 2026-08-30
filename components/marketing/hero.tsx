"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, MapPin, Search } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Hero() {
  const router = useRouter();
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_55%)]" />
      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-14 lg:px-6 lg:pt-24 lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="bg-accent/10 text-accent inline-flex items-center rounded-full px-3 py-1 text-xs font-medium">
            Now booking across Morocco
          </span>
          <h1 className="font-display mt-4 text-4xl leading-tight font-semibold text-balance sm:text-5xl">
            Rent your next car or motorcycle, hassle-free.
          </h1>
          <p className="text-muted-foreground mt-4 text-lg text-balance">
            Transparent pricing, verified vehicles, and instant reservation requests —
            straight from a fleet run on RentFlow.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onSubmit={handleSearch}
          className="bg-card mx-auto mt-10 flex max-w-3xl flex-col gap-3 rounded-xl border p-3 shadow-sm sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <MapPin className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Pickup city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="border-0 pl-9 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="bg-border hidden h-8 w-px sm:block" />
          <div className="flex-1">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full border-0 shadow-none focus-visible:ring-0">
                <CalendarIcon className="text-muted-foreground size-4" />
                <SelectValue placeholder="Vehicle type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CAR">Cars</SelectItem>
                <SelectItem value="MOTORCYCLE">Motorcycles</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" size="lg" className="sm:w-auto">
            <Search /> Search vehicles
          </Button>
        </motion.form>
      </div>
    </section>
  );
}
