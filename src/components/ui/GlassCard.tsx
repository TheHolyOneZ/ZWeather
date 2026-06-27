import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  elevated?: boolean;
}

export function GlassCard({ children, className, onClick, elevated = false }: GlassCardProps) {
  return (
    <motion.div
      className={cn(elevated ? "glass-popover" : "glass", "rounded-2xl", className)}
      onClick={onClick}
      whileHover={onClick ? { y: -1, transition: { type: "spring", stiffness: 500, damping: 35 } } : undefined}
      whileTap={onClick ? { scale: 0.97 } : undefined}
    >
      {children}
    </motion.div>
  );
}
