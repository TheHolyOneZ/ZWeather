import { motion } from "framer-motion";
import { useMemo } from "react";

interface RealisticMoonProps {

  phase: number;

  size: number;

  librationDeg?: number;

  apparentScale?: number;
}

interface Crater {
  cx: number;
  cy: number;
  r: number;

  depth: number;

  sharpness: number;
}

interface Mare {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotate: number;
  darkness: number;
}


const MARIA: Mare[] = [

  { cx: 36, cy: 32, rx: 13, ry: 10, rotate: -18, darkness: 0.68 },

  { cx: 56, cy: 32, rx: 9, ry: 8, rotate: 5, darkness: 0.62 },

  { cx: 64, cy: 42, rx: 9, ry: 7, rotate: 10, darkness: 0.58 },

  { cx: 68, cy: 52, rx: 6, ry: 8, rotate: -8, darkness: 0.55 },

  { cx: 62, cy: 56, rx: 5, ry: 5, rotate: 0, darkness: 0.55 },

  { cx: 36, cy: 60, rx: 6, ry: 6, rotate: 0, darkness: 0.52 },

  { cx: 44, cy: 60, rx: 8, ry: 6, rotate: -5, darkness: 0.50 },

  { cx: 42, cy: 50, rx: 7, ry: 4, rotate: 15, darkness: 0.45 },

  { cx: 28, cy: 48, rx: 8, ry: 16, rotate: -8, darkness: 0.55 },
  { cx: 30, cy: 38, rx: 6, ry: 8, rotate: 0, darkness: 0.50 },

  { cx: 50, cy: 22, rx: 18, ry: 3, rotate: -8, darkness: 0.45 },

  { cx: 74, cy: 36, rx: 5, ry: 4, rotate: 12, darkness: 0.65 },
];


const CRATERS: Crater[] = [

  { cx: 46, cy: 70, r: 2.2, depth: 0.7, sharpness: 1.0 },

  { cx: 40, cy: 46, r: 1.8, depth: 0.65, sharpness: 0.9 },

  { cx: 32, cy: 46, r: 1.0, depth: 0.5, sharpness: 0.8 },

  { cx: 28, cy: 40, r: 0.9, depth: 0.4, sharpness: 0.9 },

  { cx: 44, cy: 22, r: 1.5, depth: 0.8, sharpness: 0.6 },

  { cx: 42, cy: 76, r: 3.0, depth: 0.6, sharpness: 0.5 },

  { cx: 22, cy: 52, r: 1.4, depth: 0.7, sharpness: 0.6 },

  { cx: 74, cy: 50, r: 1.6, depth: 0.55, sharpness: 0.7 },

  { cx: 62, cy: 28, r: 1.2, depth: 0.45, sharpness: 0.6 },

  { cx: 60, cy: 50, r: 1.3, depth: 0.55, sharpness: 0.7 },
  { cx: 58, cy: 53, r: 1.1, depth: 0.5, sharpness: 0.6 },
  { cx: 60, cy: 56, r: 1.2, depth: 0.45, sharpness: 0.5 },

  { cx: 52, cy: 64, r: 0.7, depth: 0.45, sharpness: 0.7 },
  { cx: 56, cy: 68, r: 0.9, depth: 0.5, sharpness: 0.7 },
  { cx: 38, cy: 62, r: 0.6, depth: 0.4, sharpness: 0.6 },
  { cx: 48, cy: 54, r: 0.6, depth: 0.45, sharpness: 0.7 },
  { cx: 54, cy: 38, r: 0.7, depth: 0.4, sharpness: 0.6 },
  { cx: 50, cy: 44, r: 0.5, depth: 0.35, sharpness: 0.6 },
  { cx: 70, cy: 62, r: 0.8, depth: 0.4, sharpness: 0.5 },
  { cx: 30, cy: 64, r: 0.7, depth: 0.4, sharpness: 0.5 },
  { cx: 26, cy: 30, r: 0.6, depth: 0.35, sharpness: 0.5 },
  { cx: 70, cy: 24, r: 0.6, depth: 0.35, sharpness: 0.5 },
  { cx: 66, cy: 68, r: 0.5, depth: 0.35, sharpness: 0.4 },
];

const TYCHO_RAYS = [
  { angle: -30, length: 22, width: 1.0 },
  { angle: -10, length: 26, width: 1.4 },
  { angle: 15, length: 28, width: 1.2 },
  { angle: 45, length: 24, width: 1.0 },
  { angle: 75, length: 22, width: 0.9 },
  { angle: 110, length: 18, width: 0.8 },
  { angle: 140, length: 24, width: 1.1 },
  { angle: 170, length: 20, width: 0.9 },
  { angle: 200, length: 26, width: 1.2 },
  { angle: 230, length: 22, width: 1.0 },
];

