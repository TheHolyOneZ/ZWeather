

const RAD = Math.PI / 180;
const SYNODIC_MONTH = 29.530588853;
const MOON_RADIUS_KM = 1737.4;


const NEW_MOON_REF_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

function toJulian(date: Date): number {
  return date.getTime() / 86400000 - 0.5 + 2440588;
}

function daysSinceJ2000(date: Date): number {
  return toJulian(date) - 2451545.0;
}


export type MoonPhaseKey =
  | "new" | "waxCrescent" | "firstQ" | "waxGibbous"
  | "full" | "wanGibbous" | "lastQ" | "wanCrescent";

export interface MoonPhaseInfo {

  phase: number;
  labelKey: `moon.${MoonPhaseKey}`;

  illumination: number;

  ageDays: number;
}

export function getMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  const elapsed = (date.getTime() - NEW_MOON_REF_MS) / 86400000;
  const cycles = elapsed / SYNODIC_MONTH;
  const phase = ((cycles % 1) + 1) % 1;
  const ageDays = phase * SYNODIC_MONTH;
  const illumination = Math.round(50 * (1 - Math.cos(phase * 2 * Math.PI)));

  let labelKey: MoonPhaseInfo["labelKey"];
  if (phase < 0.03 || phase > 0.97) labelKey = "moon.new";
  else if (phase < 0.22) labelKey = "moon.waxCrescent";
  else if (phase < 0.28) labelKey = "moon.firstQ";
  else if (phase < 0.47) labelKey = "moon.waxGibbous";
  else if (phase < 0.53) labelKey = "moon.full";
  else if (phase < 0.72) labelKey = "moon.wanGibbous";
  else if (phase < 0.78) labelKey = "moon.lastQ";
  else labelKey = "moon.wanCrescent";

  return { phase, labelKey, illumination, ageDays };
}


interface MoonPosition {

  ra: number;

  dec: number;

  distance: number;

  eclipticLon: number;
}

function moonPosition(date: Date): MoonPosition {
  const d = daysSinceJ2000(date);


  const L = 218.316 + 13.176396 * d;
  const M = 134.963 + 13.064993 * d;
  const F = 93.272 + 13.229350 * d;


  const lambda = L + 6.289 * Math.sin(M * RAD);
  const beta = 5.128 * Math.sin(F * RAD);

  const distance = 385001 - 20905 * Math.cos(M * RAD);

  const eps = 23.4397 * RAD;
  const lam = lambda * RAD;
  const bet = beta * RAD;

  const ra = Math.atan2(
    Math.sin(lam) * Math.cos(eps) - Math.tan(bet) * Math.sin(eps),
    Math.cos(lam),
  );
  const dec = Math.asin(
    Math.sin(bet) * Math.cos(eps) + Math.cos(bet) * Math.sin(eps) * Math.sin(lam),
  );

  return { ra, dec, distance, eclipticLon: ((lambda % 360) + 360) % 360 };
}

export interface MoonGeometry {

  distance: number;

  angularDiameterArcmin: number;

  perigeeApogeeT: number;

  eclipticLon: number;
}

const PERIGEE_KM = 356500;
const APOGEE_KM = 406700;

export function getMoonGeometry(date: Date = new Date()): MoonGeometry {
  const pos = moonPosition(date);
  const angularDiameterRad = 2 * Math.atan(MOON_RADIUS_KM / pos.distance);
  const angularDiameterArcmin = (angularDiameterRad / RAD) * 60;
  const t = Math.max(0, Math.min(1, (pos.distance - PERIGEE_KM) / (APOGEE_KM - PERIGEE_KM)));
  return {
    distance: pos.distance,
    angularDiameterArcmin,
    perigeeApogeeT: t,
    eclipticLon: pos.eclipticLon,
  };
}


function gmst(date: Date): number {
  const d = daysSinceJ2000(date);
  const T = d / 36525;
  const deg = 280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - (T * T * T) / 38710000;
  return ((deg % 360) + 360) * RAD;
}


