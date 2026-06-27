import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocationsStore } from "@/store/locationsStore";
import { useEffect } from "react";

export function useLocations() {
  const { setLocations } = useLocationsStore();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["locations"],
    queryFn: api.getLocations,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (query.data) setLocations(query.data);
  }, [query.data, setLocations]);

  const addMutation = useMutation({
    mutationFn: ({ lat, lon, name, geoId }: { lat: number; lon: number; name: string; geoId?: number }) =>
      api.addLocation(lat, lon, name, geoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.removeLocation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (id: string) => api.setPrimaryLocation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => api.reorderLocations(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
  });

  return { ...query, addMutation, removeMutation, setPrimaryMutation, reorderMutation };
}
