import { motion } from "framer-motion";

interface ToggleSwitchProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

export function ToggleSwitch({ value, onChange }: ToggleSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
        value
          ? "bg-amber-400/30 border-amber-400/50"
          : "bg-white/[0.06] border-white/[0.10]"
      }`}
    >
      <motion.span
        className={`block h-4 w-4 rounded-full shadow ${value ? "bg-amber-200" : "bg-white/55"}`}
        animate={{ x: value ? 22 : 4 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
      />
    </button>
  );
}
