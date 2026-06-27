import { useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Github, Globe, Download, Boxes, ExternalLink, X } from "lucide-react";
import { openExternal } from "@/lib/openExternal";

interface AboutDialogProps {
  onClose: () => void;
}

const STACK = [
  "Tauri 2",
  "Rust",
  "React 19",
  "TypeScript",
  "Tailwind",
  "Framer Motion",
  "React Query",
  "Zustand",
  "Lucide",
];

const LINKS: { key: string; href: string; icon: typeof Github; label: string; sub: string }[] = [
  {
    key: "website",
    href: "https://zsync.eu/zweather/",
    icon: Download,
    label: "zsync.eu/zweather",
    sub: "Website & downloads",
  },
  {
    key: "source",
    href: "https://github.com/TheHolyOneZ/ZWeather",
    icon: Github,
    label: "github.com/TheHolyOneZ/ZWeather",
    sub: "Source code",
  },
  {
    key: "author",
    href: "https://github.com/TheHolyOneZ",
    icon: Github,
    label: "github.com/TheHolyOneZ",
    sub: "Author",
  },
  {
    key: "projects",
    href: "https://zsync.eu",
    icon: Globe,
    label: "zsync.eu",
    sub: "More projects",
  },
];

export function AboutDialog({ onClose }: AboutDialogProps) {
  const { t } = useTranslation();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(6, 8, 14, 0.55)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      />

      <motion.div
        className="relative w-full max-w-[440px] rounded-2xl border border-white/[0.08] bg-[#0c0f18]/95 shadow-2xl overflow-hidden"
        initial={{ scale: 0.94, y: 10, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-32 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(125,211,252,0.10) 0%, transparent 70%)",
          }}
        />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-white/45 hover:text-white/90 hover:bg-white/[0.06] transition-colors z-10"
          title={t("settings.close")}
          aria-label={t("settings.close")}
        >
          <X size={15} />
        </button>

        <div className="relative px-6 pt-7 pb-4 flex flex-col items-center text-center">
          <img
            src="/icon.png"
            alt="ZWeather"
            className="w-[68px] h-[68px] rounded-2xl shadow-lg select-none mb-3"
            draggable={false}
          />
          <h2 className="text-[20px] font-semibold text-white tracking-tight">ZWeather</h2>
          <p className="text-[11.5px] text-white/45 mt-1 tabular-nums">
            {t("about.versionLabel")} 0.1.0 · GPL-3.0
          </p>
          <p className="text-[13px] text-white/70 mt-3 leading-relaxed max-w-[360px]">
            {t("about.description")}
          </p>
        </div>

        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Boxes size={12} className="text-white/45" />
            <p className="text-[10px] uppercase tracking-widest text-white/55 font-semibold">
              {t("about.stackTitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STACK.map((s) => (
              <span
                key={s}
                className="text-[11px] text-white/75 bg-white/[0.045] border border-white/[0.07] rounded-md px-2 py-0.5"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="px-5 pb-5 pt-2">
          <div className="flex items-center gap-2 mb-2 px-1">
            <ExternalLink size={12} className="text-white/45" />
            <p className="text-[10px] uppercase tracking-widest text-white/55 font-semibold">
              {t("about.linksTitle")}
            </p>
          </div>
          <ul className="space-y-1.5">
            {LINKS.map((l) => {
              const Icon = l.icon;
              return (
                <li key={l.key}>
                  <button
                    type="button"
                    onClick={() => openExternal(l.href)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.14] transition-colors text-left group"
                  >
                    <span className="w-8 h-8 rounded-md bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-white/80 shrink-0">
                      <Icon size={15} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[12.5px] text-white/90 font-medium leading-tight truncate">
                        {t(`about.link_${l.key}`)}
                      </span>
                      <span className="block text-[11px] text-white/45 leading-tight truncate">
                        {l.label}
                      </span>
                    </span>
                    <ExternalLink
                      size={13}
                      className="text-white/35 group-hover:text-white/75 transition-colors shrink-0"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="px-6 py-3 border-t border-white/[0.05] bg-white/[0.015] text-center">
          <p className="text-[10.5px] text-white/40 leading-snug">{t("about.tagline")}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
