import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/i18n";

interface LanguageSelectProps {
  value: LanguageCode;
  onChange: (lang: LanguageCode) => void;
}

export function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; maxHeight: number; placement: "below" | "above" } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const r = triggerRef.current!.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const desiredHeight = SUPPORTED_LANGUAGES.length * 36 + 8;
      const spaceBelow = vh - r.bottom - 12;
      const spaceAbove = r.top - 12;
      const placement: "below" | "above" = spaceBelow >= desiredHeight || spaceBelow >= spaceAbove ? "below" : "above";
      const maxHeight = placement === "below" ? spaceBelow : spaceAbove;
      const top = placement === "below" ? r.bottom + 6 : Math.max(8, r.top - 6 - Math.min(desiredHeight, maxHeight));
      const left = Math.min(Math.max(8, r.left), vw - r.width - 8);
      setRect({ top, left, width: r.width, maxHeight, placement });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === value) ?? SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((s) => !s)}
        className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14] transition-colors flex items-center justify-between text-left"
      >
        <span className="text-[13px] font-medium text-white/85">{current.label}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="text-white/40"
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && rect && (
            <motion.ul
              ref={menuRef}
              initial={{ opacity: 0, y: rect.placement === "below" ? -4 : 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: rect.placement === "below" ? -4 : 4, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed z-[100] glass-popover rounded-xl py-1 overflow-y-auto no-scrollbar shadow-2xl"
              style={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                maxHeight: rect.maxHeight,
              }}
            >
              {SUPPORTED_LANGUAGES.map((lang) => {
                const active = lang.code === value;
                return (
                  <li key={lang.code}>
                    <button
                      onClick={() => {
                        onChange(lang.code);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-[13px] transition-colors ${
                        active ? "bg-white/[0.07] text-white" : "text-white/75 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <span>{lang.label}</span>
                      {active && <Check size={13} className="text-white/70" />}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
