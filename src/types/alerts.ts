export type AlertSeverity = "extreme" | "severe" | "moderate" | "minor";

export interface WeatherAlert {
  id: string;
  location_id: string;
  title: string;
  severity: AlertSeverity;
  description: string;
  issued: number;
  expires: number;
  areas: string[];
}

export const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  extreme: 0,
  severe: 1,
  moderate: 2,
  minor: 3,
};
