import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSettingsStore } from "@/store/settingsStore";

function useRefreshMs() {
  const minutes = useSettingsStore((s) => s.settings.refresh_interval_minutes);
  return Math.max(1, minutes) * 60 * 1000;
}

export function useCurrentWeather(locationId: string | null) {
  const refetchInterval = useRefreshMs();
  return useQuery({
    queryKey: ["weather", "current", locationId],
    queryFn: () => api.getCurrentWeather(locationId!),
    enabled: !!locationId,
    refetchInterval,
  });
}

export function useHourlyForecast(locationId: string | null) {
  const refetchInterval = useRefreshMs();
  return useQuery({
    queryKey: ["weather", "hourly", locationId],
    queryFn: () => api.getHourlyForecast(locationId!),
    enabled: !!locationId,
    refetchInterval,
  });
}

export function useDailyForecast(locationId: string | null) {
  const refetchInterval = useRefreshMs();
  return useQuery({
    queryKey: ["weather", "daily", locationId],
    queryFn: () => api.getDailyForecast(locationId!),
    enabled: !!locationId,
    refetchInterval,
  });
}

export function useAlerts(locationId: string | null) {
  const refetchInterval = useRefreshMs();
  return useQuery({
    queryKey: ["weather", "alerts", locationId],
    queryFn: () => api.getAlerts(locationId!),
    enabled: !!locationId,
    refetchInterval,
  });
}

export function useAirQuality(locationId: string | null) {
  const refetchInterval = useRefreshMs();
  return useQuery({
    queryKey: ["weather", "airQuality", locationId],
    queryFn: () => api.getAirQuality(locationId!),
    enabled: !!locationId,
    staleTime: 30 * 60 * 1000,
    refetchInterval,
  });
}
