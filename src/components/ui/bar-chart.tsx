import { cn } from "@/lib/cn";

export type BarDatum = { label: string; value: number };

function niceCeil(max: number): number {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const normalized = max / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

/**
 * Single-series bar chart, CSS-only. Marks use --chart-mark (forest) — never
 * lime, which fails contrast on white. Rounded data-ends sit at the top only,
 * anchored to the baseline; grid stays recessive; values appear on hover.
 */
export function BarChart({
  data,
  title,
  formatValue = (v) => v.toLocaleString("en-US"),
  className,
}: {
  data: BarDatum[];
  title: string;
  formatValue?: (value: number) => string;
  className?: string;
}) {
  const top = niceCeil(Math.max(...data.map((d) => d.value)));
  const gridSteps = [1, 0.5, 0];

  return (
    <figure className={cn("w-full", className)}>
      <figcaption className="mb-4 text-sm font-semibold tracking-tight">
        {title}
      </figcaption>

      <div className="flex gap-3">
        {/* y-axis labels */}
        <div className="relative w-10 shrink-0" aria-hidden>
          {gridSteps.map((step) => (
            <span
              key={step}
              className="absolute right-0 -translate-y-1/2 font-mono text-[10px] text-muted-foreground"
              style={{ top: `${(1 - step) * 100}%` }}
            >
              {formatValue(top * step)}
            </span>
          ))}
        </div>

        <div className="relative h-44 flex-1">
          {/* recessive grid */}
          {gridSteps.map((step) => (
            <div
              key={step}
              aria-hidden
              className={cn(
                "absolute inset-x-0 border-t",
                step === 0 ? "border-border" : "border-chart-grid"
              )}
              style={{ top: `${(1 - step) * 100}%` }}
            />
          ))}

          {/* marks */}
          <div className="absolute inset-0 flex items-end justify-around gap-2">
            {data.map((d) => (
              <div
                key={d.label}
                className="group relative flex h-full w-full max-w-10 flex-col items-center justify-end"
              >
                <span
                  className={cn(
                    "pointer-events-none absolute -top-1 -translate-y-full rounded-xs bg-forest-950 px-2 py-1",
                    "font-mono text-[11px] leading-none text-white tabular-nums opacity-0 transition-opacity",
                    "group-hover:opacity-100"
                  )}
                >
                  {formatValue(d.value)}
                </span>
                <div
                  className="w-full rounded-t-[4px] bg-chart-mark transition-colors group-hover:bg-forest-700"
                  style={{ height: `${(d.value / top) * 100}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* x-axis labels */}
      <div className="ml-13 flex justify-around gap-2 pt-2">
        {data.map((d) => (
          <span
            key={d.label}
            className="w-full max-w-10 text-center font-mono text-[10px] text-muted-foreground"
          >
            {d.label}
          </span>
        ))}
      </div>

      {/* data as text for screen readers */}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td>{formatValue(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
