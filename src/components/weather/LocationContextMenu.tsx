import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Star, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LocationContextMenuProps {
  x: number;
  y: number;
  isPrimary: boolean;
  onSetPrimary: () => void;
  onRemove: () => void;
  onClose: () => void;
}

export function LocationContextMenu({
  x,
  y,
  isPrimary,
  onSetPrimary,
  onRemove,
  onClose,
}: LocationContextMenuProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);


  const menuW = 200;
  const menuH = isPrimary ? 48 : 88;
  const safeX = Math.min(x, window.innerWidth - menuW - 8);
  const safeY = Math.min(y, window.innerHeight - menuH - 8);

  return createPortal(
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.96, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="fixed glass-popover rounded-xl py-1 overflow-hidden"
      style={{ left: safeX, top: safeY, width: menuW, zIndex: 9999 }}
    >
      {!isPrimary && (
        <button
          onClick={() => { onSetPrimary(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-white/80 hover:bg-white/[0.06] hover:text-white transition-colors text-left"
        >
          <Star size={13} className="text-yellow-400/80 shrink-0" />
          <span>{t("actions.setPrimary")}</span>
        </button>
      )}
      <button
        onClick={() => { onRemove(); onClose(); }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-300/85 hover:bg-red-500/15 hover:text-red-200 transition-colors text-left"
      >
        <Trash2 size={13} className="shrink-0" />
        <span>{t("actions.removeLocation")}</span>
      </button>
    </motion.div>,
    document.body
  );
}
