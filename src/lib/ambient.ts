import type { CSSProperties } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export type LoopValue = number | string;
export type LoopProp = "opacity" | "x" | "y" | "scale" | "rotate";
export type LoopKeyframes = Partial<Record<LoopProp, LoopValue | LoopValue[]>>;

export interface LoopTiming {
  duration: number;
  ease?: "linear" | "easeIn" | "easeOut" | "easeInOut";
  delay?: number;
  repeatDelay?: number;
  times?: number[];
}

export type LoopTransition = LoopTiming | Partial<Record<LoopProp, LoopTiming>>;

const EASE: Record<NonNullable<LoopTiming["ease"]>, string> = {
  linear: "linear",
  easeIn: "ease-in",
  easeOut: "ease-out",
  easeInOut: "ease-in-out",
};

const TRANSFORM_PROPS: LoopProp[] = ["x", "y", "scale", "rotate"];

let styleEl: HTMLStyleElement | null = null;
const registered = new Set<string>();

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function registerKeyframes(body: string): string {
  const name = `zwl-${hash(body)}`;
  if (registered.has(name) || typeof document === "undefined") return name;
  registered.add(name);
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "zw-ambient-keyframes";
    document.head.appendChild(styleEl);
  }
  styleEl.appendChild(document.createTextNode(`@keyframes ${name}{${body}}`));
  return name;
}

function isTimingMap(t: LoopTransition): t is Partial<Record<LoopProp, LoopTiming>> {
  return typeof (t as LoopTiming).duration !== "number";
}

function timingFor(t: LoopTransition, prop: LoopProp): LoopTiming {
  if (!isTimingMap(t)) return t;
  return t[prop] ?? { duration: 1 };
}

function asArray(v: LoopValue | LoopValue[]): LoopValue[] {
  if (Array.isArray(v)) return v;
  return [typeof v === "number" ? 0 : "0%", v];
}

function unit(prop: LoopProp, v: LoopValue): string {
  if (typeof v === "string") return v;
  if (prop === "x" || prop === "y") return `${v}px`;
  if (prop === "rotate") return `${v}deg`;
  return String(v);
}

function parseNum(v: LoopValue): { n: number; u: string } {
  if (typeof v === "number") return { n: v, u: "" };
  const m = v.match(/^(-?[\d.]+)(.*)$/);
  return m ? { n: parseFloat(m[1]), u: m[2] } : { n: 0, u: "" };
}

function sampleTrack(values: LoopValue[], offsets: number[], offset: number): LoopValue {
  if (offset <= offsets[0]) return values[0];
  for (let i = 1; i < offsets.length; i++) {
    if (offset <= offsets[i]) {
      const a = parseNum(values[i - 1]);
      const b = parseNum(values[i]);
      const k = (offset - offsets[i - 1]) / (offsets[i] - offsets[i - 1] || 1);
      const n = a.n + (b.n - a.n) * k;
      return typeof values[i] === "number" ? n : `${n}${b.u || a.u}`;
    }
  }
  return values[values.length - 1];
}

function offsetsFor(len: number, timing: LoopTiming): number[] {
  const offs = timing.times && timing.times.length === len
    ? timing.times.slice()
    : Array.from({ length: len }, (_, i) => (len === 1 ? 0 : i / (len - 1)));
  const rd = timing.repeatDelay ?? 0;
  if (rd > 0) {
    const k = timing.duration / (timing.duration + rd);
    return offs.map((o) => o * k);
  }
  return offs;
}

function pct(o: number): string {
  return `${+(o * 100).toFixed(3)}%`;
}

function animationFor(
  body: string,
  timing: LoopTiming,
): string {
  const name = registerKeyframes(body);
  const total = timing.duration + (timing.repeatDelay ?? 0);
  const ease = EASE[timing.ease ?? "easeInOut"];
  return `${name} ${total}s ${ease} ${timing.delay ?? 0}s infinite both`;
}

function opacityAnimation(values: LoopValue[], timing: LoopTiming): string {
  const offs = offsetsFor(values.length, timing);
  let body = offs.map((o, i) => `${pct(o)}{opacity:${values[i]}}`).join("");
  if (timing.repeatDelay) body += `100%{opacity:${values[values.length - 1]}}`;
  return animationFor(body, timing);
}

function transformAnimation(
  tracks: { prop: LoopProp; values: LoopValue[] }[],
  timing: LoopTiming,
): string {
  const perTrack = tracks.map((t) => offsetsFor(t.values.length, timing));
  const union = Array.from(new Set(perTrack.flat())).sort((a, b) => a - b);
  const frame = (o: number) => {
    const v = (p: LoopProp) => {
      const i = tracks.findIndex((t) => t.prop === p);
      return i < 0 ? null : unit(p, sampleTrack(tracks[i].values, perTrack[i], o));
    };
    const x = v("x");
    const y = v("y");
    const s = v("scale");
    const r = v("rotate");
    const parts: string[] = [];
    if (x || y) parts.push(`translate(${x ?? "0px"},${y ?? "0px"})`);
    if (s) parts.push(`scale(${s})`);
    if (r) parts.push(`rotate(${r})`);
    return `transform:${parts.join(" ") || "none"}`;
  };
  let body = union.map((o) => `${pct(o)}{${frame(o)}}`).join("");
  if (timing.repeatDelay) body += `100%{${frame(union[union.length - 1])}}`;
  return animationFor(body, timing);
}

export function loopAnimations(
  animate: LoopKeyframes,
  transition: LoopTransition,
): { opacity: string | null; layers: string[] } {
  let opacity: string | null = null;
  if (animate.opacity !== undefined) {
    opacity = opacityAnimation(asArray(animate.opacity), timingFor(transition, "opacity"));
  }

  const groups = new Map<string, { timing: LoopTiming; tracks: { prop: LoopProp; values: LoopValue[] }[] }>();
  for (const prop of TRANSFORM_PROPS) {
    const v = animate[prop];
    if (v === undefined) continue;
    const timing = timingFor(transition, prop);
    const key = JSON.stringify(timing);
    const g = groups.get(key) ?? { timing, tracks: [] };
    g.tracks.push({ prop, values: asArray(v) });
    groups.set(key, g);
  }
  const layers = Array.from(groups.values()).map((g) => transformAnimation(g.tracks, g.timing));
  return { opacity, layers };
}

export function loopStyle(animate: LoopKeyframes, transition: LoopTransition): CSSProperties {
  const { opacity, layers } = loopAnimations(animate, transition);
  const all = [...layers, ...(opacity ? [opacity] : [])];
  return all.length ? { animation: all.join(",") } : {};
}

let started = false;

export function initAmbientPause(): void {
  if (started || typeof document === "undefined") return;
  started = true;
  const root = document.documentElement;
  let focused = document.hasFocus();

  const apply = () => {
    const paused = document.hidden || !focused;
    if (paused) root.setAttribute("data-ambient-paused", "");
    else root.removeAttribute("data-ambient-paused");
  };

  document.addEventListener("visibilitychange", apply);
  window.addEventListener("focus", () => { focused = true; apply(); });
  window.addEventListener("blur", () => { focused = false; apply(); });
  try {
    getCurrentWindow()
      .onFocusChanged(({ payload }) => {
        focused = payload;
        apply();
      })
      .catch(() => {});
  } catch {
  }
  apply();
}
