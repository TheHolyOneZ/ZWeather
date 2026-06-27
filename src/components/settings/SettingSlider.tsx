interface SettingSliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}

export function SettingSlider({ value, min, max, step, unit, onChange }: SettingSliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="zw-range flex-1"
        style={{
          background: `linear-gradient(to right, rgba(251,191,36,0.55) ${pct}%, color-mix(in srgb, var(--color-foreground) 12%, transparent) ${pct}%)`,
        }}
      />
      <span className="text-[13px] font-medium text-white/85 tabular-nums w-16 text-right">
        {value}{unit ? ` ${unit}` : ""}
      </span>
    </div>
  );
}
