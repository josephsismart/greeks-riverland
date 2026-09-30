// Hand-drawn style SVG illustrations (no real archive photos are used until families supply them).
import { TOWNS } from "@/data/site";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function Gum({ x, base, s, fill }: { x: number; base: number; s: number; fill: string }) {
  const r = seeded(Math.round(x * 7 + base));
  const blobs = Array.from({ length: 22 }, () => ({
    cx: x + (r() - 0.5) * 130 * s,
    cy: base - (60 + r() * 110) * s,
    rr: (14 + r() * 26) * s,
  }));
  return (
    <g fill={fill}>
      <path d={`M${x - 4 * s} ${base} L${x - 2 * s} ${base - 80 * s} L${x + 2 * s} ${base - 80 * s} L${x + 5 * s} ${base} Z`} />
      <path d={`M${x} ${base - 70 * s} L${x - 30 * s} ${base - 120 * s} M${x} ${base - 75 * s} L${x + 28 * s} ${base - 125 * s}`} stroke={fill} strokeWidth={3 * s} />
      {blobs.map((b, i) => (
        <circle key={i} cx={b.cx} cy={b.cy} r={b.rr} />
      ))}
    </g>
  );
}

function Steamer({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <g fill={fill} transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-90 0 L90 0 L78 14 L-80 14 Z" />
      <rect x="-70" y="-18" width="130" height="18" />
      <rect x="-50" y="-32" width="90" height="14" />
      <rect x="-6" y="-62" width="10" height="30" />
      <rect x="62" y="-20" width="22" height="20" rx="10" />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={-64 + i * 14} y="-14" width="6" height="8" fill="rgba(255,225,170,.55)" />
      ))}
    </g>
  );
}

export function HeroScene() {
  const r = seeded(11);
  const rows = Array.from({ length: 5 }, (_, row) => {
    const y = 520 + row * row * 14 + row * 30;
    const s = 0.45 + row * 0.26;
    const gap = 120 + row * 80;
    const trees: { x: number; y: number; s: number; fruit: { x: number; y: number }[] }[] = [];
    for (let x = -gap / 2 + (row % 2) * (gap / 2); x < 1700; x += gap) {
      trees.push({
        x,
        y,
        s,
        fruit: Array.from({ length: 7 }, () => ({ x: x + (r() - 0.5) * 80 * s, y: y - 60 * s + (r() - 0.5) * 60 * s })),
      });
    }
    return trees;
  });
  return (
    <svg viewBox="0 0 1600 800" preserveAspectRatio="xMidYMid slice" className="art" aria-hidden="true">
      <defs>
        <linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b3226" />
          <stop offset="0.45" stopColor="#8a7457" />
          <stop offset="0.62" stopColor="#d8bf92" />
          <stop offset="1" stopColor="#6d5b3f" />
        </linearGradient>
        <linearGradient id="hriver" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9d7b0" />
          <stop offset="1" stopColor="#b59d72" />
        </linearGradient>
        <radialGradient id="hsun" cx="0.7" cy="0.42" r="0.35">
          <stop offset="0" stopColor="rgba(255,236,196,.85)" />
          <stop offset="1" stopColor="rgba(255,236,196,0)" />
        </radialGradient>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 .35  0 0 0 0 .28  0 0 0 0 .2  0 0 0 .18 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <rect width="1600" height="800" fill="url(#hsky)" />
      <rect width="1600" height="800" fill="url(#hsun)" />
      <path d="M0 440 C200 410 380 430 560 415 C760 398 980 430 1180 412 C1360 398 1480 420 1600 410 L1600 800 L0 800Z" fill="#5d5139" opacity=".85" />
      <path d="M0 470 C260 452 520 478 820 462 C1080 448 1340 474 1600 460 L1600 500 C1340 512 1080 492 820 506 C520 520 260 494 0 510Z" fill="url(#hriver)" />
      <Steamer x={1120} y={482} s={0.75} fill="#3f352a" />
      {[80, 250, 1420, 1540].map((x) => (
        <Gum key={x} x={x} base={470} s={1.1} fill="#3a3126" />
      ))}
      {rows.map((trees, ri) =>
        trees.map((t, ti) => (
          <g key={`${ri}-${ti}`}>
            <ellipse cx={t.x} cy={t.y - 60 * t.s} rx={70 * t.s} ry={56 * t.s} fill={ri % 2 ? "#3f3a26" : "#4a432c"} />
            {t.fruit.map((f, fi) => (
              <circle key={fi} cx={f.x} cy={f.y} r={6 * t.s} fill="#c79a4f" opacity=".9" />
            ))}
            <rect x={t.x - 4 * t.s} y={t.y - 14 * t.s} width={8 * t.s} height={18 * t.s} fill="#2b251b" />
          </g>
        ))
      )}
      <rect width="1600" height="800" filter="url(#grain)" />
    </svg>
  );
}

