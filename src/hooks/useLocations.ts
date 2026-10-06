import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocationsStore } from "@/store/locationsStore";
import { useEffect } from "react";
import { broadcastDataChanged } from "@/lib/crossWindow";

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

  const onLocationsChanged = () => {
    qc.invalidateQueries({ queryKey: ["locations"] });
    broadcastDataChanged("locations");
  };

  const addMutation = useMutation({
    mutationFn: ({ lat, lon, name, geoId }: { lat: number; lon: number; name: string; geoId?: number }) =>
      api.addLocation(lat, lon, name, geoId),
    onSuccess: onLocationsChanged,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.removeLocation(id),
    onSuccess: onLocationsChanged,
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (id: string) => api.setPrimaryLocation(id),
    onSuccess: onLocationsChanged,
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => api.reorderLocations(ids),
    onSuccess: onLocationsChanged,
  });

  return { ...query, addMutation, removeMutation, setPrimaryMutation, reorderMutation };
}
