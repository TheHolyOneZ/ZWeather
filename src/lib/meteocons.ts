

const BASE = "/weather-icons";
const BASE_FILL = "/weather-icons-fill";

export type MeteoconName =
  | "clear-day" | "clear-night"
  | "partly-cloudy-day" | "partly-cloudy-night"
  | "overcast-day" | "overcast-night" | "overcast" | "cloudy"
  | "fog-day" | "fog-night" | "fog"
  | "mist" | "haze"
  | "drizzle" | "partly-cloudy-day-drizzle" | "partly-cloudy-night-drizzle"
  | "rain" | "partly-cloudy-day-rain" | "partly-cloudy-night-rain"
  | "sleet" | "hail"
  | "snow" | "partly-cloudy-day-snow" | "partly-cloudy-night-snow"
  | "thunderstorms" | "thunderstorms-day" | "thunderstorms-night"
  | "thunderstorms-rain" | "thunderstorms-day-rain" | "thunderstorms-night-rain"
  | "not-available";

export function meteoconUrl(name: MeteoconName): string {
  return `${BASE}/${name}.svg`;
}

export function meteoconUrlFill(name: MeteoconName): string {
  return `${BASE_FILL}/${name}.svg`;
}


export function wmoToMeteocon(code: number, isDay = true): MeteoconName {

  if (code === 0) return isDay ? "clear-day" : "clear-night";
  if (code === 1) return isDay ? "clear-day" : "clear-night";
  if (code === 2) return isDay ? "partly-cloudy-day" : "partly-cloudy-night";
  if (code === 3) return isDay ? "overcast-day" : "overcast-night";


  if (code === 45 || code === 48) return isDay ? "fog-day" : "fog-night";


  if (code >= 51 && code <= 57) {
    return isDay ? "partly-cloudy-day-drizzle" : "partly-cloudy-night-drizzle";
  }


  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return isDay ? "partly-cloudy-day-rain" : "partly-cloudy-night-rain";
  }


  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return isDay ? "partly-cloudy-day-snow" : "partly-cloudy-night-snow";
  }


  if (code === 95) return isDay ? "thunderstorms-day" : "thunderstorms-night";
  if (code === 96 || code === 99) return "thunderstorms-day-rain";

  return "not-available";
}


export function meteoconCloud(): string {
  return meteoconUrlFill("cloudy");
}
