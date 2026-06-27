

const cache = new Map<string, Promise<string>>();

const ANIM_TAGS = ["animate", "animateTransform", "animateMotion", "animateColor", "set"];

function stripAnimations(svg: string): string {
  let out = svg;
  for (const tag of ANIM_TAGS) {
    out = out.replace(new RegExp(`<${tag}\\b[^>]*/>`, "g"), "");
    out = out.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}>`, "g"), "");
  }
  return out;
}


interface ParentAccum {
  transformOrigin?: string;
  animations: string[];
}

let animCounter = 0;
function nextId(): string {
  animCounter = (animCounter + 1) % 1_000_000;
  return `zw${animCounter}`;
}


let headStyleEl: HTMLStyleElement | null = null;
function appendKeyframes(blocks: string[]): void {
  if (typeof document === "undefined" || blocks.length === 0) return;
  if (!headStyleEl) {
    const existing = document.getElementById("zw-meteocon-anims");
    if (existing && existing.tagName === "STYLE") {
      headStyleEl = existing as HTMLStyleElement;
    } else {
      headStyleEl = document.createElement("style");
      headStyleEl.id = "zw-meteocon-anims";
      document.head.appendChild(headStyleEl);
    }
  }
  headStyleEl.appendChild(document.createTextNode(blocks.join("")));
}

function parseRotationCenter(values: string | null, from: string | null): { cx: number; cy: number } {
  const first = (values?.split(";")[0] ?? from ?? "0 32 32").trim().split(/\s+/);
  return {
    cx: parseFloat(first[1] ?? "32") || 32,
    cy: parseFloat(first[2] ?? "32") || 32,
  };
}


function smilToCss(svg: string, stripRotate = false): string {
  if (typeof DOMParser === "undefined") return svg;
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  } catch {
    return svg;
  }
  const root = doc.documentElement;
  if (!root || root.querySelector("parsererror")) return svg;

  const parents = new Map<Element, ParentAccum>();
  const keyframeBlocks: string[] = [];

  function accFor(parent: Element): ParentAccum {
    let a = parents.get(parent);
    if (!a) {
      a = { animations: [] };
      parents.set(parent, a);
    }
    return a;
  }


  Array.from(root.getElementsByTagName("animateTransform")).forEach((anim) => {
    const parent = anim.parentElement;
    if (!parent) return;
    const type = anim.getAttribute("type");
    const dur = anim.getAttribute("dur") || "1s";
    const begin = anim.getAttribute("begin") || "0s";
    const values = anim.getAttribute("values");
    const from = anim.getAttribute("from");

    if (type === "rotate") {
      if (stripRotate) {
        anim.remove();
        return;
      }
      const { cx, cy } = parseRotationCenter(values, from);
      const id = nextId();
      keyframeBlocks.push(
        `@keyframes ${id}{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`
      );
      const acc = accFor(parent);
      acc.transformOrigin = `${cx}px ${cy}px`;
      acc.animations.push(`${id} ${dur} linear ${begin} infinite`);
    } else if (type === "translate" && values) {
      const vals = values.split(/\s*;\s*/).map((v) => {
        const [x, y] = v.split(/\s+/);
        return { x: parseFloat(x) || 0, y: parseFloat(y || "0") || 0 };
      });
      if (vals.length === 0) {
        anim.remove();
        return;
      }


      const last = vals[vals.length - 1];
      const first = vals[0];
      const oscillating =
        vals.length >= 3 &&
        Math.abs(first.x - last.x) < 0.5 &&
        Math.abs(first.y - last.y) < 0.5;
      const id = nextId();
      const stops = vals
        .map((v, i) => {
          const pct = (i / (vals.length - 1)) * 100;
          return `${pct}%{transform:translate(${v.x}px,${v.y}px)}`;
        })
        .join("");
      keyframeBlocks.push(`@keyframes ${id}{${stops}}`);
      const ease = oscillating ? "ease-in-out" : "linear";
      accFor(parent).animations.push(`${id} ${dur} ${ease} ${begin} infinite`);
    }
    anim.remove();
  });


  Array.from(root.getElementsByTagName("animate")).forEach((anim) => {
    const parent = anim.parentElement;
    if (!parent) {
      anim.remove();
      return;
    }
    const attr = anim.getAttribute("attributeName");
    const dur = anim.getAttribute("dur") || "1s";
    const begin = anim.getAttribute("begin") || "0s";
    const values = anim.getAttribute("values");

    if (attr === "opacity" && values) {
      const vals = values.split(/\s*;\s*/).map((v) => parseFloat(v));
      if (vals.every((n) => Number.isFinite(n)) && vals.length >= 2) {
        const id = nextId();
        const stops = vals
          .map((v, i) => {
            const pct = (i / (vals.length - 1)) * 100;
            return `${pct}%{opacity:${v}}`;
          })
          .join("");
        keyframeBlocks.push(`@keyframes ${id}{${stops}}`);
        accFor(parent).animations.push(`${id} ${dur} linear ${begin} infinite`);
      }
    }
    anim.remove();
  });


  ["animateMotion", "animateColor", "set"].forEach((tag) => {
    Array.from(root.getElementsByTagName(tag)).forEach((el) => el.remove());
  });


  parents.forEach((acc, parent) => {
    const pieces: string[] = ["transform-box:view-box"];
    if (acc.transformOrigin) pieces.push(`transform-origin:${acc.transformOrigin}`);
    if (acc.animations.length) pieces.push(`animation:${acc.animations.join(",")}`);
    const existing = parent.getAttribute("style") || "";
    parent.setAttribute("style", existing ? `${existing};${pieces.join(";")}` : pieces.join(";"));
  });


  appendKeyframes(keyframeBlocks);

  return new XMLSerializer().serializeToString(root);
}

export function loadSvg(
  url: string,
  stripAnim = false,
  stripRotate = false,
): Promise<string> {
  const key = `${url}|${stripAnim ? "static" : stripRotate ? "norot" : "css"}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const p = fetch(url)
    .then((r) => r.text())
    .then((t) =>
      stripAnim ? stripAnimations(t) : smilToCss(t, stripRotate),
    )
    .catch(() => "");
  cache.set(key, p);
  return p;
}
