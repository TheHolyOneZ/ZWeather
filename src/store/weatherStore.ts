import { create } from "zustand";
import type { CurrentWeather } from "@/types/weather";
import type { WeatherAlert } from "@/types/alerts";

interface WeatherStore {
  currentByLocation: Record<string, CurrentWeather>;
  alertsByLocation: Record<string, WeatherAlert[]>;
  setCurrent: (locationId: string, weather: CurrentWeather) => void;
  setAlerts: (locationId: string, alerts: WeatherAlert[]) => void;
  hasActiveAlerts: () => boolean;
}

export const useWeatherStore = create<WeatherStore>((set, get) => ({
  currentByLocation: {},
  alertsByLocation: {},
  setCurrent: (locationId, weather) =>
    set((state) => ({
      currentByLocation: { ...state.currentByLocation, [locationId]: weather },
    })),
  setAlerts: (locationId, alerts) =>
    set((state) => ({
      alertsByLocation: { ...state.alertsByLocation, [locationId]: alerts },
    })),
  hasActiveAlerts: () =>
    Object.values(get().alertsByLocation).some((a) => a.length > 0),
}));
