

export interface BBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface GridSample {
  bbox: BBox;
  size: number;

  temp: Float32Array;

  windU: Float32Array;

  windV: Float32Array;

  windSpeed: Float32Array;

  cloud: Float32Array;
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, { at: number; data: GridSample }>();


const inflight = new Map<string, Promise<GridSample>>();

function bboxKey(b: BBox, size: number): string {


  const r = (v: number) => Math.round(v);
  return `${size}|${r(b.south)},${r(b.west)},${r(b.north)},${r(b.east)}`;
}


let lastRequestAt = 0;
const MIN_REQUEST_INTERVAL_MS = 250;
const MAX_RETRIES = 4;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function rateLimitedFetch(url: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const wait = Math.max(0, lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now());
    if (wait > 0) await delay(wait);
    lastRequestAt = Date.now();
    const res = await fetch(url);
    if (res.status !== 429) return res;
    if (attempt >= MAX_RETRIES) return res;
    const retryAfterHeader = res.headers.get("Retry-After");
    const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : NaN;
    const backoff = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(30_000, retryAfter * 1000)
      : Math.min(15_000, 1000 * Math.pow(2, attempt));
    await delay(backoff);
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}


export function sample(field: Float32Array, size: number, fx: number, fy: number): number {
  const x = clamp(fx, 0, size - 1.0001);
  const y = clamp(fy, 0, size - 1.0001);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const dx = x - x0;
  const dy = y - y0;
  const i00 = y0 * size + x0;
  const i10 = i00 + 1;
  const i01 = i00 + size;
  const i11 = i01 + 1;
  const top = field[i00] * (1 - dx) + field[i10] * dx;
  const bot = field[i01] * (1 - dx) + field[i11] * dx;
  return top * (1 - dy) + bot * dy;
}


export function latLonToGrid(
  lat: number,
  lon: number,
  bbox: BBox,
  size: number,
): { fx: number; fy: number } {
  const fx = ((lon - bbox.west) / (bbox.east - bbox.west)) * (size - 1);

  const fy = ((bbox.north - lat) / (bbox.north - bbox.south)) * (size - 1);
  return { fx, fy };
}

async function fetchBatch(
  lats: number[],
  lons: number[],
): Promise<{
  temperature_2m: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  cloud_cover: number;
}[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lats.join(",")}` +
    `&longitude=${lons.join(",")}` +
    `&current=temperature_2m,wind_speed_10m,wind_direction_10m,cloud_cover` +
    `&wind_speed_unit=kmh&timezone=UTC`;
  const res = await rateLimitedFetch(url);
  if (!res.ok) throw new Error(`grid fetch ${res.status}`);
  const json = await res.json();

  const arr = Array.isArray(json) ? json : [json];
  return arr.map((entry) => entry.current as never);
}

export async function fetchGridSample(bbox: BBox, size = 14): Promise<GridSample> {
  const key = bboxKey(bbox, size);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    try {
      return await fetchGridSampleUncached(bbox, size, key);
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, promise);
  return promise;
}

async function fetchGridSampleUncached(bbox: BBox, size: number, key: string): Promise<GridSample> {

  const lats: number[] = [];
  const lons: number[] = [];
  for (let row = 0; row < size; row++) {
    const t = size === 1 ? 0 : row / (size - 1);
    const lat = bbox.north + (bbox.south - bbox.north) * t;
    for (let col = 0; col < size; col++) {
      const u = size === 1 ? 0 : col / (size - 1);
      const lon = bbox.west + (bbox.east - bbox.west) * u;
      lats.push(+lat.toFixed(3));
      lons.push(+lon.toFixed(3));
    }
  }


  const CHUNK = 100;
  const all: Awaited<ReturnType<typeof fetchBatch>> = [];
  for (let i = 0; i < lats.length; i += CHUNK) {
    const slice = await fetchBatch(lats.slice(i, i + CHUNK), lons.slice(i, i + CHUNK));
    all.push(...slice);
  }

  const n = size * size;
  const temp = new Float32Array(n);
  const windU = new Float32Array(n);
  const windV = new Float32Array(n);
  const windSpeed = new Float32Array(n);
  const cloud = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const c = all[i];
    if (!c) continue;
    temp[i] = c.temperature_2m;
    const spd = c.wind_speed_10m;

    const dirToRad = ((c.wind_direction_10m + 180) % 360) * (Math.PI / 180);

    windU[i] = Math.sin(dirToRad) * spd;
    windV[i] = Math.cos(dirToRad) * spd;
    windSpeed[i] = spd;
    cloud[i] = c.cloud_cover;
  }

  const data: GridSample = { bbox, size, temp, windU, windV, windSpeed, cloud };
  cache.set(key, { at: Date.now(), data });
  return data;
}
