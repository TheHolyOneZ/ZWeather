import type L from "leaflet";

export interface Frame {
  time: number;
  path: string;
}

export interface LegendStop {
  offset: number;
  color: string;
}

export interface LegendSpec {
  titleKey: string;
  unitKey?: string;
  unitLabel?: string;
  stops: LegendStop[];
  ticks?: { offset: number; label: string }[];
}

export type LayerId = "precip" | "clouds" | "wind" | "temperature";

export interface LayerReadyState {
  ready: boolean;
  loaded: number;
  total: number;
}

export interface CursorReadout {

  temp?: number;

  windSpeed?: number;

  windDir?: number;

  cloud?: number;
}

export interface WeatherLayer {
  id: LayerId;
  mount(map: L.Map): void | Promise<void>;
  unmount(): void;
  setFrame?(frameIdx: number): void;
  getFrames?(): Frame[];
  getLegend(): LegendSpec;
  onReadyChange?(cb: (s: LayerReadyState) => void): () => void;
  onFramesChange?(cb: (f: Frame[]) => void): () => void;

  sampleAt?(lat: number, lon: number): CursorReadout | null;
}
