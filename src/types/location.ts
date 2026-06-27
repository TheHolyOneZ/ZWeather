export interface Location {
  id: string;
  name: string;
  display_name: string;
  latitude: number;
  longitude: number;
  is_primary: boolean;
  sort_order: number;
  geo_id?: number | null;
}

export interface GeocodingResult {
  geo_id: number;
  name: string;
  display_name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}