export function SunsetScene() {
  return (
    <svg viewBox="0 0 1600 500" preserveAspectRatio="xMidYMid slice" className="art" aria-hidden="true">
      <defs>
        <linearGradient id="ssky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b3550" />
          <stop offset="0.5" stopColor="#b8704a" />
          <stop offset="0.7" stopColor="#f0b36d" />
          <stop offset="1" stopColor="#6a3f2a" />
        </linearGradient>
        <linearGradient id="swater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6a462" />
          <stop offset="1" stopColor="#3b2a24" />
        </linearGradient>
      </defs>
      <rect width="1600" height="500" fill="url(#ssky)" />
      <circle cx="820" cy="300" r="46" fill="#ffd89a" opacity=".9" />
      <rect y="320" width="1600" height="180" fill="url(#swater)" />
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x={760 + ((i * 37) % 130) - 40} y={335 + i * 11} width={60 - i * 2} height="2" fill="#ffd89a" opacity={0.6 - i * 0.03} />
      ))}
      {[40, 150, 260, 380, 1180, 1300, 1420, 1540].map((x, i) => (
        <Gum key={x} x={x} base={330} s={0.9 + (i % 3) * 0.15} fill="#1e1712" />
      ))}
      <Steamer x={560} y={338} s={0.9} fill="#1e1712" />
    </svg>
  );
}

export function RiverMap({ interactive = true }: { interactive?: boolean }) {
  const towns = TOWNS.filter((t) => t.x >= 0);
  return (
    <svg viewBox="0 0 600 420" className="map" role="img" aria-label="Illustrated map of Riverland towns along the Murray River">
      <defs>
        <pattern id="paper" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#efe4c8" />
          <circle cx="8" cy="10" r="10" fill="#e8dcbd" />
          <circle cx="30" cy="28" r="12" fill="#eadfc2" />
        </pattern>
      </defs>
      <rect width="600" height="420" rx="18" fill="url(#paper)" />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M0 ${40 + i * 45} C150 ${30 + i * 45} 300 ${55 + i * 45} 600 ${38 + i * 45}`} stroke="#d9cba6" fill="none" />
      ))}
      <ellipse cx="80" cy="215" rx="42" ry="24" fill="#8fb4c4" opacity=".85" />
      <text x="48" y="258" className="map-sm">Lake Bonney</text>
      <path
        d="M-10 260 C60 250 110 220 150 215 C200 210 210 300 250 300 C300 300 240 150 300 130 C360 110 380 180 420 170 C470 158 480 110 540 120 C570 125 590 140 610 150"
        fill="none"
        stroke="#8fb4c4"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d="M-10 260 C60 250 110 220 150 215 C200 210 210 300 250 300 C300 300 240 150 300 130 C360 110 380 180 420 170 C470 158 480 110 540 120 C570 125 590 140 610 150"
        fill="none"
        stroke="#bcd6df"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <text x="395" y="220" className="map-river">Murray River</text>
      {towns.map((t) => {
        const cx = (t.x / 100) * 600;
        const cy = (t.y / 100) * 420;
        const pin = (
          <g className="pin">
            <circle cx={cx} cy={cy} r="9" fill="#8b2e24" />
            <circle cx={cx} cy={cy} r="3.5" fill="#f6efe0" />
            <text x={cx + 14} y={cy + 5} className="map-label">
              {t.name}
            </text>
          </g>
        );
        return interactive ? (
          <a key={t.slug} href={`/towns/${t.slug}`}>
            {pin}
          </a>
        ) : (
          <g key={t.slug}>{pin}</g>
        );
      })}
      <g transform="translate(560 370)">
        <path d="M0 -26 L7 0 L0 -6 L-7 0Z" fill="#1F3A5F" />
        <text x="-5" y="16" className="map-sm">N</text>
      </g>
    </svg>
  );
}

export function OliveBranch({ className = "" }: { className?: string }) {
  // Quadratic stem from (40,280) via (120,150) to (290,30); leaves sit on the stem.
  const P = (t: number) => ({
    x: (1 - t) ** 2 * 40 + 2 * (1 - t) * t * 120 + t * t * 290,
    y: (1 - t) ** 2 * 280 + 2 * (1 - t) * t * 150 + t * t * 30,
  });
  const leaves = Array.from({ length: 12 }, (_, i) => 0.1 + (i / 12) * 0.88);
  return (
    <svg viewBox="0 0 320 300" className={className} aria-hidden="true">
      <path d="M40 280 Q120 150 290 30" stroke="#6b6a3f" strokeWidth="3" fill="none" strokeLinecap="round" />
      {leaves.map((t, i) => {
        const p = P(t);
        const side = i % 2 ? -1 : 1;
        const rot = side * 50 + 35;
        return (
          <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${rot})`}>
            <path d="M0 0 C 10 -12 10 -38 0 -52 C -10 -38 -10 -12 0 0Z" fill={i % 3 ? "#a9ac74" : "#8d9159"} opacity=".92" />
            <path d="M0 -4 L0 -46" stroke="#7d8150" strokeWidth="1" />
          </g>
        );
      })}
      {[0.3, 0.52, 0.7].map((t, i) => {
        const p = P(t);
        return <ellipse key={i} cx={p.x + 12} cy={p.y + 10} rx="7" ry="9.5" fill="#55592e" />;
      })}
    </svg>
  );
}