export function moonAltitude(date: Date, lat: number, lon: number): number {
  const pos = moonPosition(date);
  const lst = gmst(date) + lon * RAD;
  const H = lst - pos.ra;
  const phi = lat * RAD;
  const sinAlt = Math.sin(phi) * Math.sin(pos.dec) + Math.cos(phi) * Math.cos(pos.dec) * Math.cos(H);
  return Math.asin(sinAlt) / RAD;
}


export interface MoonRiseSet {
  rise?: number;
  set?: number;
  transit?: number;
}

const HORIZON_DEG = -0.583;

export function moonRiseSet(date: Date, lat: number, lon: number): MoonRiseSet {
  const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const stepMin = 10;
  const totalSamples = (24 * 60) / stepMin + 1;
  const alts: { t: Date; a: number }[] = [];
  for (let i = 0; i < totalSamples; i++) {
    const t = new Date(dayStart.getTime() + i * stepMin * 60_000);
    alts.push({ t, a: moonAltitude(t, lat, lon) - HORIZON_DEG });
  }

  const result: MoonRiseSet = {};
  let bestTransit: { t: Date; a: number } | null = null;

  for (let i = 0; i < alts.length - 1; i++) {
    const a = alts[i];
    const b = alts[i + 1];
    if (a.a < 0 && b.a >= 0 && result.rise === undefined) {
      result.rise = Math.round(refineCrossing(a.t, b.t, lat, lon) / 1000);
    }
    if (a.a >= 0 && b.a < 0 && result.set === undefined) {
      result.set = Math.round(refineCrossing(a.t, b.t, lat, lon) / 1000);
    }
    if (!bestTransit || alts[i].a + HORIZON_DEG > bestTransit.a) {
      bestTransit = { t: alts[i].t, a: alts[i].a + HORIZON_DEG };
    }
  }
  if (bestTransit && bestTransit.a > 0) {
    result.transit = Math.round(bestTransit.t.getTime() / 1000);
  }
  return result;
}

function refineCrossing(a: Date, b: Date, lat: number, lon: number): number {
  let lo = a.getTime();
  let hi = b.getTime();
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    const v = moonAltitude(new Date(mid), lat, lon) - HORIZON_DEG;
    if (v < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}


export interface PrincipalPhase {

  time: number;
  kind: "new" | "firstQ" | "full" | "lastQ";
  labelKey: `moon.${"new" | "firstQ" | "full" | "lastQ"}`;
}


export function upcomingPhases(date: Date = new Date(), count = 4): PrincipalPhase[] {
  const out: PrincipalPhase[] = [];
  const elapsedCycles = (date.getTime() - NEW_MOON_REF_MS) / 86400000 / SYNODIC_MONTH;

  let qIndex = Math.ceil(elapsedCycles * 4);
  while (out.length < count) {
    const t = NEW_MOON_REF_MS + (qIndex / 4) * SYNODIC_MONTH * 86400000;
    const remainder = ((qIndex % 4) + 4) % 4;
    const map: Record<number, PrincipalPhase["kind"]> = { 0: "new", 1: "firstQ", 2: "full", 3: "lastQ" };
    const kind = map[remainder];
    out.push({ time: Math.round(t / 1000), kind, labelKey: `moon.${kind}` });
    qIndex++;
  }
  return out;
}


export function moonZodiac(date: Date = new Date()): { signKey: string; symbol: string; lon: number } {
  const { eclipticLon } = getMoonGeometry(date);
  const idx = Math.floor(eclipticLon / 30) % 12;
  const signs = [
    { signKey: "aries", symbol: "♈" },
    { signKey: "taurus", symbol: "♉" },
    { signKey: "gemini", symbol: "♊" },
    { signKey: "cancer", symbol: "♋" },
    { signKey: "leo", symbol: "♌" },
    { signKey: "virgo", symbol: "♍" },
    { signKey: "libra", symbol: "♎" },
    { signKey: "scorpio", symbol: "♏" },
    { signKey: "sagittarius", symbol: "♐" },
    { signKey: "capricorn", symbol: "♑" },
    { signKey: "aquarius", symbol: "♒" },
    { signKey: "pisces", symbol: "♓" },
  ];
  return { ...signs[idx], lon: eclipticLon };
}


export function formatDistance(km: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.round(km));
}
