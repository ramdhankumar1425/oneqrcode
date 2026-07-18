import { cn } from "@/lib/cn";

/**
 * Static decorative QR mark. Deterministic (seeded) so server and client render
 * the same matrix — purely visual, not a scannable code.
 */
const N = 25;

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildMatrix(seed: number): boolean[][] {
  const rand = mulberry32(seed);
  const m: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

  const finder = (cx: number, cy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const border = x === 0 || x === 6 || y === 0 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        m[cy + y][cx + x] = border || core;
      }
    }
  };
  finder(0, 0);
  finder(N - 7, 0);
  finder(0, N - 7);

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const inFinder =
        (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
      if (inFinder) continue;
      m[y][x] = rand() < 0.46;
    }
  }
  return m;
}

const MATRIX = buildMatrix(20260717);

export function QrMark({
  className,
  seed,
}: {
  className?: string;
  seed?: number;
}) {
  const matrix = seed === undefined ? MATRIX : buildMatrix(seed);
  return (
    <svg
      viewBox={`0 0 ${N} ${N}`}
      className={cn("h-full w-full", className)}
      role="img"
      aria-label="QR code"
      shapeRendering="crispEdges"
    >
      {matrix.flatMap((row, y) =>
        row.map((on, x) =>
          on ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill="currentColor"
            />
          ) : null
        )
      )}
    </svg>
  );
}
