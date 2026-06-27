import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PillGroupProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

export function SettingPillGroup<T extends string>({ options, value, onChange }: PillGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <motion.button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "h-9 px-3.5 rounded-xl text-[13px] font-medium border transition-colors",
              active
                ? "bg-white/[0.12] border-white/20 text-white shadow-[0_0_0_3px_rgba(255,255,255,0.04)]"
                : "bg-transparent border-white/[0.08] hover:border-white/15 hover:bg-white/[0.04] text-white/55 hover:text-white/90"
            )}
          >
            {opt.label}
          </motion.button>
        );
      })}
    </div>
  );
}