export function RealisticMoon({
  phase,
  size,
  librationDeg = 0,
  apparentScale = 1,
}: RealisticMoonProps) {
  const vb = 100;
  const cx = 50;
  const cy = 50;
  const r = 44;


  const phaseAngle = (phase - 0.5) * 2 * Math.PI;
  const isWaxing = phase < 0.5;
  const isNew = phase <= 0.02 || phase >= 0.98;
  const isFull = phase >= 0.48 && phase <= 0.52;


  const ellipseRx = Math.abs(r * Math.cos(phaseAngle));

  const litPath = useMemo(() => {
    if (isNew || isFull) return "";

    const sweep = isWaxing ? 0 : 1;
    const innerSweep = phase < 0.25 || phase > 0.75 ? 0 : 1;
    return `
      M ${cx} ${cy - r}
      A ${r} ${r} 0 0 ${isWaxing ? 1 : 0} ${cx} ${cy + r}
      A ${ellipseRx} ${r} 0 ${sweep} ${innerSweep} ${cx} ${cy - r}
      Z
    `;
  }, [phase, isWaxing, isNew, isFull, ellipseRx]);

  const idSuffix = useMemo(() => Math.random().toString(36).slice(2, 8), []);
  const id = (n: string) => `${n}-${idSuffix}`;

  return (
    <div style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${vb} ${vb}`}
        style={{
          transform: `rotate(${librationDeg}deg) scale(${apparentScale})`,
          transformOrigin: "center",
        }}
      >
        <defs>


          <radialGradient id={id("surface")} cx={isWaxing ? "30%" : "70%"} cy="32%" r="78%">
            <stop offset="0%" stopColor="#f1e8d8" />
            <stop offset="30%" stopColor="#dccbb0" />
            <stop offset="55%" stopColor="#b8a486" />
            <stop offset="78%" stopColor="#7c6f5e" />
            <stop offset="100%" stopColor="#43392f" />
          </radialGradient>


          <radialGradient id={id("highlight")} cx={isWaxing ? "26%" : "74%"} cy="26%" r="32%">
            <stop offset="0%" stopColor="rgba(255,250,235,0.55)" />
            <stop offset="60%" stopColor="rgba(255,250,235,0.10)" />
            <stop offset="100%" stopColor="rgba(255,250,235,0)" />
          </radialGradient>


          <radialGradient id={id("limb")} cx="50%" cy="50%" r="50%">
            <stop offset="78%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(20,15,8,0.65)" />
          </radialGradient>


          <radialGradient id={id("earthshine")} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(100,130,200,0.10)" />
            <stop offset="80%" stopColor="rgba(70,90,140,0.05)" />
            <stop offset="100%" stopColor="rgba(40,60,100,0)" />
          </radialGradient>


          <linearGradient
            id={id("terminator")}
            x1={isWaxing ? "30%" : "70%"}
            y1="0%"
            x2={isWaxing ? "70%" : "30%"}
            y2="0%"
          >
            <stop offset="0%" stopColor="rgba(255,240,210,0)" />
            <stop offset="60%" stopColor="rgba(80,60,40,0.20)" />
            <stop offset="100%" stopColor="rgba(20,15,10,0.85)" />
          </linearGradient>


          <radialGradient id={id("mare")} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3a3a42" />
            <stop offset="70%" stopColor="#46464e" />
            <stop offset="100%" stopColor="rgba(70,70,80,0)" />
          </radialGradient>


          <radialGradient id={id("crater")} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(18,12,6,0.85)" />
            <stop offset="55%" stopColor="rgba(40,30,18,0.55)" />
            <stop offset="100%" stopColor="rgba(60,48,30,0)" />
          </radialGradient>


          <radialGradient id={id("craterSharp")} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(10,6,2,0.95)" />
            <stop offset="75%" stopColor="rgba(40,28,16,0.5)" />
            <stop offset="100%" stopColor="rgba(80,60,40,0)" />
          </radialGradient>


          <filter id={id("texture")} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="2" seed="11" />
            <feColorMatrix values="0 0 0 0 0.32  0 0 0 0 0.28  0 0 0 0 0.22  0 0 0 0.18 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>


          <filter id={id("mareBlur")} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>


          <radialGradient id={id("ray")} cx="50%" cy="0%" r="100%">
            <stop offset="0%" stopColor="rgba(245,232,205,0.55)" />
            <stop offset="80%" stopColor="rgba(245,232,205,0.05)" />
            <stop offset="100%" stopColor="rgba(245,232,205,0)" />
          </radialGradient>

          <clipPath id={id("disc")}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>

          {!isNew && !isFull && (
            <clipPath id={id("lit")}>
              <path d={litPath} />
            </clipPath>
          )}
        </defs>


        <circle
          cx={cx}
          cy={cy}
          r={r + 6}
          fill="none"
          stroke="rgba(255,245,220,0.06)"
          strokeWidth="6"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r + 2}
          fill="none"
          stroke="rgba(255,245,220,0.14)"
          strokeWidth="1.5"
        />


        {!isFull && (
          <g clipPath={`url(#${id("disc")})`}>
            <circle cx={cx} cy={cy} r={r} fill="#0c1018" />
            <circle cx={cx} cy={cy} r={r} fill={`url(#${id("earthshine")})`} />

            <g opacity={isNew ? 0.18 : 0.06}>
              {MARIA.slice(0, 6).map((m, i) => (
                <ellipse
                  key={`dm-${i}`}
                  cx={m.cx}
                  cy={m.cy}
                  rx={m.rx}
                  ry={m.ry}
                  fill="rgba(50,60,90,0.6)"
                  transform={`rotate(${m.rotate} ${m.cx} ${m.cy})`}
                />
              ))}
            </g>
          </g>
        )}


        <g clipPath={!isNew && !isFull ? `url(#${id("lit")})` : undefined}>
          <g clipPath={`url(#${id("disc")})`}>

            <circle cx={cx} cy={cy} r={r} fill={`url(#${id("surface")})`} />

            <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} filter={`url(#${id("texture")})`} />

            <g filter={`url(#${id("mareBlur")})`}>
              {MARIA.map((m, i) => (
                <ellipse
                  key={`m-${i}`}
                  cx={m.cx}
                  cy={m.cy}
                  rx={m.rx}
                  ry={m.ry}
                  fill={`url(#${id("mare")})`}
                  opacity={m.darkness}
                  transform={`rotate(${m.rotate} ${m.cx} ${m.cy})`}
                />
              ))}
            </g>

            <g opacity="0.85">
              {TYCHO_RAYS.map((ray, i) => {
                const cxTycho = 46;
                const cyTycho = 70;
                const rad = ray.angle * (Math.PI / 180);
                const x2 = cxTycho + Math.cos(rad) * ray.length;
                const y2 = cyTycho + Math.sin(rad) * ray.length;
                return (
                  <line
                    key={`ray-${i}`}
                    x1={cxTycho}
                    y1={cyTycho}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(245,232,205,0.18)"
                    strokeWidth={ray.width}
                    strokeLinecap="round"
                  />
                );
              })}

              <circle cx={46} cy={70} r={1.4} fill="rgba(255,245,215,0.7)" />
            </g>

            {CRATERS.map((c, i) => {
              const litOffsetX = isWaxing ? -c.r * 0.28 : c.r * 0.28;
              const litOffsetY = -c.r * 0.28;
              const shadowOffsetX = -litOffsetX * 0.7;
              const shadowOffsetY = -litOffsetY * 0.7;
              return (
                <g key={`c-${i}`}>

                  <circle
                    cx={c.cx + shadowOffsetX}
                    cy={c.cy + shadowOffsetY}
                    r={c.r * 1.15}
                    fill={c.sharpness > 0.75 ? `url(#${id("craterSharp")})` : `url(#${id("crater")})`}
                    opacity={c.depth}
                  />

                  <circle
                    cx={c.cx + litOffsetX}
                    cy={c.cy + litOffsetY}
                    r={c.r * 0.55}
                    fill="rgba(255,248,225,0.20)"
                  />
                </g>
              );
            })}

            <circle cx={cx} cy={cy} r={r} fill={`url(#${id("highlight")})`} />

            {!isFull && (
              <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={`url(#${id("terminator")})`} />
            )}

            <circle cx={cx} cy={cy} r={r} fill={`url(#${id("limb")})`} />
          </g>
        </g>


        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,245,220,0.18)" strokeWidth="0.4" />
      </svg>
    </div>
  );
}


export function BreathingMoon(props: RealisticMoonProps) {
  return (
    <motion.div
      animate={{ y: [0, -4, 0], rotate: [-0.6, 0.6, -0.6] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
    >
      <RealisticMoon {...props} />
    </motion.div>
  );
}
