import { create } from "zustand";
import type { Location } from "@/types/location";

interface LocationsStore {
  locations: Location[];
  activeLocationId: string | null;
  setLocations: (locations: Location[]) => void;
  setActiveLocation: (id: string) => void;
  addLocation: (location: Location) => void;
  removeLocation: (id: string) => void;
}

export const useLocationsStore = create<LocationsStore>((set) => ({
  locations: [],
  activeLocationId: null,
  setLocations: (locations) =>
    set({
      locations,
      activeLocationId: locations.find((l) => l.is_primary)?.id ?? locations[0]?.id ?? null,
    }),
  setActiveLocation: (id) => set({ activeLocationId: id }),
  addLocation: (location) =>
    set((state) => ({ locations: [...state.locations, location] })),
  removeLocation: (id) =>
    set((state) => ({ locations: state.locations.filter((l) => l.id !== id) })),
}));
