"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";

/**
 * Fade + rise reveal when the element scrolls into view. Uses an explicit
 * IntersectionObserver via `useInView` (robust across SSR/hydration) and, as a
 * safety net, force-reveals shortly after mount so content can never get stuck
 * invisible if the observer never reports (e.g. very short pages / fast scroll).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setFallback(true), 600);
    return () => clearTimeout(id);
  }, []);

  const show = inView || fallback;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.55, delay: show ? delay : 0, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
