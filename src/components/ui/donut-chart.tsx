import { cn } from "@/lib/cn";

export type DonutDatum = { label: string; value: number };

// forest scale only — lime fails contrast on white (same rule as bar-chart)
const PALETTE = [
  "#0c1f15", // forest-950
  "#224e36", // forest-700
  "#357a50", // forest-500
  "#55926c", // forest-400
  "#85b295", // forest-300
  "#b2cfbb", // forest-200
];

const RADIUS = 42;
const STROKE = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Compact donut with a legend. Segments use the forest scale; a recessive track
 * shows through when empty. Center shows the total. Values are also exposed as
 * an sr-only table.
 */
export function DonutChart({
  title,
  data,
  className,
}: {
  title: string;
  data: DonutDatum[];
  className?: string;
}) {
  const sorted = [...data]
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, d) => sum + d.value, 0);

  let offset = 0;

  return (
    <figure className={cn("w-full", className)}>
      <figcaption className="mb-4 text-sm font-semibold tracking-tight">
        {title}
      </figcaption>

      {total === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No data yet.
        </p>
      ) : (
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <svg viewBox="0 0 100 100" className="size-28 -rotate-90">
              <circle
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                stroke="var(--color-chart-grid)"
                strokeWidth={STROKE}
              />
              {sorted.map((d, i) => {
                const len = (d.value / total) * CIRCUMFERENCE;
                const seg = (
                  <circle
                    key={d.label}
                    cx="50"
                    cy="50"
                    r={RADIUS}
                    fill="none"
                    stroke={PALETTE[i % PALETTE.length]}
                    strokeWidth={STROKE}
                    strokeDasharray={`${len} ${CIRCUMFERENCE - len}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += len;
                return seg;
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-semibold tabular-nums">
                {total.toLocaleString("en-US")}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
                scans
              </span>
            </div>
          </div>

          <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
            {sorted.map((d, i) => (
              <li
                key={d.label}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: PALETTE[i % PALETTE.length] }}
                  />
                  <span className="truncate">{d.label}</span>
                </span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {Math.round((d.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th scope="col">Scans</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td>{d.value.toLocaleString("en-US")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
