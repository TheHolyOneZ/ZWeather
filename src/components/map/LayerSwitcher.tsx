import { CloudRain, Cloud, Wind, Thermometer } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { LayerId } from "@/lib/mapLayers/types";

interface Props {
  active: LayerId;
  onChange: (id: LayerId) => void;
}

const LAYERS: { id: LayerId; icon: typeof CloudRain; labelKey: string }[] = [
  { id: "precip",      icon: CloudRain,   labelKey: "radar.layers.precipitation" },
  { id: "clouds",      icon: Cloud,       labelKey: "radar.layers.clouds" },
  { id: "wind",        icon: Wind,        labelKey: "radar.layers.wind" },
  { id: "temperature", icon: Thermometer, labelKey: "radar.layers.temperature" },
];

export function LayerSwitcher({ active, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div className="absolute top-3 right-3 z-[420] pointer-events-auto">
      <div className="rounded-2xl bg-black/65 border border-white/[0.08] backdrop-blur-md shadow-lg p-1 flex gap-0.5">
        {LAYERS.map((l) => {
          const Icon = l.icon;
          const isActive = l.id === active;
          return (
            <button
              key={l.id}
              onClick={() => onChange(l.id)}
              className={
                "group flex items-center gap-1.5 px-2.5 h-8 rounded-xl text-[11px] font-medium transition-all " +
                (isActive
                  ? "bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-[0_2px_10px_rgba(124,58,237,0.35)]"
                  : "text-white/65 hover:text-white hover:bg-white/[0.06]")
              }
              title={t(l.labelKey)}
            >
              <Icon size={13} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="hidden md:inline">{t(l.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
