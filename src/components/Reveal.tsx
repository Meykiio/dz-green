import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Canopy scroll-reveal (SSOT §LIFE LAYER): content fades and slides in the
 * first time it enters the viewport. Runs once per mount; reduced-motion
 * renders everything visible immediately (no movement).
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** Stagger delay in ms (entrance choreography). */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn("ga-reveal", shown && "ga-revealed", className)}
    >
      {children}
    </div>
  );
}
