import { useEffect, useRef } from "react";
import { animate } from "framer-motion";

interface HeroTemperatureProps {
  value: number;
  color?: string;
  unitSymbol?: string;
}

export function HeroTemperature({ value, color, unitSymbol = "°" }: HeroTemperatureProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const controls = animate(prev.current, value, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => { el.textContent = `${Math.round(v)}${unitSymbol}`; },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, unitSymbol]);

  return (
    <span
      ref={ref}
      className="text-[56px] font-semibold leading-none tracking-[-0.025em] font-tabular"
      style={{ color: color ?? "var(--color-foreground)" }}
    >
      {Math.round(value)}{unitSymbol}
    </span>
  );
}
