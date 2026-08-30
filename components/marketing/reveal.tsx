"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Scroll-reveal (fade + rise) built on a CSS class toggle rather than a JS
 * animation loop. This is deliberate: rAF-driven animations freeze while the
 * tab is backgrounded, which can leave content stuck invisible. Toggling a
 * class applies the final computed style even when frozen, so content is
 * guaranteed to become visible. An IntersectionObserver drives the on-scroll
 * timing; a short timeout is a safety net so nothing can ever stay hidden.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      el.classList.add("reveal-play");
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) show();
      },
      { rootMargin: "-60px 0px" },
    );
    io.observe(el);

    // Safety net — fires even in a backgrounded tab so content can't stay hidden.
    const t = window.setTimeout(show, 700);

    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  return (
    <div ref={ref} className={cn("reveal", className)} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
