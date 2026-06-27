import { getCurrentWindow } from "@tauri-apps/api/window";
import { Loader } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsFetching } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { browserOffsetSeconds } from "@/lib/time";
import { FreshnessBadge } from "./FreshnessBadge";

const win = getCurrentWindow();

interface TitleBarProps {
  locationName?: string;
  tzAbbr?: string;
  tzOffsetSeconds?: number;
  onOpenSettings?: () => void;
  onOpenRadar?: () => void;
  lastUpdatedMs?: number;
  hasData?: boolean;
  isError?: boolean;
  refreshIntervalMs?: number;
}

export function TitleBar({ locationName, tzAbbr, tzOffsetSeconds, onOpenSettings, onOpenRadar, lastUpdatedMs, hasData, isError, refreshIntervalMs }: TitleBarProps) {
  const { t } = useTranslation();
  const fetching = useIsFetching({ queryKey: ["weather"] });
  const showTz =
    tzAbbr &&
    tzOffsetSeconds != null &&
    tzOffsetSeconds !== browserOffsetSeconds();

  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between h-9 px-4 shrink-0 select-none"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >

      <div className="flex items-center gap-2 pointer-events-none">
        <img src="/icon.png" alt="" className="w-[16px] h-[16px] rounded-[3px] select-none" draggable={false} />
        <span className="text-[12px] font-medium text-white/55 tracking-wide">ZWeather</span>
        {locationName && (
          <>
            <span className="text-white/15 text-[12px]">·</span>
            <span className="text-[12px] text-white/20">{locationName}</span>
          </>
        )}
        {showTz && (
          <span className="text-[10px] text-white/35 ml-1 tabular-nums tracking-wide">
            {tzAbbr}
          </span>
        )}
        <AnimatePresence>
          {fetching > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]"
            >
              <Loader size={9} className="text-white/45 animate-spin" />
              <span className="text-[10px] text-white/45 tracking-wide">
                {t("app.apiLoading")}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {lastUpdatedMs != null && refreshIntervalMs != null && (
          <div style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties} className="pointer-events-auto">
            <FreshnessBadge
              lastUpdatedMs={lastUpdatedMs}
              hasData={!!hasData}
              isError={!!isError}
              refreshIntervalMs={refreshIntervalMs}
            />
          </div>
        )}
      </div>


      <div
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {onOpenRadar && (
          <ActionBtn onClick={onOpenRadar} title={t("titlebar.radar")}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="1.6" fill="currentColor" />
              <path d="M9 9 L14.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M9 3 A 6 6 0 0 1 15 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
              <path d="M9 0.8 A 8.2 8.2 0 0 1 17.2 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.4" />
            </svg>
          </ActionBtn>
        )}
        {onOpenSettings && (
          <ActionBtn onClick={onOpenSettings} title={t("titlebar.settings")}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" />
              <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <line x1="9" y1="1.5" x2="9" y2="3.5" />
                <line x1="9" y1="14.5" x2="9" y2="16.5" />
                <line x1="1.5" y1="9" x2="3.5" y2="9" />
                <line x1="14.5" y1="9" x2="16.5" y2="9" />
                <line x1="3.7" y1="3.7" x2="5.1" y2="5.1" />
                <line x1="12.9" y1="12.9" x2="14.3" y2="14.3" />
                <line x1="3.7" y1="14.3" x2="5.1" y2="12.9" />
                <line x1="14.3" y1="3.7" x2="12.9" y2="5.1" />
              </g>
            </svg>
          </ActionBtn>
        )}
        {(onOpenRadar || onOpenSettings) && (
          <div className="w-px h-4 bg-white/[0.08] mx-1.5" aria-hidden />
        )}
        <WinBtn onClick={() => win.minimize()} title={t("titlebar.minimize")}>
          <svg width="10" height="1.5" viewBox="0 0 10 1.5"><rect width="10" height="1.5" rx="0.75" fill="currentColor"/></svg>
        </WinBtn>
        <WinBtn onClick={async () => (await win.isMaximized()) ? win.unmaximize() : win.maximize()} title={t("titlebar.maximize")}>
          <svg width="9" height="9" viewBox="0 0 9 9"><rect x="0.75" y="0.75" width="7.5" height="7.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
        </WinBtn>
        <WinBtn onClick={() => win.close()} title={t("titlebar.close")} close>
          <svg width="9" height="9" viewBox="0 0 9 9">
            <line x1="1" y1="1" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="8" y1="1" x2="1" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </WinBtn>
      </div>
    </div>
  );
}

function WinBtn({
  children,
  onClick,
  title,
  close = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  close?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={[
        "w-[26px] h-[18px] rounded flex items-center justify-center",
        "text-white/30 transition-all duration-150",
        close
          ? "hover:bg-red-500/80 hover:text-white"
          : "hover:bg-white/[0.10] hover:text-white/70",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ActionBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={[
        "w-7 h-7 rounded-md flex items-center justify-center",
        "text-white/55 hover:text-white",
        "hover:bg-white/[0.10] transition-all duration-150",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
