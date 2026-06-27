export type TempUnit = "C" | "F" | "K";
export type WindUnit = "kmh" | "mph" | "ms" | "knots";

export function convertTemp(celsius: number, to: TempUnit): number {
  if (to === "F") return celsius * 9 / 5 + 32;
  if (to === "K") return celsius + 273.15;
  return celsius;
}

export function tempUnitSymbol(u: TempUnit): string {
  if (u === "F") return "°F";
  if (u === "K") return "K";
  return "°";
}

export function formatTemp(celsius: number, unit: TempUnit): string {
  return `${Math.round(convertTemp(celsius, unit))}${tempUnitSymbol(unit)}`;
}

export function convertWind(kmh: number, to: WindUnit): number {
  if (to === "mph") return kmh * 0.621371;
  if (to === "ms")  return kmh / 3.6;
  if (to === "knots") return kmh * 0.539957;
  return kmh;
}

export function windUnitLabel(u: WindUnit): string {
  if (u === "mph") return "mph";
  if (u === "ms") return "m/s";
  if (u === "knots") return "kn";
  return "km/h";
}

export function formatWind(kmh: number, unit: WindUnit): string {
  return `${Math.round(convertWind(kmh, unit))} ${windUnitLabel(unit)}`;
}

export type PrecipUnit = "mm" | "in";

export function convertPrecip(mm: number, to: PrecipUnit): number {
  return to === "in" ? mm * 0.0393701 : mm;
}

export function precipUnitLabel(u: PrecipUnit): string {
  return u === "in" ? "in" : "mm";
}

export function formatPrecip(mm: number, unit: PrecipUnit): string {
  const v = convertPrecip(mm, unit);
  const decimals = unit === "in" ? (v >= 1 ? 1 : 2) : v >= 10 ? 0 : 1;
  return `${v.toFixed(decimals)} ${precipUnitLabel(unit)}`;
}

export type PressureUnit = "hpa" | "inhg" | "mmhg";

export function convertPressure(hpa: number, to: PressureUnit): number {
  if (to === "inhg") return hpa * 0.02953;
  if (to === "mmhg") return hpa * 0.750062;
  return hpa;
}

export function pressureUnitLabel(u: PressureUnit): string {
  if (u === "inhg") return "inHg";
  if (u === "mmhg") return "mmHg";
  return "hPa";
}

export function formatPressure(hpa: number, unit: PressureUnit): string {
  const v = convertPressure(hpa, unit);
  const decimals = unit === "hpa" ? 0 : 2;
  return `${v.toFixed(decimals)} ${pressureUnitLabel(unit)}`;
}
