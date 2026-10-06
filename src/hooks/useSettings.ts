import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSettingsStore, type AppSettings } from "@/store/settingsStore";
import { useEffect } from "react";
import { broadcastDataChanged } from "@/lib/crossWindow";

export function useSettings() {
  const { setSettings } = useSettingsStore();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["settings"],
    queryFn: api.getSettings,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (query.data) setSettings(query.data);
  }, [query.data, setSettings]);

  const saveMutation = useMutation({
    mutationFn: (settings: AppSettings) => api.updateSettings(settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      broadcastDataChanged("settings");
    },
  });

  return { ...query, saveMutation };
}