/** Small scene vignettes used where archive photographs will go. */
export function Vignette({ kind }: { kind: "vineyard" | "river" | "shed" | "church" | "gathering" | "school" }) {
  const common = (
    <defs>
      <linearGradient id={`v-${kind}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d9c9a6" />
        <stop offset="1" stopColor="#9c8763" />
      </linearGradient>
    </defs>
  );
  const ink = "#4a3f2e";
  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="vignette" aria-hidden="true">
      {common}
      <rect width="400" height="260" fill={`url(#v-${kind})`} />
      {kind === "vineyard" && (
        <g>
          <path d="M0 110 C120 100 260 115 400 104 L400 260 L0 260Z" fill="#8a7a55" />
          {Array.from({ length: 14 }, (_, i) => (
            <path key={i} d={`M200 112 L${-260 + i * 60} 260`} stroke={i % 2 ? ink : "#6c6040"} strokeWidth={i % 2 ? 9 : 4} />
          ))}
        </g>
      )}
      {kind === "river" && (
        <g>
          <path d="M0 150 C120 140 280 160 400 146 L400 260 L0 260Z" fill="#c9b793" />
          <path d="M0 160 C140 150 260 172 400 158 L400 190 C260 200 140 182 0 196Z" fill="#e8dcc0" />
          <Steamer x={210} y={170} s={0.55} fill={ink} />
          <Gum x={50} base={160} s={0.8} fill={ink} />
          <Gum x={360} base={160} s={0.7} fill={ink} />
        </g>
      )}
      {kind === "shed" && (
        <g fill={ink}>
          <path d="M40 120 L200 60 L360 120 L360 240 L40 240Z" opacity=".9" />
          <rect x="150" y="150" width="100" height="90" fill="#c9b793" />
          {Array.from({ length: 6 }, (_, i) => (
            <rect key={i} x={60 + (i % 3) * 26} y={200 - Math.floor(i / 3) * 22} width="22" height="18" fill="#b8955b" />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <rect key={`b${i}`} x={268 + (i % 3) * 26} y={200 - Math.floor(i / 3) * 22} width="22" height="18" fill="#b8955b" />
          ))}
        </g>
      )}
      {kind === "church" && (
        <g fill="#f3ead6" stroke={ink} strokeWidth="3">
          <rect x="140" y="110" width="120" height="130" />
          <path d="M130 112 L200 60 L270 112Z" />
          <rect x="185" y="30" width="30" height="40" />
          <path d="M200 8 V30 M190 18 H210" />
          <path d="M180 240 V190 A20 20 0 0 1 220 190 V240" fill="#c9b793" />
          <path d="M0 240 H400" />
        </g>
      )}
      {kind === "gathering" && (
        <g fill={ink}>
          {Array.from({ length: 9 }, (_, i) => (
            <g key={i} transform={`translate(${40 + i * 40} ${150 + (i % 2) * 8})`}>
              <circle cx="0" cy="0" r="12" />
              <path d="M-18 70 C-18 25 18 25 18 70Z" />
            </g>
          ))}
          <path d="M0 230 H400 V260 H0Z" opacity=".5" />
        </g>
      )}
      {kind === "school" && (
        <g fill={ink}>
          <rect x="70" y="100" width="260" height="140" opacity=".9" />
          <path d="M60 104 L200 50 L340 104Z" />
          {Array.from({ length: 5 }, (_, i) => (
            <rect key={i} x={90 + i * 48} y="130" width="28" height="36" fill="#e8dcc0" />
          ))}
          <rect x="180" y="185" width="40" height="55" fill="#e8dcc0" />
        </g>
      )}
      <rect width="400" height="260" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="10" />
    </svg>
  );
}
