export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatTemp(value: number, unit: "C" | "F" | "K"): string {
  if (unit === "F") return `${Math.round(value * 9 / 5 + 32)}°F`;
  if (unit === "K") return `${Math.round(value + 273.15)}K`;
  return `${Math.round(value)}°C`;
}

export function formatWind(kmh: number, unit: "kmh" | "mph" | "ms" | "knots"): string {
  if (unit === "mph")   return `${Math.round(kmh * 0.621371)} mph`;
  if (unit === "ms")    return `${Math.round(kmh / 3.6)} m/s`;
  if (unit === "knots") return `${Math.round(kmh * 0.539957)} kn`;
  return `${Math.round(kmh)} km/h`;
}

export function windDirectionLabel(degrees: number): string {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(degrees / 45) % 8];
}

export function uvIndexLabel(uv: number): string {
  if (uv < 3)  return "Low";
  if (uv < 6)  return "Moderate";
  if (uv < 8)  return "High";
  if (uv < 11) return "Very High";
  return "Extreme";
}
